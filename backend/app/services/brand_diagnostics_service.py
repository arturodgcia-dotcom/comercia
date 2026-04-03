import json
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    BrandDiagnostic,
    Category,
    Product,
    ServiceOffering,
    StorefrontConfig,
    Tenant,
    TenantBranding,
)


@dataclass
class DiagnosticContext:
    tenant_id: int
    brand_name: str
    slug: str
    business_type: str
    language: str
    hero_title: str
    hero_subtitle: str
    cta_primary: str
    cta_secondary: str
    sections: list[dict[str, str]]
    contact_whatsapp: str
    contact_email: str
    product_count: int
    service_count: int
    category_count: int
    landing_enabled: bool
    has_existing_landing: bool
    missing_data: list[str]
    source: dict[str, object]


def _safe_json_load(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _normalize_text(value: str | None) -> str:
    return (value or "").strip()


def collect_diagnostic_context(db: Session, tenant_id: int) -> DiagnosticContext:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise ValueError("Marca no encontrada")

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))

    payload = _safe_json_load(storefront.config_json if storefront else None)
    landing_draft = payload.get("landing_draft", {}) if isinstance(payload.get("landing_draft"), dict) else {}
    identity_data = payload.get("identity_data", {}) if isinstance(payload.get("identity_data"), dict) else {}
    admin_settings = payload.get("admin_settings", {}) if isinstance(payload.get("admin_settings"), dict) else {}
    language_config = admin_settings.get("language", {}) if isinstance(admin_settings.get("language"), dict) else {}

    sections_raw = landing_draft.get("sections", [])
    sections: list[dict[str, str]] = []
    if isinstance(sections_raw, list):
        for item in sections_raw:
            if not isinstance(item, dict):
                continue
            title = _normalize_text(str(item.get("title", "")))
            body = _normalize_text(str(item.get("body", "")))
            if title or body:
                sections.append({"title": title, "body": body})

    hero_title = _normalize_text(landing_draft.get("hero_title") if isinstance(landing_draft, dict) else None)
    hero_subtitle = _normalize_text(landing_draft.get("hero_subtitle") if isinstance(landing_draft, dict) else None)
    cta_primary = _normalize_text(landing_draft.get("cta_primary") if isinstance(landing_draft, dict) else None)
    cta_secondary = _normalize_text(landing_draft.get("cta_secondary") if isinstance(landing_draft, dict) else None)
    contact_cta = _normalize_text(landing_draft.get("contact_cta") if isinstance(landing_draft, dict) else None)

    if not hero_title:
        hero_title = _normalize_text(branding.hero_title if branding else None)
    if not hero_subtitle:
        hero_subtitle = _normalize_text(branding.hero_subtitle if branding else None)
    if not cta_primary:
        cta_primary = "Solicitar diagnóstico"
    if not cta_secondary:
        cta_secondary = "Conocer más"

    missing_data: list[str] = []
    if not hero_title:
        missing_data.append("Falta titular principal de la landing.")
    if not hero_subtitle:
        missing_data.append("Falta subtítulo comercial de la landing.")
    if not sections:
        missing_data.append("Faltan secciones estructuradas de contenido en la landing.")
    if not (branding and (branding.contact_email or branding.contact_whatsapp)) and not contact_cta:
        missing_data.append("No se detectó bloque claro de contacto o diagnóstico.")

    # Evita dependencia a count() con adapters locales y mantiene simplicidad en MVP.
    categories = db.scalars(select(Category).where(Category.tenant_id == tenant_id)).all()
    products = db.scalars(select(Product).where(Product.tenant_id == tenant_id, Product.is_active.is_(True))).all()
    services = db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id, ServiceOffering.is_active.is_(True))
    ).all()

    category_count = len(categories)
    product_count = len(products)
    service_count = len(services)

    context_source = {
        "tenant": {"id": tenant.id, "name": tenant.name, "slug": tenant.slug, "business_type": tenant.business_type},
        "branding": {
            "primary_color": branding.primary_color if branding else None,
            "secondary_color": branding.secondary_color if branding else None,
            "hero_title": branding.hero_title if branding else None,
            "hero_subtitle": branding.hero_subtitle if branding else None,
            "contact_email": branding.contact_email if branding else None,
            "contact_whatsapp": branding.contact_whatsapp if branding else None,
        },
        "landing_draft": landing_draft,
        "language": language_config,
        "catalog": {"categories": category_count, "products": product_count, "services": service_count},
    }

    return DiagnosticContext(
        tenant_id=tenant.id,
        brand_name=tenant.name,
        slug=tenant.slug,
        business_type=tenant.business_type,
        language=str(language_config.get("primary", "es")),
        hero_title=hero_title,
        hero_subtitle=hero_subtitle,
        cta_primary=cta_primary,
        cta_secondary=cta_secondary,
        sections=sections,
        contact_whatsapp=_normalize_text(branding.contact_whatsapp if branding else None),
        contact_email=_normalize_text(branding.contact_email if branding else None),
        product_count=product_count,
        service_count=service_count,
        category_count=category_count,
        landing_enabled=bool(storefront.landing_enabled) if storefront else True,
        has_existing_landing=bool(identity_data.get("has_existing_landing", False)),
        missing_data=missing_data,
        source=context_source,
    )


