from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.models import MarketingProspect
from app.schemas.marketing_prospects import (
    MarketingProspectCreate,
    MarketingProspectInternalSection,
    MarketingProspectRead,
    MarketingProspectStatusEvent,
)
from app.services.automation_service import log_automation_event
from app.services.internal_alerts_service import create_internal_alert

STATUS_LABELS = {
    "nuevo",
    "revisado",
    "contactado",
    "propuesta_enviada",
    "en_negociacion",
    "ganado",
    "perdido",
}


def _clamp(value: Decimal, minimum: Decimal, maximum: Decimal) -> Decimal:
    return min(maximum, max(minimum, value))


def _compute_internal_prequote(payload: MarketingProspectCreate) -> dict:
    products_to_promote = int(payload.products_to_promote or 1)
    average_ticket = Decimal(str(payload.average_ticket_mxn or 0))
    complexity_score = (
        (2 if products_to_promote >= 200 else 1 if products_to_promote >= 80 else 0)
        + (1 if payload.needs_extra_landing else 0)
        + (1 if payload.needs_extra_ecommerce else 0)
        + (1 if payload.needs_commercial_tracking else 0)
    )
    maturity_score = (
        (1 if payload.has_landing else 0)
        + (1 if payload.has_ecommerce else 0)
        + (1 if (payload.active_social_networks or "").strip() else 0)
        + (1 if (payload.offer_clarity or "").strip().lower() in {"alta", "clara"} else 0)
    )
    intensity_score = (
        (3 if payload.urgency == "inmediata" else 2 if payload.urgency == "alta" else 1 if payload.urgency == "media" else 0)
        + (2 if payload.followup_level == "alto" else 1 if payload.followup_level == "medio" else 0)
        + (1 if payload.wants_custom_proposal else 0)
    )
    potential_score = (
        (3 if average_ticket >= Decimal("2000") else 2 if average_ticket >= Decimal("900") else 1)
        + (2 if (payload.offer_clarity or "").strip().lower() in {"alta", "clara"} else 1 if (payload.offer_clarity or "").strip().lower() in {"parcial", "media"} else 0)
        + (1 if payload.has_ecommerce or payload.has_landing else 0)
    )

    combined = (complexity_score * 2) + (intensity_score * 2) + potential_score - Decimal(str(maturity_score)) * Decimal("0.5")
    min_price = Decimal("4990")
    max_price = Decimal("8990")
    if Decimal("8") <= combined < Decimal("13"):
        min_price, max_price = Decimal("12000"), Decimal("20000")
    elif Decimal("13") <= combined < Decimal("18"):
        min_price, max_price = Decimal("20000"), Decimal("35000")
    elif combined >= Decimal("18"):
        min_price, max_price = Decimal("35000"), Decimal("60000")

    midpoint = (min_price + max_price) / Decimal("2")
    urgency_lift = Decimal("2500") if payload.urgency == "inmediata" else Decimal("1500") if payload.urgency == "alta" else Decimal("0")
    infra_lift = (Decimal("1000") if payload.needs_extra_landing else Decimal("0")) + (Decimal("1500") if payload.needs_extra_ecommerce else Decimal("0"))
    suggested = _clamp(midpoint + urgency_lift + infra_lift, min_price, max_price).quantize(Decimal("0.01"))

    opportunity_level = "alta" if potential_score >= 5 else "media" if potential_score >= 3 else "controlada"
    channel = payload.desired_conversion_channel
    kpis = (
        "Publicaciones emitidas, visitas, clics en CTA, leads y tasa de conversion."
        if channel in {"whatsapp", "formulario"}
        else "Publicaciones, visitas, productos vistos, carritos, checkouts y conversion."
        if channel == "ecommerce"
        else "Publicaciones, visitas de landing, clics clave y formularios calificados."
    )
    recommended_services = [
        "Plan mensual de mercadotecnia digital",
        "Seguimiento comercial y tablero ejecutivo",
    ]
    if payload.needs_extra_landing:
        recommended_services.append("Diseno o ajuste de landing comercial")
    if payload.needs_extra_ecommerce:
        recommended_services.append("Diseno o ajuste de ecommerce")
    if payload.needs_commercial_tracking:
        recommended_services.append("Implementacion de seguimiento comercial")

    risks = [
        "Resultado sujeto a velocidad de respuesta comercial del cliente.",
        "Se requiere consistencia de ejecucion para sostener conversion.",
    ]
    if not payload.has_landing and not payload.has_ecommerce:
        risks.append("Base digital inicial: se recomienda fase de arranque antes de escalar presupuesto.")

    sections = [
        {
            "title": "1. Resumen del negocio",
            "body": (
                f"{payload.company_brand} en {payload.location or 'ubicacion por definir'}, "
                f"giro {payload.industry or 'por definir'} y objetivo principal {payload.main_goal}."
            ),
        },
        {"title": "2. Diagnostico comercial", "body": "Se detecta necesidad de estructura comercial orientada a captacion y conversion por canal."},
        {"title": "3. Nivel de oportunidad detectado", "body": f"Oportunidad {opportunity_level} por ticket promedio, urgencia y contexto digital."},
        {"title": "4. Estrategia recomendada", "body": "Ejecucion mensual con mensajes de valor, optimizacion continua y seguimiento comercial."},
        {"title": "5. Canales y activos recomendados", "body": f"Canal principal: {channel}. Activos en foco: contenido, CTA y embudo de conversion."},
        {"title": "6. KPIs estimados", "body": kpis},
        {"title": "7. Proyeccion mensual de resultados", "body": "Escenario conservador con mejora progresiva de trafico calificado y conversion."},
        {"title": "8. Cotizacion sugerida", "body": f"Rango sugerido: ${min_price} - ${max_price} MXN + IVA. Recomendacion inicial: ${suggested} MXN + IVA."},
        {"title": "9. Servicios adicionales recomendados", "body": ", ".join(recommended_services)},
        {"title": "10. Riesgos y consideraciones", "body": " ".join(risks)},
    ]
    summary = f"Prospecto {payload.company_brand}: oportunidad {opportunity_level}, canal {channel}, recomendacion inicial ${suggested} MXN + IVA."
    return {
        "summary": summary,
        "sections": sections,
        "min_price": min_price.quantize(Decimal("0.01")),
        "max_price": max_price.quantize(Decimal("0.01")),
        "suggested": suggested,
        "recommended_services": recommended_services,
        "risks": risks,
    }


