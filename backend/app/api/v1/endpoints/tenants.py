import json
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Banner, CommercialClientAccount, Plan, StorefrontConfig, Tenant, TenantBranding
from app.models.models import User
from app.schemas.storefront import StorefrontSnapshot
from app.schemas.tenant import TenantCreate, TenantRead, TenantUpdate
from app.services.storefront_initializer import initialize_storefront
from app.services.tenant_config_service import (
    normalize_billing_config,
    normalize_commission_rules,
    normalize_subscription_plan,
)
from app.services.commercial_plan_service import apply_plan_to_tenant
from app.services.commercial_account_guard_service import enforce_brand_limit_for_account

router = APIRouter()


@router.get("", response_model=list[TenantRead])
def list_tenants(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Tenant]:
    if current_user.role == "reinpia_admin":
        return db.scalars(select(Tenant).order_by(Tenant.id.desc())).all()
    if current_user.tenant_id is None:
        return []
    tenant = db.get(Tenant, current_user.tenant_id)
    return [tenant] if tenant else []


@router.post("", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
def create_tenant(
    payload: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Tenant:
    if current_user.role != "reinpia_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="solo admin global puede crear marcas")
    _validate_slug_and_subdomain_uniqueness(db, payload.slug, payload.subdomain)
    values = payload.model_dump()
    default_plan: Plan | None = None
    if values.get("plan_id") is None:
        default_plan = db.scalar(select(Plan).where(Plan.code == "PLAN_1"))
        values["plan_id"] = default_plan.id if default_plan else None
    plan = db.get(Plan, values["plan_id"]) if values.get("plan_id") else default_plan
    billing = normalize_billing_config(
        billing_model=values.get("billing_model"),
        commission_percentage=values.get("commission_percentage"),
        commission_enabled=values.get("commission_enabled"),
        commission_scope=values.get("commission_scope"),
        commission_notes=values.get("commission_notes"),
        tenant_plan_type=values.get("plan_type"),
        plan_commission_enabled=bool(plan and plan.commission_enabled),
    )
    values["plan_type"] = "commission" if billing["billing_model"] == "commission_based" else "subscription"
    values["billing_model"] = billing["billing_model"]
    values["commission_enabled"] = billing["commission_enabled"]
    values["commission_percentage"] = Decimal(str(billing["commission_percentage"]))
    values["commission_scope"] = billing["commission_scope"]
    values["commission_notes"] = billing["commission_notes"]
    values["commission_rules_json"] = json.dumps(
        _commission_rules_for_billing(
            commission_rules_json=values.get("commission_rules_json"),
            commission_enabled=billing["commission_enabled"],
            commission_percentage=billing["commission_percentage"],
        )
    )
    values["subscription_plan_json"] = json.dumps(normalize_subscription_plan(values.get("subscription_plan_json")))
    values.setdefault("commercial_plan_status", "not_purchased")
    if values.get("commercial_client_account_id"):
        account = db.get(CommercialClientAccount, int(values["commercial_client_account_id"]))
        if not account:
            raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
        enforce_brand_limit_for_account(db, account)
    tenant = Tenant(**values)
    if values.get("commercial_plan_key"):
        try:
            apply_plan_to_tenant(
                tenant,
                plan_key=str(values["commercial_plan_key"]),
                source=str(values.get("commercial_plan_source") or "manual_admin"),
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    db.add(tenant)
    db.flush()
    initialize_storefront(db, tenant)
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=TenantRead)
def get_tenant(tenant_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    _assert_tenant_scope(current_user, tenant_id)
    return tenant


@router.put("/{tenant_id}", response_model=TenantRead)
def update_tenant(
    tenant_id: int,
    payload: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Tenant:
    if current_user.role != "reinpia_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="solo admin global puede actualizar marcas")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    changes = payload.model_dump(exclude_unset=True)
    if "slug" in changes and changes["slug"] != tenant.slug:
        _validate_slug_and_subdomain_uniqueness(db, changes["slug"], tenant.subdomain)
    if "subdomain" in changes and changes["subdomain"] != tenant.subdomain:
        _validate_slug_and_subdomain_uniqueness(db, tenant.slug, changes["subdomain"])

    for key, value in changes.items():
        setattr(tenant, key, value)
    target_plan_id = changes.get("plan_id", tenant.plan_id)
    plan = db.get(Plan, target_plan_id) if target_plan_id else None
    billing = normalize_billing_config(
        billing_model=changes.get("billing_model", tenant.billing_model),
        commission_percentage=changes.get("commission_percentage", tenant.commission_percentage),
        commission_enabled=changes.get("commission_enabled", tenant.commission_enabled),
        commission_scope=changes.get("commission_scope", tenant.commission_scope),
        commission_notes=changes.get("commission_notes", tenant.commission_notes),
        tenant_plan_type=changes.get("plan_type", tenant.plan_type),
        plan_commission_enabled=bool(plan and plan.commission_enabled),
    )
    tenant.plan_type = "commission" if billing["billing_model"] == "commission_based" else "subscription"
    tenant.billing_model = billing["billing_model"]
    tenant.commission_enabled = bool(billing["commission_enabled"])
    tenant.commission_percentage = Decimal(str(billing["commission_percentage"]))
    tenant.commission_scope = str(billing["commission_scope"])
    tenant.commission_notes = billing["commission_notes"]
    if "commission_rules_json" in changes or "billing_model" in changes or "commission_percentage" in changes or "commission_enabled" in changes:
        tenant.commission_rules_json = json.dumps(
            _commission_rules_for_billing(
                commission_rules_json=changes.get("commission_rules_json", tenant.commission_rules_json),
                commission_enabled=billing["commission_enabled"],
                commission_percentage=billing["commission_percentage"],
            )
        )
    if "subscription_plan_json" in changes:
        tenant.subscription_plan_json = json.dumps(normalize_subscription_plan(changes.get("subscription_plan_json")))
    if "commercial_plan_key" in changes and changes.get("commercial_plan_key"):
        try:
            apply_plan_to_tenant(
                tenant,
                plan_key=str(changes["commercial_plan_key"]),
                source=str(changes.get("commercial_plan_source") or "manual_admin"),
                checkout_session_id=tenant.commercial_checkout_session_id,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    if "commercial_client_account_id" in changes and changes.get("commercial_client_account_id"):
        account = db.get(CommercialClientAccount, int(changes["commercial_client_account_id"]))
        if not account:
            raise HTTPException(status_code=404, detail="cliente comercial no encontrado")
        if tenant.commercial_client_account_id != account.id:
            enforce_brand_limit_for_account(db, account)
    if "ai_tokens_locked" in changes and changes["ai_tokens_locked"] is not None:
        tenant.ai_tokens_locked = bool(changes["ai_tokens_locked"])
    if "ai_tokens_lock_reason" in changes:
        tenant.ai_tokens_lock_reason = changes["ai_tokens_lock_reason"]
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/{tenant_id}/initialize-storefront")
def initialize_tenant_storefront(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != "reinpia_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="solo admin global puede inicializar storefront")
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    config = initialize_storefront(db, tenant)
    return {"tenant_id": tenant_id, "storefront_config_id": config.id, "initialized": True}


@router.get("/{tenant_id}/storefront-config", response_model=StorefrontSnapshot)
def get_tenant_storefront_config(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StorefrontSnapshot:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    _assert_tenant_scope(current_user, tenant_id)

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    banners = db.scalars(select(Banner).where(Banner.tenant_id == tenant_id).order_by(Banner.position.asc())).all()
    return StorefrontSnapshot(tenant_id=tenant.id, tenant_slug=tenant.slug, branding=branding, config=config, banners=banners)


def _validate_slug_and_subdomain_uniqueness(db: Session, slug: str, subdomain: str) -> None:
    exists = db.scalar(select(Tenant).where((Tenant.slug == slug) | (Tenant.subdomain == subdomain)))
    if exists:
        raise HTTPException(status_code=400, detail="slug o subdomain ya existen")


def _assert_tenant_scope(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="sin acceso a esta marca")


def _commission_rules_for_billing(*, commission_rules_json: str | None, commission_enabled: bool, commission_percentage: str) -> dict:
    if not commission_enabled:
        return {"tiers": [{"up_to": None, "rate": "0", "label": "Sin comision"}], "minimum_per_operation": None}
    if commission_rules_json:
        return normalize_commission_rules(commission_rules_json)
    rate = (Decimal(str(commission_percentage)) / Decimal("100")).quantize(Decimal("0.0001"))
    return {
        "tiers": [{"up_to": None, "rate": str(rate), "label": "Comision general"}],
        "minimum_per_operation": None,
    }
