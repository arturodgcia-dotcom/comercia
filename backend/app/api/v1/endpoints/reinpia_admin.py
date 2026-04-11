from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_reinpia_admin
from app.db.session import get_db
from app.models.models import CommercialClientAccount, CommercialPlanRequest, User
from app.models.models import LogisticsAdditionalService
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
from app.schemas.customer_contact import CustomerContactLeadRead, CustomerContactLeadUpdate
from app.schemas.marketing_prospects import MarketingProspectRead, MarketingProspectUpdate
from app.schemas.reinpia import SubscriptionRead
from app.schemas.commercial_accounts import (
    AssignTenantToCommercialAccountPayload,
    CommercialAccountAiCreditDistributionUpdate,
    CommercialAccountAiCreditsRead,
    CommercialAccountUsageRead,
    CommercialClientAccountCreate,
    CommercialClientAccountRead,
    CommercialClientAccountUpdate,
    CommercialPlanRequestCreate,
    CommercialPlanRequestRead,
    TenantAiCreditOverrideUpdate,
)
from app.schemas.logistics_additional import (
    LogisticsAdditionalServiceCreate,
    LogisticsAdditionalServiceRead,
    LogisticsAdditionalServiceSummary,
    LogisticsAdditionalServiceUpdate,
)
from app.schemas.tenant import TenantRead
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
    get_commission_sales_kpis,
    get_agent_sales_summary,
    get_pending_internal_alerts,
    mark_alert_as_read,
    register_plan_purchase_lead,
    update_commission_agent,
)
from app.services.customer_contact_service import list_customer_contact_leads, update_customer_contact_lead
from app.services.marketing_prospects_service import (
    get_marketing_prospect,
    list_marketing_prospects,
    update_marketing_prospect,
)
from app.services.commercial_account_guard_service import build_account_usage_payload, enforce_brand_limit_for_account
from app.services.ai_credit_service import (
    build_account_ai_credit_payload,
    build_brand_credit_snapshot,
    ensure_account_distribution,
    set_manual_account_distribution,
    set_tenant_override,
)
from app.services.internal_alerts_service import create_internal_alert
from app.services.operational_alerts_service import sync_operational_alerts_for_all_tenants
from app.services.export_service import (
    export_commission_agents_csv,
    export_commissions_summary_csv,
    export_orders_csv,
    export_plan_purchase_leads_csv,
    export_sales_summary_csv,
    export_tenants_summary_csv,
)
from app.services.reporting_service import (
    get_coupon_performance,
    get_customer_repeat_vs_new_summary,
    get_distributor_summary as get_tenant_distributor_summary,
    get_logistics_summary as get_tenant_logistics_summary,
    get_sales_summary as get_tenant_sales_summary,
    get_services_summary as get_tenant_services_summary,
)
from app.models.models import PlanPurchaseLead, SalesCommissionAgent, SalesReferral, Tenant

router = APIRouter(dependencies=[Depends(get_reinpia_admin)])


def _compute_logistics_totals(payload: LogisticsAdditionalServiceCreate | LogisticsAdditionalServiceUpdate) -> tuple[Decimal | None, Decimal | None]:
    kilometers = Decimal(str(payload.kilometers)) if payload.kilometers is not None else None
    unit_cost = Decimal(str(payload.unit_cost)) if payload.unit_cost is not None else None
    if kilometers is None or unit_cost is None:
        return None, None
    subtotal = (kilometers * unit_cost).quantize(Decimal("0.01"))
    iva = Decimal(str(payload.iva)) if payload.iva is not None else Decimal("0")
    total = (subtotal + iva).quantize(Decimal("0.01"))
    return subtotal, total


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


@router.get("/logistics-services", response_model=list[LogisticsAdditionalServiceRead])
def list_logistics_services(
    tenant_id: int | None = None,
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if tenant_id is not None:
        filters.append(LogisticsAdditionalService.tenant_id == tenant_id)
    if status:
        filters.append(LogisticsAdditionalService.status == status)
    if date_from:
        filters.append(LogisticsAdditionalService.service_date >= date_from)
    if date_to:
        filters.append(LogisticsAdditionalService.service_date <= date_to)
    return db.scalars(
        select(LogisticsAdditionalService).where(*filters).order_by(LogisticsAdditionalService.service_date.desc())
    ).all()


@router.post("/logistics-services", response_model=LogisticsAdditionalServiceRead)
def create_logistics_service(payload: LogisticsAdditionalServiceCreate, db: Session = Depends(get_db)):
    subtotal, total = _compute_logistics_totals(payload)
    row = LogisticsAdditionalService(**payload.model_dump())
    if subtotal is not None:
        row.subtotal = subtotal
    if total is not None:
        row.total = total
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/logistics-services/{service_id}", response_model=LogisticsAdditionalServiceRead)
def get_logistics_service(service_id: int, db: Session = Depends(get_db)):
    row = db.get(LogisticsAdditionalService, service_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="servicio logistico no encontrado")
    return row


@router.put("/logistics-services/{service_id}", response_model=LogisticsAdditionalServiceRead)
def update_logistics_service(service_id: int, payload: LogisticsAdditionalServiceUpdate, db: Session = Depends(get_db)):
    row = db.get(LogisticsAdditionalService, service_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="servicio logistico no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    subtotal, total = _compute_logistics_totals(payload)
    if subtotal is not None:
        row.subtotal = subtotal
    if total is not None:
        row.total = total
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/logistics-services-summary", response_model=LogisticsAdditionalServiceSummary)
def logistics_services_summary(
    tenant_id: int | None = None,
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if tenant_id is not None:
        filters.append(LogisticsAdditionalService.tenant_id == tenant_id)
    if status:
        filters.append(LogisticsAdditionalService.status == status)
    if date_from:
        filters.append(LogisticsAdditionalService.service_date >= date_from)
    if date_to:
        filters.append(LogisticsAdditionalService.service_date <= date_to)

    total_services = db.scalar(select(func.count(LogisticsAdditionalService.id)).where(*filters)) or 0
    subtotal = db.scalar(select(func.sum(LogisticsAdditionalService.subtotal)).where(*filters)) or 0
    iva = db.scalar(select(func.sum(LogisticsAdditionalService.iva)).where(*filters)) or 0
    total = db.scalar(select(func.sum(LogisticsAdditionalService.total)).where(*filters)) or 0
    by_status = db.execute(
        select(LogisticsAdditionalService.status, func.count(LogisticsAdditionalService.id))
        .where(*filters)
        .group_by(LogisticsAdditionalService.status)
    ).all()
    return LogisticsAdditionalServiceSummary(
        total_services=int(total_services),
        subtotal=subtotal,
        iva=iva,
        total=total,
        by_status=[{"status": item[0], "count": int(item[1] or 0)} for item in by_status],
    )


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


@router.get("/customer-contact-leads", response_model=list[CustomerContactLeadRead])
def list_customer_contacts(
    status: str | None = None,
    channel: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return list_customer_contact_leads(
        db,
        status=status,
        channel=channel,
        date_from=date_from,
        date_to=date_to,
    )


@router.put("/customer-contact-leads/{lead_id}", response_model=CustomerContactLeadRead)
def update_customer_contact(
    lead_id: int,
    payload: CustomerContactLeadUpdate,
    db: Session = Depends(get_db),
):
    lead = update_customer_contact_lead(db, lead_id=lead_id, **payload.model_dump(exclude_unset=True))
    if not lead:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="contacto no encontrado")
    return lead


@router.get("/marketing-prospects", response_model=list[MarketingProspectRead])
def list_marketing_prospects_endpoint(
    status: str | None = None,
    urgency: str | None = None,
    channel: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    return list_marketing_prospects(
        db,
        status=status,
        urgency=urgency,
        channel=channel,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )


@router.get("/marketing-prospects/{prospect_id}", response_model=MarketingProspectRead)
def get_marketing_prospect_endpoint(prospect_id: int, db: Session = Depends(get_db)):
    row = get_marketing_prospect(db, prospect_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="prospecto no encontrado")
    return row


@router.put("/marketing-prospects/{prospect_id}", response_model=MarketingProspectRead)
def update_marketing_prospect_endpoint(
    prospect_id: int,
    payload: MarketingProspectUpdate,
    db: Session = Depends(get_db),
):
    row = update_marketing_prospect(db, prospect_id=prospect_id, **payload.model_dump(exclude_unset=True))
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="prospecto no encontrado")
    return row


@router.get("/commercial-client-accounts", response_model=list[CommercialClientAccountRead])
def list_commercial_client_accounts(db: Session = Depends(get_db)):
    return db.scalars(select(CommercialClientAccount).order_by(CommercialClientAccount.id.desc())).all()


@router.post("/commercial-client-accounts", response_model=CommercialClientAccountRead)
def create_commercial_client_account(payload: CommercialClientAccountCreate, db: Session = Depends(get_db)):
    row = CommercialClientAccount(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/commercial-client-accounts/{account_id}", response_model=CommercialClientAccountRead)
def update_commercial_client_account(
    account_id: int,
    payload: CommercialClientAccountUpdate,
    db: Session = Depends(get_db),
):
    row = db.get(CommercialClientAccount, account_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.post("/commercial-client-accounts/{account_id}/assign-tenant", response_model=TenantRead)
def assign_tenant_to_commercial_account(
    account_id: int,
    payload: AssignTenantToCommercialAccountPayload,
    db: Session = Depends(get_db),
):
    account = db.get(CommercialClientAccount, account_id)
    if not account:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="marca no encontrada")
    if tenant.commercial_client_account_id != account.id:
        try:
            enforce_brand_limit_for_account(db, account)
        except ValueError as exc:
            from fastapi import HTTPException

            raise HTTPException(status_code=400, detail=str(exc)) from exc
    tenant.commercial_client_account_id = account.id
    tenant.is_parent_brand = bool(payload.is_parent_brand)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/commercial-client-accounts/{account_id}/usage", response_model=CommercialAccountUsageRead)
def get_commercial_client_account_usage(account_id: int, db: Session = Depends(get_db)):
    account = db.get(CommercialClientAccount, account_id)
    if not account:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    base_payload = build_account_usage_payload(db, account)
    ai_payload = build_account_ai_credit_payload(db, account)
    return CommercialAccountUsageRead.model_validate(
        {
            **base_payload,
            "ai_tokens_extra": ai_payload["total_tokens_extra"],
            "ai_tokens_reserved": ai_payload["total_tokens_reserved"],
            "ai_tokens_remaining": ai_payload["total_tokens_remaining"],
            "brands_warning": ai_payload["brands_warning"],
            "brands_blocked": ai_payload["brands_blocked"],
            "brands_override": ai_payload["brands_override"],
        }
    )


@router.get("/commercial-client-accounts/{account_id}/ai-credits", response_model=CommercialAccountAiCreditsRead)
def get_commercial_client_account_ai_credits(account_id: int, db: Session = Depends(get_db)):
    account = db.get(CommercialClientAccount, account_id)
    if not account:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    payload = build_account_ai_credit_payload(db, account)
    db.commit()
    return CommercialAccountAiCreditsRead.model_validate(payload)


@router.put("/commercial-client-accounts/{account_id}/ai-credits/auto", response_model=CommercialAccountAiCreditsRead)
def auto_distribute_commercial_client_account_ai_credits(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_reinpia_admin)):
    account = db.get(CommercialClientAccount, account_id)
    if not account:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    ensure_account_distribution(db, account, force_auto=True)
    payload = build_account_ai_credit_payload(db, account)
    db.commit()
    return CommercialAccountAiCreditsRead.model_validate(payload)


@router.put("/commercial-client-accounts/{account_id}/ai-credits/distribution", response_model=CommercialAccountAiCreditsRead)
def update_commercial_client_account_ai_credit_distribution(
    account_id: int,
    payload: CommercialAccountAiCreditDistributionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reinpia_admin),
):
    account = db.get(CommercialClientAccount, account_id)
    if not account:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
    try:
        set_manual_account_distribution(
            db,
            account=account,
            allocations=[item.model_dump() for item in payload.allocations],
            actor_user_id=current_user.id,
        )
    except ValueError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail=str(exc)) from exc
    payload_out = build_account_ai_credit_payload(db, account)
    db.commit()
    return CommercialAccountAiCreditsRead.model_validate(payload_out)


@router.put("/tenants/{tenant_id}/ai-credits/override", response_model=TenantRead)
def update_tenant_ai_credit_override(
    tenant_id: int,
    payload: TenantAiCreditOverrideUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reinpia_admin),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="marca no encontrada")
    set_tenant_override(
        db,
        tenant=tenant,
        active=payload.active,
        reason=payload.reason,
        actor_user_id=current_user.id,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/commercial-plan-requests", response_model=list[CommercialPlanRequestRead])
def list_commercial_plan_requests(
    tenant_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if tenant_id is not None:
        filters.append(CommercialPlanRequest.tenant_id == tenant_id)
    if status:
        filters.append(CommercialPlanRequest.status == status.strip().lower())
    return db.scalars(select(CommercialPlanRequest).where(*filters).order_by(CommercialPlanRequest.id.desc())).all()


@router.post("/commercial-plan-requests", response_model=CommercialPlanRequestRead)
def create_commercial_plan_request(payload: CommercialPlanRequestCreate, db: Session = Depends(get_db), _: User = Depends(get_reinpia_admin)):
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="marca no encontrada")
    row = CommercialPlanRequest(
        tenant_id=tenant.id,
        commercial_client_account_id=tenant.commercial_client_account_id,
        request_type=payload.request_type.strip().lower(),
        addon_id=payload.addon_id,
        target_plan_key=payload.target_plan_key,
        status="nuevo",
        notes=payload.notes,
    )
    db.add(row)
    db.flush()
    create_internal_alert(
        db=db,
        alert_type="commercial_plan_request",
        title="Nueva solicitud comercial de plan/add-on",
        message=f"Marca {tenant.name}: {row.request_type} ({row.addon_id or row.target_plan_key or 'sin detalle'})",
        severity="warning",
        related_entity_type="commercial_plan_request",
        related_entity_id=row.id,
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/alerts", response_model=list[InternalAlertRead])
def list_internal_alerts(
    alert_type: str | None = None,
    severity: str | None = None,
    is_read: bool | None = None,
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
):
    sync_operational_alerts_for_all_tenants(db)
    db.commit()
    return get_pending_internal_alerts(
        db,
        alert_type=alert_type,
        severity=severity,
        is_read=is_read,
        tenant_id=tenant_id,
    )


@router.put("/alerts/{alert_id}/read", response_model=InternalAlertRead)
def mark_internal_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = mark_alert_as_read(db, alert_id)
    if not alert:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="alerta no encontrada")
    return alert


@router.get("/reports/overview")
def reinpia_reports_overview(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return {
        "global_kpis": get_global_kpis(db, date_from=date_from, date_to=date_to),
        "sales_summary": get_tenant_sales_summary(db, date_from=date_from, date_to=date_to),
        "commissions_summary": get_commissions_summary(db, date_from=date_from, date_to=date_to),
    }


@router.get("/reports/tenants-growth")
def reinpia_reports_tenants_growth(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    summary = get_tenants_summary(db, date_from=date_from, date_to=date_to)
    top_growth = sorted(summary, key=lambda row: row["revenue"], reverse=True)[:limit]
    low_movement = sorted(summary, key=lambda row: row["revenue"])[:limit]
    return {"top_growth": top_growth, "low_movement": low_movement}


@router.get("/reports/commissions")
def reinpia_reports_commissions(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return {
        "commission_sales_kpis": get_commission_sales_kpis(db, date_from=date_from, date_to=date_to),
        "payment_commissions": get_commissions_summary(db, date_from=date_from, date_to=date_to),
    }


@router.get("/reports/leads")
def reinpia_reports_leads(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if date_from:
        filters.append(PlanPurchaseLead.created_at >= date_from)
    if date_to:
        filters.append(PlanPurchaseLead.created_at <= date_to)
    total = db.scalar(select(func.count(PlanPurchaseLead.id)).where(*filters)) or 0
    commissioned = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*filters, PlanPurchaseLead.is_commissioned_sale.is_(True))
    ) or 0
    direct = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*filters, PlanPurchaseLead.is_commissioned_sale.is_(False))
    ) or 0
    by_status = db.execute(
        select(PlanPurchaseLead.purchase_status, func.count(PlanPurchaseLead.id))
        .where(*filters)
        .group_by(PlanPurchaseLead.purchase_status)
    ).all()
    return {
        "total_leads": total,
        "commissioned_leads": commissioned,
        "direct_leads": direct,
        "by_status": [{"status": r[0], "count": int(r[1] or 0)} for r in by_status],
    }


@router.get("/reports/marketing-opportunities")
def reinpia_reports_marketing_opportunities(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    tenants = db.scalars(select(Tenant).where(Tenant.is_active.is_(True))).all()
    opportunities: list[dict] = []
    for tenant in tenants:
        repeat_data = get_customer_repeat_vs_new_summary(db, tenant_id=tenant.id, date_from=date_from, date_to=date_to)
        if repeat_data["repeat_customers"] < repeat_data["new_customers"]:
            opportunities.append(
                {
                    "tenant_id": tenant.id,
                    "tenant_name": tenant.name,
                    "opportunity_type": "low_repeat_purchase",
                    "message": "Baja recompra detectada; sugerir campaña de fidelizacion.",
                }
            )
        coupons = get_coupon_performance(db, tenant_id=tenant.id, date_from=date_from, date_to=date_to)
        if not coupons:
            opportunities.append(
                {
                    "tenant_id": tenant.id,
                    "tenant_name": tenant.name,
                    "opportunity_type": "coupon_strategy",
                    "message": "Sin traccion de cupones; sugerir activacion promocional.",
                }
            )
    return {"opportunities": opportunities}


@router.get("/reports/commercial-summary")
def reinpia_reports_commercial_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return {
        "sales": get_tenant_sales_summary(db, date_from=date_from, date_to=date_to),
        "distributors": get_tenant_distributor_summary(db, date_from=date_from, date_to=date_to),
        "logistics": get_tenant_logistics_summary(db, date_from=date_from, date_to=date_to),
        "services": get_tenant_services_summary(db, date_from=date_from, date_to=date_to),
        "leads": reinpia_reports_leads(date_from=date_from, date_to=date_to, db=db),
    }
