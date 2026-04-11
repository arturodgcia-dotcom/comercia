import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import CommercialPlanRequest, PosLocation, Product, StripeConfig, Tenant, User
from app.schemas.commercial_accounts import CommercialPlanRequestCreate, CommercialPlanRequestRead
from app.schemas.commercial_plan import (
    AiCreditMovementRead,
    CommercialPlanCatalogRead,
    CommercialPlanCheckoutRequest,
    CommercialPlanCheckoutResponse,
    TenantAddonUsageRead,
    TenantCommercialStatusRead,
    TenantCommercialUsageRead,
    TokenConsumeRequest,
    TokenLockRequest,
    TokenTopupRequest,
)
from app.services.commercial_account_guard_service import build_account_usage_payload, get_tenant_commercial_account
from app.services.ai_credit_service import (
    build_brand_credit_snapshot,
    consume_tenant_credits,
    list_tenant_credit_movements,
    record_credit_movement,
    topup_tenant_credits,
)
from app.services.commercial_plan_service import (
    COMMERCIAL_ADDONS,
    apply_plan_to_tenant,
    get_catalog_payload,
    parse_limits,
    resolve_checkout_item,
    set_tokens_lock,
    tenant_plan_status_payload,
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


@router.get("/tenant/{tenant_id}/usage", response_model=TenantCommercialUsageRead)
def get_tenant_commercial_usage(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TenantCommercialUsageRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant_id)

    account = get_tenant_commercial_account(db, tenant.id)
    limits = parse_limits(tenant)
    addons_map: dict[str, int] = {}
    if account:
        usage = build_account_usage_payload(db, account)
        try:
            parsed_addons = json.loads(account.addons_json or "{}")
            addons_map = parsed_addons if isinstance(parsed_addons, dict) else {}
        except Exception:
            addons_map = {}
        brands_limit = int(usage.get("brands_limit") or 0)
        users_limit = int(usage.get("users_limit") or 0)
        products_limit = int(usage.get("products_limit") or 0)
        branches_limit = int(usage.get("branches_limit") or 0)
        brands_used = int(usage.get("brands_used") or 0)
        users_used = int(usage.get("users_used") or 0)
        products_used = int(usage.get("products_used") or 0)
        branches_used = int(usage.get("branches_used") or 0)
        ai_tokens_included = int(usage.get("ai_tokens_included") or tenant.ai_tokens_included or 0)
        ai_tokens_used = int(usage.get("ai_tokens_used") or tenant.ai_tokens_used or 0)
        ai_tokens_balance = int(usage.get("ai_tokens_balance") or tenant.ai_tokens_balance or 0)
    else:
        brands_limit = int(limits.get("brands_max") or 0)
        users_limit = int(limits.get("users_max") or 0)
        products_limit = int(limits.get("products_max") or 0)
        branches_limit = int(limits.get("branches_max") or 0)
        brands_used = 1
        users_used = int(db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant.id, User.is_active.is_(True))) or 0)
        products_used = int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id == tenant.id)) or 0)
        branches_used = int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id)) or 0)
        ai_tokens_included = int(tenant.ai_tokens_included or 0)
        ai_tokens_used = int(tenant.ai_tokens_used or 0)
        ai_tokens_balance = int(tenant.ai_tokens_balance or 0)

    branches_active = int(
        db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id, PosLocation.is_active.is_(True))) or 0
    )
    branches_inactive = max(branches_used - branches_active, 0)

    ai_agents_base = int(limits.get("ai_agents_max") or 0)
    ai_agents_extra = int(addons_map.get("extra_ai_agent") or 0)
    ai_agents_limit = ai_agents_base + max(ai_agents_extra, 0)
    ai_agents_used = 0

    addon_name_by_id = {str(item["id"]): str(item["name"]) for item in COMMERCIAL_ADDONS}
    addons: list[TenantAddonUsageRead] = []
    for addon_id, qty in addons_map.items():
        try:
            quantity = int(qty)
        except Exception:
            quantity = 0
        if quantity <= 0:
            continue
        addons.append(
            TenantAddonUsageRead(
                addon_id=str(addon_id),
                addon_name=addon_name_by_id.get(str(addon_id), str(addon_id)),
                quantity=quantity,
            )
        )

    credit_snapshot = build_brand_credit_snapshot(db, tenant)

    return TenantCommercialUsageRead(
        tenant_id=tenant.id,
        brands_used=brands_used,
        brands_limit=brands_limit,
        users_used=users_used,
        users_limit=users_limit,
        ai_agents_used=ai_agents_used,
        ai_agents_limit=ai_agents_limit,
        products_used=products_used,
        products_limit=products_limit,
        branches_used=branches_used,
        branches_limit=branches_limit,
        branches_active=branches_active,
        branches_inactive=branches_inactive,
        ai_tokens_included=ai_tokens_included,
        ai_tokens_used=ai_tokens_used,
        ai_tokens_balance=credit_snapshot.remaining_tokens,
        ai_tokens_extra=credit_snapshot.extra_assigned,
        ai_tokens_assigned=credit_snapshot.assigned_tokens,
        ai_tokens_reserved=credit_snapshot.reserved_tokens,
        ai_tokens_remaining=credit_snapshot.remaining_tokens,
        ai_tokens_consumption_percentage=credit_snapshot.percentage_consumed,
        ai_key_state=credit_snapshot.key_state,
        ai_override_active=credit_snapshot.override_active,
        ai_override_reason=credit_snapshot.override_reason,
        addons=addons,
    )


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
    current_user: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    try:
        consume_tenant_credits(
            db,
            tenant=tenant,
            amount=payload.tokens,
            source=(payload.source or "").strip() or "otras_acciones_ia",
            notes=payload.reason,
            created_by_user_id=current_user.id if current_user else None,
        )
        status_payload = tenant_plan_status_payload(tenant)
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
    current_user: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    try:
        topup_tenant_credits(
            db,
            tenant=tenant,
            amount=payload.tokens,
            reason=payload.reason,
            created_by_user_id=current_user.id if current_user else None,
        )
        status_payload = tenant_plan_status_payload(tenant)
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
    current_user: User = Depends(get_reinpia_admin),
) -> TenantCommercialStatusRead:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    status_payload = set_tokens_lock(tenant, payload.locked, reason=payload.reason)
    record_credit_movement(
        db,
        tenant=tenant,
        action="lock" if payload.locked else "unlock",
        source="admin_lock",
        tokens_delta=0,
        balance_after=int(tenant.ai_tokens_balance or 0),
        notes=payload.reason,
        created_by_user_id=current_user.id if current_user else None,
    )
    db.add(tenant)
    db.commit()
    return TenantCommercialStatusRead.model_validate(status_payload)


@router.get("/tenant/{tenant_id}/tokens/movements", response_model=list[AiCreditMovementRead])
def get_tenant_token_movements(
    tenant_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AiCreditMovementRead]:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="marca no encontrada")
    _assert_scope(current_user, tenant_id)
    rows = list_tenant_credit_movements(db, tenant_id=tenant_id, limit=limit)
    return [
        AiCreditMovementRead(
            id=row.id,
            tenant_id=row.tenant_id,
            commercial_client_account_id=row.commercial_client_account_id,
            source=row.source,
            action=row.action,
            tokens_delta=int(row.tokens_delta or 0),
            balance_after=int(row.balance_after or 0),
            notes=row.notes,
            created_by_user_id=row.created_by_user_id,
            created_at=row.created_at,
        )
        for row in rows
    ]


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