def _score_to_int(value: float) -> int:
    return max(0, min(100, int(round(value))))


def _criterion(status: str, criterion: str, detail: str) -> dict[str, str]:
    return {"status": status, "criterion": criterion, "detail": detail}


def run_diagnostic(context: DiagnosticContext) -> dict:
    full_text = " ".join(
        [
            context.hero_title,
            context.hero_subtitle,
            context.cta_primary,
            context.cta_secondary,
            " ".join(section.get("title", "") for section in context.sections),
            " ".join(section.get("body", "") for section in context.sections),
        ]
    ).strip()
    text_lower = full_text.lower()

    # SEO rules
    seo_findings: list[dict[str, str]] = []
    seo_score = 0.0

    if len(context.hero_title) >= 18:
        seo_score += 16
        seo_findings.append(_criterion("ok", "Titular principal", "La landing tiene titular principal con enfoque comercial."))
    else:
        seo_findings.append(_criterion("warning", "Titular principal", "El titular principal es corto o no está definido claramente."))

    if len(context.hero_subtitle) >= 24:
        seo_score += 14
        seo_findings.append(_criterion("ok", "Subtítulo", "Existe subtítulo con contexto de propuesta de valor."))
    else:
        seo_findings.append(_criterion("warning", "Subtítulo", "Falta subtítulo descriptivo o es muy breve."))

    if context.cta_primary:
        seo_score += 12
        seo_findings.append(_criterion("ok", "CTA principal", "Se detecta llamado principal a la acción."))
    else:
        seo_findings.append(_criterion("warning", "CTA principal", "No se detecta CTA principal claro."))

    if len(context.sections) >= 3:
        seo_score += 14
        seo_findings.append(_criterion("ok", "Estructura de secciones", "La landing contiene bloques suficientes para posicionamiento semántico."))
    else:
        seo_findings.append(_criterion("warning", "Estructura de secciones", "Conviene ampliar secciones de valor, oferta y confianza."))

    if context.contact_email or context.contact_whatsapp:
        seo_score += 10
        seo_findings.append(_criterion("ok", "Contacto", "Se detecta canal de contacto visible para conversión."))
    else:
        seo_findings.append(_criterion("warning", "Contacto", "Falta contacto visible o formulario claro en la propuesta."))

    if context.category_count > 0 or context.product_count > 0 or context.service_count > 0:
        seo_score += 12
        seo_findings.append(_criterion("ok", "Oferta indexable", "Existe oferta comercial (productos/servicios/categorías) asociada a la marca."))
    else:
        seo_findings.append(_criterion("warning", "Oferta indexable", "No se detecta oferta comercial estructurada para descubrimiento."))

    if any(word in text_lower for word in ["beneficio", "valor", "ventaja", "resultado", "solución", "solucion"]):
        seo_score += 12
        seo_findings.append(_criterion("ok", "Propuesta de valor", "El mensaje incluye lenguaje de valor comercial."))
    else:
        seo_findings.append(_criterion("warning", "Propuesta de valor", "La propuesta de valor puede ser más explícita."))

    if context.language.lower().startswith("es"):
        seo_score += 10
        seo_findings.append(_criterion("ok", "Idioma", "La configuración de idioma principal está definida en español."))
    else:
        seo_findings.append(_criterion("info", "Idioma", "Revisa que el idioma principal coincida con el mercado objetivo."))

    # AEO rules
    aeo_findings: list[dict[str, str]] = []
    aeo_score = 0.0

    if any(token in text_lower for token in ["somos", "ofrecemos", "plataforma", "servicios", "ecommerce", "formación", "formacion"]):
        aeo_score += 18
        aeo_findings.append(_criterion("ok", "Qué hace la marca", "El contenido responde qué hace la marca."))
    else:
        aeo_findings.append(_criterion("warning", "Qué hace la marca", "No queda totalmente claro qué hace la marca en una sola lectura."))

    if any(token in text_lower for token in ["para", "dirigido", "empresas", "distribuidores", "clientes", "profesionales"]):
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Audiencia objetivo", "El texto indica para quién está diseñada la oferta."))
    else:
        aeo_findings.append(_criterion("warning", "Audiencia objetivo", "Falta especificar mejor la audiencia principal."))

    if any(token in text_lower for token in ["beneficio", "ahorro", "resultado", "mejora", "rentabilidad"]):
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Beneficios concretos", "La narrativa incluye beneficios reutilizables por asistentes de IA."))
    else:
        aeo_findings.append(_criterion("warning", "Beneficios concretos", "Conviene explicitar beneficios medibles en lenguaje directo."))

    qna_signals = sum(1 for section in context.sections if "?" in section.get("title", "") or "como" in section.get("title", "").lower())
    if qna_signals > 0:
        aeo_score += 12
        aeo_findings.append(_criterion("ok", "Bloques tipo pregunta/respuesta", "Se detectan bloques con formato útil para motores de respuesta."))
    else:
        aeo_findings.append(_criterion("warning", "Bloques tipo pregunta/respuesta", "Agrega FAQ o bloques de respuesta directa para fortalecer AEO."))

    avg_sentence_len = len(full_text.split()) / max(1, len([s for s in full_text.replace("?", ".").split(".") if s.strip()]))
    if avg_sentence_len <= 24:
        aeo_score += 12
        aeo_findings.append(_criterion("ok", "Claridad semántica", "El contenido tiene una longitud de oración razonable para comprensión por IA."))
    else:
        aeo_findings.append(_criterion("warning", "Claridad semántica", "Hay oraciones extensas; conviene simplificar para mejorar interpretación automática."))

    if context.cta_primary and context.cta_secondary:
        aeo_score += 14
        aeo_findings.append(_criterion("ok", "Intención comercial", "La intención comercial está explícita con llamados a acción claros."))
    else:
        aeo_findings.append(_criterion("warning", "Intención comercial", "Falta reforzar llamados a la acción y siguiente paso."))

    if context.business_type in {"products", "services", "mixed"}:
        aeo_score += 16
        aeo_findings.append(_criterion("ok", "Contexto de negocio", "El contexto de industria/tipo de negocio está identificado."))
    else:
        aeo_findings.append(_criterion("warning", "Contexto de negocio", "Define con más precisión el tipo de negocio para respuestas más certeras."))

    # Branding rules
    branding_findings: list[dict[str, str]] = []
    branding_score = 0.0

    if context.hero_title and context.hero_subtitle:
        branding_score += 18
        branding_findings.append(_criterion("ok", "Promesa de marca", "Existe promesa principal y soporte narrativo en la cabecera."))
    else:
        branding_findings.append(_criterion("warning", "Promesa de marca", "La promesa central de marca necesita mayor definición."))

    if any(token in text_lower for token in ["diferente", "especializado", "premium", "inteligente", "profesional"]):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Diferenciación", "El mensaje presenta elementos de diferenciación comercial."))
    else:
        branding_findings.append(_criterion("warning", "Diferenciación", "Falta enfatizar qué hace única a la marca frente a competidores."))

    if context.business_type == "services" and (context.service_count > 0 or "servicio" in text_lower):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineación con industria", "La narrativa está alineada con un negocio de servicios."))
    elif context.business_type == "products" and (context.product_count > 0 or "producto" in text_lower):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineación con industria", "La narrativa está alineada con un negocio de productos."))
    elif context.business_type == "mixed" and (context.product_count > 0 or context.service_count > 0):
        branding_score += 14
        branding_findings.append(_criterion("ok", "Alineación con industria", "La narrativa soporta oferta mixta de productos y servicios."))
    else:
        branding_findings.append(_criterion("warning", "Alineación con industria", "El mensaje no refleja totalmente el tipo de negocio actual."))

    if context.cta_primary:
        branding_score += 14
        branding_findings.append(_criterion("ok", "Consistencia de CTA", "El llamado principal es coherente con la propuesta de marca."))
    else:
        branding_findings.append(_criterion("warning", "Consistencia de CTA", "Falta CTA principal consistente con la promesa de marca."))

    if len(context.brand_name) >= 4 and any(char.isalpha() for char in context.brand_name):
        branding_score += 10
        branding_findings.append(_criterion("ok", "Identidad nominal", "El nombre de marca está definido y usable en comunicación comercial."))
    else:
        branding_findings.append(_criterion("warning", "Identidad nominal", "El nombre de marca requiere mayor claridad o consistencia."))

    if context.category_count + context.product_count + context.service_count >= 3:
        branding_score += 12
        branding_findings.append(_criterion("ok", "Coherencia oferta-mensaje", "La oferta visible respalda la promesa comercial de marca."))
    else:
        branding_findings.append(_criterion("warning", "Coherencia oferta-mensaje", "Amplía la oferta visible para reforzar credibilidad comercial."))

    if context.contact_email or context.contact_whatsapp:
        branding_score += 10
        branding_findings.append(_criterion("ok", "Confianza comercial", "La marca ofrece un canal de contacto directo para cierre."))
    else:
        branding_findings.append(_criterion("warning", "Confianza comercial", "Agrega contacto directo para reforzar confianza y cierre."))

    if len(context.sections) >= 3:
        branding_score += 8
        branding_findings.append(_criterion("ok", "Narrativa estructurada", "La narrativa de marca tiene estructura comercial suficiente."))
    else:
        branding_findings.append(_criterion("warning", "Narrativa estructurada", "Falta estructura en bloques para explicar oferta y diferenciales."))

    seo = _score_to_int(seo_score - (len(context.missing_data) * 2))
    aeo = _score_to_int(aeo_score - (len(context.missing_data) * 2))
    branding = _score_to_int(branding_score - (len(context.missing_data) * 2))
    global_score = _score_to_int((seo + aeo + branding) / 3)

    high_priority: list[str] = []
    medium_priority: list[str] = []
    low_priority: list[str] = []

    if seo < 70:
        high_priority.append("Refinar titular, subtítulo y bloques de valor para mejorar descubrimiento orgánico.")
    if aeo < 70:
        high_priority.append("Agregar bloque FAQ/respuestas directas para mejorar visibilidad en asistentes de IA.")
    if branding < 75:
        medium_priority.append("Fortalecer diferenciación de marca y beneficios concretos por audiencia.")
    if not (context.contact_email or context.contact_whatsapp):
        high_priority.append("Habilitar un canal de contacto visible con CTA comercial en la landing.")
    if len(context.sections) < 3:
        medium_priority.append("Incluir secciones mínimas: propuesta de valor, beneficios, oferta principal y contacto.")
    if context.has_existing_landing:
        low_priority.append("Mantener alineado el copy del preview interno con la landing externa declarada.")
    if context.product_count + context.service_count == 0:
        high_priority.append("Publicar oferta base (productos/servicios) para reforzar posicionamiento y conversión.")

    if not high_priority:
        high_priority.append("Mantener ciclo de mejora continua con revisión mensual de SEO/AEO/branding.")
    if not medium_priority:
        medium_priority.append("Ajustar estilo de titulares para mayor claridad comercial por industria.")
    if not low_priority:
        low_priority.append("Documentar casos de éxito y testimonios para aumentar prueba social.")

    next_actions = [
        "Priorizar 2 mejoras de alta prioridad en la próxima iteración de landing.",
        "Validar consistencia entre propuesta de valor, audiencia y CTA principal.",
        "Reanalizar la marca después de aplicar mejoras para medir avance de score.",
    ]

    summary = (
        f"La marca obtuvo un score global de {global_score}/100. "
        f"SEO {seo}, AEO {aeo} e identidad {branding}. "
        "El diagnóstico sugiere reforzar claridad comercial, bloques de respuesta para IA y coherencia de propuesta."
    )

    return {
        "tenant_id": context.tenant_id,
        "brand_name": context.brand_name,
        "analyzed_at": datetime.utcnow(),
        "status": "completed",
        "scores": {
            "seo": seo,
            "aeo": aeo,
            "branding": branding,
            "global": global_score,
        },
        "findings": {
            "seo": seo_findings,
            "aeo": aeo_findings,
            "branding": branding_findings,
        },
        "recommendations": {
            "high_priority": high_priority,
            "medium_priority": medium_priority,
            "low_priority": low_priority,
        },
        "summary": summary,
        "next_actions": next_actions,
        "missing_data": context.missing_data,
        "raw_context": context.source,
    }


