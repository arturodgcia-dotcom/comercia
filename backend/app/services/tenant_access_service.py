import json

from sqlalchemy import false, or_, select
from sqlalchemy.orm import Session

from app.models.models import Tenant, User

GLOBAL_INTERNAL_ROLES = {"reinpia_admin", "super_admin"}
AGENCY_ROLES = {"agency_admin"}

OWNER_SCOPE_INTERNAL = "reinpia_internal"
OWNER_SCOPE_AGENCY = "external_agency"

TENANT_TYPE_PLATFORM = "platform_tenant"
TENANT_TYPE_AGENCY = "agency_tenant"
TENANT_TYPE_DIRECT_CLIENT = "direct_client_tenant"
TENANT_TYPE_MANAGED_CLIENT = "managed_client_tenant"


def is_global_internal_user(user: User) -> bool:
    return user.role in GLOBAL_INTERNAL_ROLES


def is_agency_user(user: User) -> bool:
    return user.role in AGENCY_ROLES


def visible_tenant_filter_for_user(user: User):
    if is_global_internal_user(user):
        return True
    if is_agency_user(user):
        if user.tenant_id is None:
            return false()
        return or_(
            Tenant.id == int(user.tenant_id),
            Tenant.owner_agency_tenant_id == int(user.tenant_id),
        )
    if user.tenant_id is None:
        return false()
    return Tenant.id == int(user.tenant_id)


def list_visible_tenants(db: Session, user: User) -> list[Tenant]:
    predicate = visible_tenant_filter_for_user(user)
    stmt = select(Tenant).where(predicate).order_by(Tenant.id.desc())
    return db.scalars(stmt).all()


def resolve_visible_tenant_ids(db: Session, user: User) -> set[int]:
    rows = db.scalars(select(Tenant.id).where(visible_tenant_filter_for_user(user))).all()
    return {int(row) for row in rows}


def assert_user_can_access_tenant(user: User, tenant: Tenant) -> None:
    if is_global_internal_user(user):
        return
    if is_agency_user(user):
        if tenant.id == user.tenant_id:
            return
        if tenant.owner_scope == OWNER_SCOPE_AGENCY and tenant.owner_agency_tenant_id == user.tenant_id:
            return
        raise PermissionError("sin acceso a tenant de REINPIA/ComerCia interno")
    if tenant.id != user.tenant_id:
        raise PermissionError("sin acceso a esta marca")


def tenant_has_comercia_connector(tenant: Tenant, account_addons_json: str | None = None) -> bool:
    if bool(tenant.comercia_connection_enabled):
        return True
    if not account_addons_json:
        return False
    try:
        parsed = json.loads(account_addons_json)
    except Exception:
        return False
    if not isinstance(parsed, dict):
        return False
    value = parsed.get("comercia_connector")
    try:
        return int(value or 0) > 0
    except Exception:
        return False


def tenant_has_active_nervia_bridge(tenant: Tenant, account_addons_json: str | None = None) -> bool:
    has_identifier = bool((tenant.nervia_customer_identifier or "").strip())
    if not has_identifier:
        return False
    if not bool(tenant.nervia_sync_enabled):
        return False
    if not bool(tenant.nervia_marketing_contract_active):
        return False
    return tenant_has_comercia_connector(tenant, account_addons_json)
