from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import CommercialPlanRequest, StripeConfig, Tenant, User
from app.schemas.commercial_accounts import CommercialPlanRequestCreate, CommercialPlanRequestRead
from app.schemas.commercial_plan import (
    CommercialPlanCatalogRead,
    CommercialPlanCheckoutRequest,
    CommercialPlanCheckoutResponse,
    TenantCommercialStatusRead,
    TokenConsumeRequest,
    TokenLockRequest,
    TokenTopupRequest,
)
from app.services.commercial_plan_service import (
    apply_plan_to_tenant,
    consume_tokens,
    get_catalog_payload,
    get_plan_definition,
    set_tokens_lock,
    tenant_plan_status_payload,
    topup_tokens,
)
from app.services.stripe_service import create_checkout_session_plan1
from app.services.internal_alerts_service import create_internal_alert

router = APIRouter()


@router.get("/catalog", response_model=CommercialPlanCatalogRead, dependencies=[Depends(get_current_user)])
def list_commercial_plans() -> CommercialPlanCatalogRead:
    return CommercialPlanCatalogRead.model_validate(get_catalog_payload())


@router.get("/tenant/{tenant_id}/status", response_model=TenantCommercialStatusRead)
def get_tenant_commercial_status(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant_id)
    return TenantCommercialStatusRead.model_validate(tenant_plan_status_payload(tenant))


@router.post(
    "/create-checkout-session",
    response_model=CommercialPlanCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_reinpia_admin)],
)
def create_commercial_plan_checkout_session(
    payload: CommercialPlanCheckoutRequest,
    db: Session = Depends(get_db),
) -> CommercialPlanCheckoutResponse:
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    plan = get_plan_definition(payload.plan_key)
    stripe_config = _resolve_checkout_stripe_config(db, tenant_id=tenant.id)
    price_without_tax = Decimal(str(plan["monthly_price_mxn"])).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tax = (price_without_tax * Decimal("0.16")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = (price_without_tax + tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    metadata = {
        "kind": "tenant_commercial_plan",
        "tenant_id": str(tenant.id),
        "plan_key": str(plan["id"]),
        "billing_model": str(plan["billing_model"]),
        "commission_percentage": str(plan["commission_percentage"]),
    }
    session = create_checkout_session_plan1(
        secret_key=stripe_config.secret_key,
        line_items=[
            {
                "price_data": {
                    "currency": "mxn",
                    "product_data": {"name": f"{plan['name']} - {plan['billing_model']}"},
                    "unit_amount": int((total * 100).to_integral_value(rounding=ROUND_HALF_UP)),
                },
                "quantity": 1,
            }
        ],
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        metadata=metadata,
    )
    tenant.commercial_plan_status = "checkout_pending"
    tenant.commercial_checkout_session_id = session.id
    db.add(tenant)
    db.commit()
    return CommercialPlanCheckoutResponse(
        plan_key=str(plan["id"]),
        session_id=session.id,
        session_url=session.url,
        price_with_tax_mxn=str(total),
    )


@router.post("/tenant/{tenant_id}/tokens/consume", response_model=TenantCommercialStatusRead)
def consume_tenant_tokens(
    tenant_id: int,
    payload: TokenConsumeRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    try:
        status_payload = consume_tokens(tenant, payload.tokens, reason=payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.add(tenant)
    db.commit()
    return TenantCommercialStatusRead.model_validate(status_payload)


@router.post("/tenant/{tenant_id}/tokens/topup", response_model=TenantCommercialStatusRead)
def topup_tenant_tokens(
    tenant_id: int,
    payload: TokenTopupRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    try:
        status_payload = topup_tokens(tenant, payload.tokens, reason=payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.add(tenant)
    db.commit()
    return TenantCommercialStatusRead.model_validate(status_payload)


@router.post("/tenant/{tenant_id}/tokens/lock", response_model=TenantCommercialStatusRead)
def set_tenant_tokens_lock(
    tenant_id: int,
    payload: TokenLockRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    status_payload = set_tokens_lock(tenant, payload.locked, reason=payload.reason)
    db.add(tenant)
    db.commit()
    return TenantCommercialStatusRead.model_validate(status_payload)


@router.post("/requests", response_model=CommercialPlanRequestRead)
def create_commercial_plan_change_request(
    payload: CommercialPlanRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommercialPlanRequestRead:
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant.id)
    request_type = payload.request_type.strip().lower()
    if request_type not in {"addon", "upgrade"}:
        raise HTTPException(status_code=400, detail="request_type invalido")
    row = CommercialPlanRequest(
        tenant_id=tenant.id,
        commercial_client_account_id=tenant.commercial_client_account_id,
        request_type=request_type,
        addon_id=payload.addon_id,
        target_plan_key=payload.target_plan_key,
        status="nuevo",
        notes=payload.notes,
        requested_by_user_id=current_user.id,
    )
    db.add(row)
    db.flush()
    create_internal_alert(
        db=db,
        alert_type="commercial_plan_request",
        title="Solicitud de cambio comercial",
        message=f"{tenant.name}: {request_type} ({row.addon_id or row.target_plan_key or 'sin detalle'})",
        severity="warning",
        related_entity_type="commercial_plan_request",
        related_entity_id=row.id,
    )
    db.commit()
    db.refresh(row)
    return CommercialPlanRequestRead.model_validate(row)


def _assert_scope(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=403, detail="sin acceso a esta marca")


def _resolve_checkout_stripe_config(db: Session, *, tenant_id: int) -> StripeConfig:
    config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == tenant_id))
    if config:
        return config
    fallback = db.scalar(select(StripeConfig).order_by(StripeConfig.id.asc()))
    if fallback:
        return fallback
    raise HTTPException(status_code=404, detail="no existe configuracion Stripe para checkout comercial")