def persist_diagnostic_result(db: Session, result: dict) -> BrandDiagnostic:
    row = BrandDiagnostic(
        tenant_id=int(result["tenant_id"]),
        status=str(result.get("status", "completed")),
        analyzed_at=result.get("analyzed_at") or datetime.utcnow(),
        seo_score=int(result["scores"]["seo"]),
        aeo_score=int(result["scores"]["aeo"]),
        branding_score=int(result["scores"]["branding"]),
        global_score=int(result["scores"]["global"]),
        findings_json=json.dumps(result.get("findings", {}), ensure_ascii=False),
        recommendations_json=json.dumps(result.get("recommendations", {}), ensure_ascii=False),
        summary=str(result.get("summary", "")),
        next_actions_json=json.dumps(result.get("next_actions", []), ensure_ascii=False),
        context_json=json.dumps(result.get("raw_context", {}), ensure_ascii=False),
        missing_data_json=json.dumps(result.get("missing_data", []), ensure_ascii=False),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def parse_diagnostic_row(row: BrandDiagnostic) -> dict:
    findings = _safe_json_load(row.findings_json)
    recommendations = _safe_json_load(row.recommendations_json)
    context_payload = _safe_json_load(row.context_json)
    try:
        next_actions = json.loads(row.next_actions_json or "[]")
    except Exception:
        next_actions = []
    try:
        missing_data = json.loads(row.missing_data_json or "[]")
    except Exception:
        missing_data = []
    try:
        improvement_plan = json.loads(row.improvement_plan_json or "{}") if row.improvement_plan_json else None
    except Exception:
        improvement_plan = None

    tenant_data = context_payload.get("tenant", {}) if isinstance(context_payload, dict) else {}
    return {
        "id": row.id,
        "tenant_id": row.tenant_id,
        "brand_name": str(tenant_data.get("name") or f"Tenant {row.tenant_id}"),
        "analyzed_at": row.analyzed_at,
        "status": row.status,
        "scores": {
            "seo": row.seo_score,
            "aeo": row.aeo_score,
            "branding": row.branding_score,
            "global": row.global_score,
        },
        "findings": findings if isinstance(findings, dict) else {},
        "recommendations": recommendations if isinstance(recommendations, dict) else {},
        "summary": row.summary,
        "next_actions": next_actions if isinstance(next_actions, list) else [],
        "missing_data": missing_data if isinstance(missing_data, list) else [],
        "raw_context": context_payload if isinstance(context_payload, dict) else {},
        "improvement_plan": improvement_plan,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }
