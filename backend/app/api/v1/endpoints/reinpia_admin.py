from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_reinpia_admin
from app.db.session import get_db
from app.models.models import User
from app.schemas.checkout import OrderRead
from app.schemas.commission_agents import (
    InternalAlertRead,
    PlanPurchaseLeadCreate,
    PlanPurchaseLeadRead,
    SalesCommissionAgentCreate,
    SalesCommissionAgentRead,
    SalesCommissionAgentUpdate,
    SalesReferralCreate,
    SalesReferralRead,
)
from app.schemas.reinpia import SubscriptionRead
from app.services.analytics_service import (
    get_active_vs_inactive_tenants,
    get_appointments_summary,
    get_business_type_distribution,
    get_commissions_summary,
    get_distributors_summary,
    get_global_kpis,
    get_logistics_summary,
    get_orders,
    get_orders_timeseries,
    get_plan_distribution,
    get_sales_summary,
    get_tenant_kpis,
    get_tenant_subscriptions,
    get_tenants_summary,
    get_top_tenants_by_revenue,
)
from app.services.commission_agents_service import (
    create_commission_agent,
    create_sales_referral,
    get_agent_sales_summary,
    get_pending_internal_alerts,
    mark_alert_as_read,
    register_plan_purchase_lead,
    update_commission_agent,
)
from app.services.export_service import (
    export_commission_agents_csv,
    export_commissions_summary_csv,
    export_orders_csv,
    export_plan_purchase_leads_csv,
    export_sales_summary_csv,
    export_tenants_summary_csv,
)
from app.models.models import PlanPurchaseLead, SalesCommissionAgent, SalesReferral

router = APIRouter(dependencies=[Depends(get_reinpia_admin)])


@router.get("/dashboard/kpis")
def dashboard_kpis(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_reinpia_admin),
):
    return {
        "kpis": get_global_kpis(db, date_from=date_from, date_to=date_to),
        "active_vs_inactive": get_active_vs_inactive_tenants(db),
        "plan_distribution": get_plan_distribution(db),
        "business_type_distribution": get_business_type_distribution(db),
    }


@router.get("/dashboard/orders-timeseries")
def dashboard_orders_timeseries(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_orders_timeseries(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id)


@router.get("/dashboard/top-tenants")
def dashboard_top_tenants(
    limit: int = 10,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return get_top_tenants_by_revenue(db, limit=limit, date_from=date_from, date_to=date_to)


@router.get("/tenants/summary")
def tenants_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    plan_id: int | None = None,
    business_type: str | None = None,
    db: Session = Depends(get_db),
):
    return get_tenants_summary(
        db,
        date_from=date_from,
        date_to=date_to,
        status=status,
        plan_id=plan_id,
        business_type=business_type,
    )


@router.get("/tenants/{tenant_id}/kpis")
def tenant_kpis(
    tenant_id: int,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return get_tenant_kpis(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)


@router.get("/tenants/{tenant_id}/orders", response_model=list[OrderRead])
def tenant_orders(
    tenant_id: int,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_orders(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/tenants/{tenant_id}/subscriptions", response_model=list[SubscriptionRead])
def tenant_subscriptions(
    tenant_id: int,
    status: str | None = None,
    plan_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_tenant_subscriptions(db, tenant_id=tenant_id, status=status, plan_id=plan_id)


@router.get("/payments/sales-summary")
def payments_sales_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_sales_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/payments/commissions-summary")
def payments_commissions_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_commissions_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/payments/orders", response_model=list[OrderRead])
def payments_orders(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_orders(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/appointments/summary")
def appointments_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_appointments_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/logistics/summary")
def logistics_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_logistics_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/distributors/summary")
def distributors_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return get_distributors_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)


@router.get("/exports/sales.csv")
def export_sales_csv(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    content = export_sales_summary_csv(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return Response(content=content, media_type="text/csv")


@router.get("/exports/commissions.csv")
def export_commissions_csv(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    content = export_commissions_summary_csv(
        db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status
    )
    return Response(content=content, media_type="text/csv")


@router.get("/exports/tenants.csv")
def export_tenants_csv(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    plan_id: int | None = None,
    business_type: str | None = None,
    db: Session = Depends(get_db),
):
    content = export_tenants_summary_csv(
        db,
        date_from=date_from,
        date_to=date_to,
        status=status,
        plan_id=plan_id,
        business_type=business_type,
    )
    return Response(content=content, media_type="text/csv")


@router.get("/exports/orders.csv")
def export_orders_csv_endpoint(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    content = export_orders_csv(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return Response(content=content, media_type="text/csv")


@router.get("/exports/commission-agents.csv")
def export_commission_agents_csv_endpoint(db: Session = Depends(get_db)):
    content = export_commission_agents_csv(db)
    return Response(content=content, media_type="text/csv")


@router.get("/exports/plan-purchase-leads.csv")
def export_plan_purchase_leads_csv_endpoint(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    content = export_plan_purchase_leads_csv(db, date_from=date_from, date_to=date_to, status=status)
    return Response(content=content, media_type="text/csv")


@router.get("/commission-agents", response_model=list[SalesCommissionAgentRead])
def list_commission_agents(db: Session = Depends(get_db)):
    return db.scalars(select(SalesCommissionAgent).order_by(SalesCommissionAgent.id.desc())).all()


@router.post("/commission-agents", response_model=SalesCommissionAgentRead)
def create_commission_agent_endpoint(payload: SalesCommissionAgentCreate, db: Session = Depends(get_db)):
    return create_commission_agent(db, **payload.model_dump())


@router.put("/commission-agents/{agent_id}", response_model=SalesCommissionAgentRead)
def update_commission_agent_endpoint(agent_id: int, payload: SalesCommissionAgentUpdate, db: Session = Depends(get_db)):
    agent = db.get(SalesCommissionAgent, agent_id)
    if not agent:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="comisionista no encontrado")
    return update_commission_agent(db, agent, **payload.model_dump(exclude_unset=True))


@router.get("/commission-agents/{agent_id}/summary")
def commission_agent_summary(
    agent_id: int,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return get_agent_sales_summary(db, agent_id=agent_id, date_from=date_from, date_to=date_to)


@router.post("/referrals", response_model=SalesReferralRead)
def create_referral_endpoint(payload: SalesReferralCreate, db: Session = Depends(get_db)):
    referral = create_sales_referral(db, **payload.model_dump())
    db.commit()
    db.refresh(referral)
    return referral


@router.get("/referrals", response_model=list[SalesReferralRead])
def list_referrals(
    status: str | None = None,
    commission_agent_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if status:
        filters.append(SalesReferral.status == status)
    if commission_agent_id is not None:
        filters.append(SalesReferral.commission_agent_id == commission_agent_id)
    if date_from:
        filters.append(SalesReferral.created_at >= date_from)
    if date_to:
        filters.append(SalesReferral.created_at <= date_to)
    return db.scalars(select(SalesReferral).where(*filters).order_by(SalesReferral.id.desc())).all()


@router.post("/plan-purchase-leads", response_model=PlanPurchaseLeadRead)
def create_plan_purchase_lead_endpoint(payload: PlanPurchaseLeadCreate, db: Session = Depends(get_db)):
    return register_plan_purchase_lead(db, **payload.model_dump())


@router.get("/plan-purchase-leads", response_model=list[PlanPurchaseLeadRead])
def list_plan_purchase_leads(
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if status:
        filters.append(PlanPurchaseLead.purchase_status == status)
    if date_from:
        filters.append(PlanPurchaseLead.created_at >= date_from)
    if date_to:
        filters.append(PlanPurchaseLead.created_at <= date_to)
    return db.scalars(select(PlanPurchaseLead).where(*filters).order_by(PlanPurchaseLead.id.desc())).all()


@router.get("/alerts", response_model=list[InternalAlertRead])
def list_internal_alerts(
    alert_type: str | None = None,
    severity: str | None = None,
    is_read: bool | None = None,
    db: Session = Depends(get_db),
):
    return get_pending_internal_alerts(db, alert_type=alert_type, severity=severity, is_read=is_read)


@router.put("/alerts/{alert_id}/read", response_model=InternalAlertRead)
def mark_internal_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = mark_alert_as_read(db, alert_id)
    if not alert:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="alerta no encontrada")
    return alert
