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
    resolve_checkout_item,
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
)
def create_commercial_plan_checkout_session(
    payload: CommercialPlanCheckoutRequest,
    db: Session = Depends(get_db),
) -> CommercialPlanCheckoutResponse:
    item_code = (payload.item_code or payload.plan_key or "").strip().lower()
    if not item_code:
        raise HTTPException(status_code=400, detail="item_code es obligatorio")
    try:
        checkout_item = resolve_checkout_item(item_code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    stripe_price_id = str(checkout_item.get("stripe_price_id") or "").strip()
    if not stripe_price_id:
        raise HTTPException(status_code=500, detail=f"Falta stripe_price_id configurado para {item_code}.")

    tenant = db.get(Tenant, int(payload.tenant_id)) if payload.tenant_id else None
    stripe_config = _resolve_checkout_stripe_config(db, tenant_id=tenant.id if tenant else None)
    metadata = {
        "kind": "tenant_commercial_plan" if (checkout_item["item_type"] == "plan" and tenant) else "comercia_catalog_checkout",
        "tenant_id": str(tenant.id) if tenant else "",
        "plan_key": str(checkout_item["item_code"]) if checkout_item["item_type"] == "plan" else "",
        "item_code": str(checkout_item["item_code"]),
        "item_type": str(checkout_item["item_type"]),
        "billing_model": str(checkout_item["billing_model"]),
        "commission_percentage": str(checkout_item["commission_percentage"]),
    }
    session = create_checkout_session_plan1(
        secret_key=stripe_config.secret_key,
        line_items=[{"price": stripe_price_id, "quantity": 1}],
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        metadata=metadata,
    )
    if tenant and checkout_item["item_type"] == "plan":
        tenant.commercial_plan_status = "checkout_pending"
        tenant.commercial_checkout_session_id = session.id
        db.add(tenant)
        db.commit()
    return CommercialPlanCheckoutResponse(
        item_code=str(checkout_item["item_code"]),
        item_type=str(checkout_item["item_type"]),
        checkout_url=str(session.url),
        session_id=session.id,
        total_price_mxn=str(checkout_item["total_price_mxn"]),
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


def _resolve_checkout_stripe_config(db: Session, *, tenant_id: int | None = None) -> StripeConfig:
    if tenant_id:
        config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == tenant_id))
        if config:
            return config
    fallback = db.scalar(select(StripeConfig).order_by(StripeConfig.id.asc()))
    if fallback:
        return fallback
    raise HTTPException(status_code=404, detail="no existe configuracion Stripe para checkout comercial")