def _deserialize_list(raw: str | None) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _build_status_event(status: str, note: str | None = None) -> dict:
    return {
        "status": status,
        "changed_at": datetime.utcnow().isoformat(),
        "note": note.strip() if note else None,
    }


def _to_read_model(row: MarketingProspect) -> MarketingProspectRead:
    sections = [
        MarketingProspectInternalSection(**section)
        for section in _deserialize_list(row.internal_sections_json)
        if isinstance(section, dict)
    ]
    history = [
        MarketingProspectStatusEvent(
            status=str(item.get("status", "")),
            changed_at=datetime.fromisoformat(str(item.get("changed_at"))),
            note=item.get("note"),
        )
        for item in _deserialize_list(row.status_history_json)
        if isinstance(item, dict) and item.get("status") and item.get("changed_at")
    ]
    return MarketingProspectRead(
        id=row.id,
        contact_name=row.contact_name,
        contact_email=row.contact_email,
        contact_phone=row.contact_phone,
        company_brand=row.company_brand,
        location=row.location,
        industry=row.industry,
        sells=row.sells,
        main_goal=row.main_goal,
        desired_conversion_channel=row.desired_conversion_channel,
        active_social_networks=row.active_social_networks,
        products_to_promote=row.products_to_promote,
        average_ticket_mxn=row.average_ticket_mxn,
        offer_clarity=row.offer_clarity,
        urgency=row.urgency,
        followup_level=row.followup_level,
        has_landing=row.has_landing,
        has_ecommerce=row.has_ecommerce,
        needs_extra_landing=row.needs_extra_landing,
        needs_extra_ecommerce=row.needs_extra_ecommerce,
        needs_commercial_tracking=row.needs_commercial_tracking,
        wants_custom_proposal=row.wants_custom_proposal,
        client_notes=row.client_notes,
        status=row.status,
        status_history=history,
        internal_notes=row.internal_notes,
        contacted_at=row.contacted_at,
        responsible_user_id=row.responsible_user_id,
        channel=row.channel,
        internal_summary=row.internal_summary,
        internal_sections=sections,
        suggested_price_min_mxn=row.suggested_price_min_mxn,
        suggested_price_max_mxn=row.suggested_price_max_mxn,
        suggested_price_mxn=row.suggested_price_mxn,
        recommended_services=[str(item) for item in _deserialize_list(row.recommended_services_json)],
        risks=[str(item) for item in _deserialize_list(row.risks_json)],
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def create_marketing_prospect(db: Session, payload: MarketingProspectCreate) -> MarketingProspectRead:
    computed = _compute_internal_prequote(payload)
    row = MarketingProspect(
        contact_name=payload.contact_name.strip(),
        contact_email=payload.contact_email.strip().lower(),
        contact_phone=payload.contact_phone.strip() if payload.contact_phone else None,
        company_brand=payload.company_brand.strip(),
        location=payload.location.strip() if payload.location else None,
        industry=payload.industry.strip() if payload.industry else None,
        sells=payload.sells.strip().lower() if payload.sells else "productos",
        main_goal=payload.main_goal.strip().lower() if payload.main_goal else "ventas",
        desired_conversion_channel=payload.desired_conversion_channel.strip().lower() if payload.desired_conversion_channel else "ecommerce",
        active_social_networks=payload.active_social_networks.strip() if payload.active_social_networks else None,
        products_to_promote=int(payload.products_to_promote),
        average_ticket_mxn=Decimal(str(payload.average_ticket_mxn)),
        offer_clarity=(payload.offer_clarity or "").strip().lower() or None,
        urgency=payload.urgency.strip().lower() if payload.urgency else "media",
        followup_level=payload.followup_level.strip().lower() if payload.followup_level else "medio",
        has_landing=bool(payload.has_landing),
        has_ecommerce=bool(payload.has_ecommerce),
        needs_extra_landing=bool(payload.needs_extra_landing),
        needs_extra_ecommerce=bool(payload.needs_extra_ecommerce),
        needs_commercial_tracking=bool(payload.needs_commercial_tracking),
        wants_custom_proposal=bool(payload.wants_custom_proposal),
        client_notes=payload.client_notes.strip() if payload.client_notes else None,
        status="nuevo",
        status_history_json=json.dumps([_build_status_event("nuevo", "captura inicial")], ensure_ascii=False),
        channel=(payload.channel or "landing_marketing_form").strip().lower(),
        internal_summary=computed["summary"],
        internal_sections_json=json.dumps(computed["sections"], ensure_ascii=False),
        suggested_price_min_mxn=computed["min_price"],
        suggested_price_max_mxn=computed["max_price"],
        suggested_price_mxn=computed["suggested"],
        recommended_services_json=json.dumps(computed["recommended_services"], ensure_ascii=False),
        risks_json=json.dumps(computed["risks"], ensure_ascii=False),
    )
    db.add(row)
    db.flush()
    create_internal_alert(
        db=db,
        alert_type="marketing_prospect_new",
        title="Nuevo prospecto de mercadotecnia",
        message=f"Se recibio solicitud de {row.company_brand} para canal {row.desired_conversion_channel}.",
        severity="warning",
        related_entity_type="marketing_prospect",
        related_entity_id=row.id,
    )
    log_automation_event(
        db,
        event_type="new_marketing_prospect_request",
        related_entity_type="marketing_prospect",
        related_entity_id=row.id,
        payload_json=json.dumps(
            {"company_brand": row.company_brand, "channel": row.desired_conversion_channel, "urgency": row.urgency},
            ensure_ascii=False,
        ),
        auto_commit=False,
    )
    db.commit()
    db.refresh(row)
    return _to_read_model(row)


def list_marketing_prospects(
    db: Session,
    *,
    status: str | None = None,
    urgency: str | None = None,
    channel: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
) -> list[MarketingProspectRead]:
    query = select(MarketingProspect)
    filters = []
    if status:
        filters.append(MarketingProspect.status == status.strip().lower())
    if urgency:
        filters.append(MarketingProspect.urgency == urgency.strip().lower())
    if channel:
        filters.append(MarketingProspect.desired_conversion_channel == channel.strip().lower())
    if date_from:
        filters.append(MarketingProspect.created_at >= date_from)
    if date_to:
        filters.append(MarketingProspect.created_at <= date_to)
    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(MarketingProspect.contact_name).like(q),
                func.lower(MarketingProspect.company_brand).like(q),
                func.lower(MarketingProspect.contact_email).like(q),
            )
        )
    rows = db.scalars(query.where(*filters).order_by(MarketingProspect.id.desc())).all()
    return [_to_read_model(row) for row in rows]


def get_marketing_prospect(db: Session, prospect_id: int) -> MarketingProspectRead | None:
    row = db.get(MarketingProspect, prospect_id)
    if not row:
        return None
    return _to_read_model(row)


def update_marketing_prospect(
    db: Session,
    *,
    prospect_id: int,
    status: str | None = None,
    internal_notes: str | None = None,
    contacted_at: datetime | None = None,
    responsible_user_id: int | None = None,
) -> MarketingProspectRead | None:
    row = db.get(MarketingProspect, prospect_id)
    if not row:
        return None
    if status is not None:
        normalized_status = status.strip().lower()
        if normalized_status in STATUS_LABELS and normalized_status != row.status:
            row.status = normalized_status
            history = _deserialize_list(row.status_history_json)
            history.append(_build_status_event(normalized_status, "actualizacion manual"))
            row.status_history_json = json.dumps(history, ensure_ascii=False)
    if internal_notes is not None:
        row.internal_notes = internal_notes.strip() if internal_notes else None
    if contacted_at is not None:
        row.contacted_at = contacted_at
    if responsible_user_id is not None:
        row.responsible_user_id = responsible_user_id
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_read_model(row)
