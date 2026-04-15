from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_nervia_operator
from app.db.session import get_db
from app.models.models import CommercialClientAccount, MarketingProspect, Order, PlanPurchaseLead, Tenant, User
from app.schemas.nervia_bridge import (
    NerviaFeedbackPayloadRead,
    NerviaPublicationMetricRead,
    NerviaReportRead,
    NerviaSuggestionRead,
    NerviaSyncRequest,
    NerviaTenantPerformance,
)
from app.services.nervia_bridge_store import utc_now, with_store
from app.services.tenant_access_service import (
    assert_user_can_access_tenant,
    resolve_visible_tenant_ids,
    tenant_has_active_nervia_bridge,
)

router = APIRouter()


def _metric_to_read(item: dict, tenant_names: dict[int, str]) -> NerviaPublicationMetricRead:
    return NerviaPublicationMetricRead(
        id=int(item["id"]),
        tenant_id=int(item["tenant_id"]),
        tenant_name=tenant_names.get(int(item["tenant_id"]), f"Tenant #{item['tenant_id']}"),
        publication_id=str(item["publication_id"]),
        channel=str(item["channel"]),
        campaign_name=item.get("campaign_name"),
        published_at=datetime.fromisoformat(item["published_at"]) if item.get("published_at") else None,
        impressions=int(item.get("impressions", 0)),
        clicks=int(item.get("clicks", 0)),
        leads_generated=int(item.get("leads_generated", 0)),
        notes=item.get("notes"),
        synced_at=datetime.fromisoformat(item["synced_at"]),
    )


def _build_nervia_report(db: Session, visible_tenant_ids: set[int]) -> NerviaReportRead:
    if not visible_tenant_ids:
        return NerviaReportRead(
            generated_at=utc_now(),
            total_clicks=0,
            total_impressions=0,
            total_leads=0,
            total_ventas_pagadas=0,
            total_revenue_mxn=0.0,
            ctr_pct=0.0,
            conversion_click_to_lead_pct=0.0,
            conversion_lead_to_sale_pct=0.0,
            by_tenant=[],
            top_publications=[],
        )
    tenants = db.scalars(select(Tenant).where(Tenant.id.in_(sorted(visible_tenant_ids)))).all()
    tenant_names = {row.id: row.name for row in tenants}

    metrics = with_store(lambda store: list(store.get("metrics", [])))
    by_tenant_metrics: dict[int, dict[str, int]] = {}
    for row in metrics:
        tenant_id = int(row.get("tenant_id", 0))
        if tenant_id <= 0 or tenant_id not in visible_tenant_ids:
            continue
        bucket = by_tenant_metrics.setdefault(tenant_id, {"clicks": 0, "impressions": 0, "leads": 0})
        bucket["clicks"] += int(row.get("clicks", 0))
        bucket["impressions"] += int(row.get("impressions", 0))
        bucket["leads"] += int(row.get("leads_generated", 0))

    order_rows = db.execute(
        select(Order.tenant_id, func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.status == "paid", Order.tenant_id.in_(sorted(visible_tenant_ids)))
        .group_by(Order.tenant_id)
    ).all()
    sales_map = {int(tenant_id): {"paid": int(count), "revenue": float(total or 0)} for tenant_id, count, total in order_rows}

    leads_direct_rows = db.execute(
        select(PlanPurchaseLead.tenant_id, func.count(PlanPurchaseLead.id))
        .where(PlanPurchaseLead.tenant_id.in_(sorted(visible_tenant_ids)))
        .group_by(PlanPurchaseLead.tenant_id)
    ).all()
    direct_leads_map = {int(tenant_id): int(count) for tenant_id, count in leads_direct_rows if tenant_id is not None}

    _ = db.execute(
        select(MarketingProspect.company_brand, func.count(MarketingProspect.id))
        .group_by(MarketingProspect.company_brand)
    ).all()

    by_tenant: list[NerviaTenantPerformance] = []
    for tenant in tenants:
        m = by_tenant_metrics.get(tenant.id, {"clicks": 0, "impressions": 0, "leads": 0})
        sales = sales_map.get(tenant.id, {"paid": 0, "revenue": 0.0})
        enriched_leads = m["leads"] + direct_leads_map.get(tenant.id, 0)
        by_tenant.append(
            NerviaTenantPerformance(
                tenant_id=tenant.id,
                tenant_name=tenant.name,
                clicks=m["clicks"],
                impressions=m["impressions"],
                leads=enriched_leads,
                ventas_pagadas=sales["paid"],
                revenue_mxn=sales["revenue"],
                conversion_click_to_lead_pct=(round((enriched_leads / m["clicks"]) * 100, 2) if m["clicks"] > 0 else 0.0),
                conversion_lead_to_sale_pct=(round((sales["paid"] / enriched_leads) * 100, 2) if enriched_leads > 0 else 0.0),
            )
        )

    total_clicks = int(sum(row.clicks for row in by_tenant))
    total_impressions = int(sum(row.impressions for row in by_tenant))
    total_leads = int(sum(row.leads for row in by_tenant))
    total_paid = int(sum(row.ventas_pagadas for row in by_tenant))
    total_revenue = float(sum(row.revenue_mxn for row in by_tenant))

    top_raw = sorted(metrics, key=lambda item: int(item.get("clicks", 0)), reverse=True)[:10]
    top_publications = [_metric_to_read(row, tenant_names) for row in top_raw]

    return NerviaReportRead(
        generated_at=utc_now(),
        total_clicks=total_clicks,
        total_impressions=total_impressions,
        total_leads=total_leads,
        total_ventas_pagadas=total_paid,
        total_revenue_mxn=total_revenue,
        ctr_pct=(round((total_clicks / total_impressions) * 100, 2) if total_impressions > 0 else 0.0),
        conversion_click_to_lead_pct=(round((total_leads / total_clicks) * 100, 2) if total_clicks > 0 else 0.0),
        conversion_lead_to_sale_pct=(round((total_paid / total_leads) * 100, 2) if total_leads > 0 else 0.0),
        by_tenant=sorted(by_tenant, key=lambda row: row.revenue_mxn, reverse=True),
        top_publications=top_publications,
    )


@router.post("/nervia-bridge/sync", response_model=list[NerviaPublicationMetricRead])
def sync_nervia_metrics(
    payload: NerviaSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_nervia_operator),
):
    visible_tenant_ids = resolve_visible_tenant_ids(db, current_user)
    tenant_rows = db.scalars(select(Tenant).where(Tenant.id.in_(sorted(visible_tenant_ids)))).all()
    tenant_names = {row.id: row.name for row in tenant_rows}

    def _mutate(store: dict):
        rows = []
        now = utc_now().isoformat()
        for item in payload.items:
            tenant = db.get(Tenant, int(item.tenant_id))
            if not tenant:
                continue
            try:
                assert_user_can_access_tenant(current_user, tenant)
            except PermissionError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
            account = (
                db.get(CommercialClientAccount, int(tenant.commercial_client_account_id))
                if tenant.commercial_client_account_id
                else None
            )
            if not tenant_has_active_nervia_bridge(tenant, account.addons_json if account else None):
                continue
            current_id = int(store["next_id"])
            store["next_id"] = current_id + 1
            row = {
                "id": current_id,
                "tenant_id": item.tenant_id,
                "publication_id": item.publication_id,
                "channel": item.channel,
                "campaign_name": item.campaign_name,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "impressions": max(0, int(item.impressions)),
                "clicks": max(0, int(item.clicks)),
                "leads_generated": max(0, int(item.leads_generated)),
                "notes": item.notes,
                "source": payload.source,
                "synced_at": now,
            }
            store.setdefault("metrics", []).append(row)
            rows.append(row)
        return rows

    created = with_store(_mutate)
    return [_metric_to_read(row, tenant_names) for row in created]


@router.get("/nervia-bridge/report", response_model=NerviaReportRead)
def nervia_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_nervia_operator),
):
    visible_tenant_ids = resolve_visible_tenant_ids(db, current_user)
    eligible_ids: set[int] = set()
    for tenant_id in visible_tenant_ids:
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            continue
        account = db.get(CommercialClientAccount, int(tenant.commercial_client_account_id)) if tenant.commercial_client_account_id else None
        if tenant_has_active_nervia_bridge(tenant, account.addons_json if account else None):
            eligible_ids.add(tenant_id)
    visible_tenant_ids = eligible_ids
    return _build_nervia_report(db, visible_tenant_ids)


@router.get("/nervia-bridge/feedback", response_model=NerviaFeedbackPayloadRead)
def nervia_feedback_payload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_nervia_operator),
):
    visible_tenant_ids = resolve_visible_tenant_ids(db, current_user)
    eligible_ids: set[int] = set()
    for tenant_id in visible_tenant_ids:
        tenant = db.get(Tenant, tenant_id)
        if not tenant:
            continue
        account = db.get(CommercialClientAccount, int(tenant.commercial_client_account_id)) if tenant.commercial_client_account_id else None
        if tenant_has_active_nervia_bridge(tenant, account.addons_json if account else None):
            eligible_ids.add(tenant_id)
    visible_tenant_ids = eligible_ids
    report = _build_nervia_report(db, visible_tenant_ids)
    suggestions: list[NerviaSuggestionRead] = []
    for row in report.by_tenant[:8]:
        if row.clicks == 0:
            insight = "Sin clics detectados en publicaciones sincronizadas."
            angle = "Publicaciones de reconocimiento de marca con oferta principal."
            cta = "Descubre el catalogo y solicita asesoria."
            fmt = "Video corto + carrusel de beneficios."
        elif row.conversion_click_to_lead_pct < 5:
            insight = "Muchos clics pero pocos leads; ajustar propuesta y CTA."
            angle = "Contenido educativo con prueba social y casos reales."
            cta = "Agenda una asesoria personalizada."
            fmt = "Carrusel con objeciones/respuestas + landing especifica."
        elif row.conversion_lead_to_sale_pct < 20:
            insight = "Leads suficientes pero baja conversion a venta."
            angle = "Publicaciones de cierre comercial y urgencia."
            cta = "Habla con un asesor y cierra hoy."
            fmt = "Testimonio + oferta limitada + CTA directo."
        else:
            insight = "Buen desempeno comercial; escalar volumen con creativos similares."
            angle = "Replicar formato ganador con variaciones por segmento."
            cta = "Compra ahora / solicita cotizacion."
            fmt = "Serie de anuncios A/B por audiencia."
        suggestions.append(
            NerviaSuggestionRead(
                tenant_id=row.tenant_id,
                tenant_name=row.tenant_name,
                insight=insight,
                suggested_post_angle=angle,
                suggested_cta=cta,
                suggested_format=fmt,
            )
        )

    return NerviaFeedbackPayloadRead(generated_at=utc_now(), report=report, suggestions=suggestions)
