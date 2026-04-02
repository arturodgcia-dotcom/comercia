import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import Banner, Plan, StorefrontConfig, Tenant, TenantBranding
from app.models.models import User
from app.schemas.storefront import StorefrontSnapshot
from app.schemas.tenant import TenantCreate, TenantRead, TenantUpdate
from app.services.storefront_initializer import initialize_storefront
from app.services.tenant_config_service import (
    normalize_commission_rules,
    normalize_subscription_plan,
    resolve_plan_type,
)

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
    values["plan_type"] = resolve_plan_type(values.get("plan_type"), bool(plan and plan.commission_enabled))
    values["commission_rules_json"] = json.dumps(normalize_commission_rules(values.get("commission_rules_json")))
    values["subscription_plan_json"] = json.dumps(normalize_subscription_plan(values.get("subscription_plan_json")))
    tenant = Tenant(**values)
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
    tenant.plan_type = resolve_plan_type(changes.get("plan_type", tenant.plan_type), bool(plan and plan.commission_enabled))
    if "commission_rules_json" in changes:
        tenant.commission_rules_json = json.dumps(normalize_commission_rules(changes.get("commission_rules_json")))
    if "subscription_plan_json" in changes:
        tenant.subscription_plan_json = json.dumps(normalize_subscription_plan(changes.get("subscription_plan_json")))
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
