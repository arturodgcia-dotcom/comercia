from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import PermissionCatalog, RoleCatalog, RolePermission, User, UserRoleAssignment

ROLE_CATALOG_SEED = [
    {
        "role_key": "super_admin",
        "display_name": "Super administrador",
        "scope": "global",
        "description": "Acceso total de plataforma",
    },
    {
        "role_key": "contador",
        "display_name": "Contador",
        "scope": "global",
        "description": "Acceso financiero y conciliación",
    },
    {
        "role_key": "soporte",
        "display_name": "Soporte",
        "scope": "global",
        "description": "Soporte operativo y técnico",
    },
    {
        "role_key": "comercial",
        "display_name": "Comercial",
        "scope": "global",
        "description": "Prospectos y seguimiento comercial",
    },
    {
        "role_key": "operaciones",
        "display_name": "Operaciones",
        "scope": "global",
        "description": "Operación interna de plataforma",
    },
    {
        "role_key": "client_admin",
        "display_name": "Administrador de cliente",
        "scope": "client",
        "description": "Administrador del cliente principal",
    },
    {
        "role_key": "brand_admin",
        "display_name": "Administrador de marca",
        "scope": "brand",
        "description": "Administrador de marca",
    },
    {
        "role_key": "brand_operator",
        "display_name": "Operador de marca",
        "scope": "brand",
        "description": "Operación diaria de marca",
    },
    {
        "role_key": "brand_support_viewer",
        "display_name": "Visor de soporte de marca",
        "scope": "brand",
        "description": "Consulta soporte e incidencias",
    },
]

PERMISSION_CATALOG_SEED = [
    {"permission_key": "global.view_dashboard", "display_name": "Ver dashboard global", "domain": "global"},
    {"permission_key": "global.view_clients", "display_name": "Ver clientes", "domain": "global"},
    {"permission_key": "global.view_brands", "display_name": "Ver marcas", "domain": "global"},
    {"permission_key": "global.view_payments", "display_name": "Ver pagos", "domain": "global"},
    {"permission_key": "global.view_commissions", "display_name": "Ver comisiones", "domain": "global"},
    {"permission_key": "global.view_support", "display_name": "Ver soporte global", "domain": "global"},
    {
        "permission_key": "global.view_marketing_prospects",
        "display_name": "Ver prospectos de marketing",
        "domain": "global",
    },
    {"permission_key": "global.view_security", "display_name": "Ver seguridad", "domain": "global"},
    {
        "permission_key": "global.manage_internal_users",
        "display_name": "Gestionar usuarios internos",
        "domain": "global",
    },
    {
        "permission_key": "global.manage_roles_permissions",
        "display_name": "Gestionar roles y permisos",
        "domain": "global",
    },
    {"permission_key": "brand.view_dashboard", "display_name": "Ver dashboard de marca", "domain": "brand"},
    {"permission_key": "brand.manage_catalog", "display_name": "Gestionar catálogo", "domain": "brand"},
    {
        "permission_key": "brand.manage_distributors",
        "display_name": "Gestionar distribuidores",
        "domain": "brand",
    },
    {
        "permission_key": "brand.view_consumption_limits",
        "display_name": "Ver consumo y límites",
        "domain": "brand",
    },
    {"permission_key": "brand.open_support", "display_name": "Abrir soporte", "domain": "brand"},
    {"permission_key": "brand.buy_addons", "display_name": "Comprar add-ons", "domain": "brand"},
    {"permission_key": "brand.edit_branding", "display_name": "Editar branding", "domain": "brand"},
    {"permission_key": "brand.view_channels", "display_name": "Ver canales", "domain": "brand"},
    {
        "permission_key": "brand.manage_responses_attention",
        "display_name": "Gestionar respuestas y atención",
        "domain": "brand",
    },
]

ROLE_PERMISSION_MAP: dict[str, set[str]] = {
    "super_admin": {entry["permission_key"] for entry in PERMISSION_CATALOG_SEED},
    "contador": {
        "global.view_dashboard",
        "global.view_clients",
        "global.view_brands",
        "global.view_payments",
        "global.view_commissions",
    },
    "soporte": {
        "global.view_dashboard",
        "global.view_support",
        "brand.view_dashboard",
        "brand.open_support",
        "brand.view_consumption_limits",
    },
    "comercial": {
        "global.view_dashboard",
        "global.view_clients",
        "global.view_marketing_prospects",
    },
    "operaciones": {
        "global.view_dashboard",
        "global.view_brands",
        "global.view_support",
        "global.view_security",
    },
    "client_admin": {
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.buy_addons",
        "brand.edit_branding",
        "brand.view_channels",
        "brand.manage_responses_attention",
    },
    "brand_admin": {
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.buy_addons",
        "brand.edit_branding",
        "brand.view_channels",
        "brand.manage_responses_attention",
    },
    "brand_operator": {
        "brand.view_dashboard",
        "brand.manage_catalog",
        "brand.manage_distributors",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.view_channels",
        "brand.manage_responses_attention",
    },
    "brand_support_viewer": {
        "brand.view_dashboard",
        "brand.view_consumption_limits",
        "brand.open_support",
        "brand.view_channels",
    },
}

LEGACY_ROLE_TO_NEW_ROLE: dict[str, str] = {
    "reinpia_admin": "super_admin",
    "super_admin": "super_admin",
    "contador": "contador",
    "soporte": "soporte",
    "comercial": "comercial",
    "operaciones": "operaciones",
    "agency_admin": "operaciones",
    "tenant_admin": "brand_admin",
    "tenant_staff": "brand_operator",
    "distributor_user": "brand_support_viewer",
    "client_admin": "client_admin",
    "brand_admin": "brand_admin",
    "brand_operator": "brand_operator",
    "brand_support_viewer": "brand_support_viewer",
}

ROLE_ALIAS_KEYS: dict[str, set[str]] = {
    "super_admin": {"super_admin", "reinpia_admin"},
    "contador": {"contador"},
    "soporte": {"soporte"},
    "comercial": {"comercial"},
    "operaciones": {"operaciones", "agency_admin"},
    "client_admin": {"client_admin"},
    "brand_admin": {"brand_admin", "tenant_admin"},
    "brand_operator": {"brand_operator", "tenant_staff"},
    "brand_support_viewer": {"brand_support_viewer", "distributor_user"},
}


def _normalize_role_key(role: str | None) -> str:
    if not role:
        return ""
    return role.strip().lower()


def map_legacy_role_key(role: str | None) -> str | None:
    normalized = _normalize_role_key(role)
    if not normalized:
        return None
    if normalized in ROLE_PERMISSION_MAP:
        return normalized
    return LEGACY_ROLE_TO_NEW_ROLE.get(normalized)


def map_primary_role_for_user(user: User) -> str | None:
    return map_legacy_role_key(user.role)


def ensure_default_catalog_seeded(db: Session) -> None:
    role_count = db.scalar(select(RoleCatalog.id).limit(1))
    permission_count = db.scalar(select(PermissionCatalog.id).limit(1))
    if role_count and permission_count:
        return

    existing_roles = {
        row.role_key: row for row in db.scalars(select(RoleCatalog)).all()
    }
    for seed in ROLE_CATALOG_SEED:
        if seed["role_key"] not in existing_roles:
            db.add(
                RoleCatalog(
                    role_key=seed["role_key"],
                    display_name=seed["display_name"],
                    scope=seed["scope"],
                    description=seed.get("description"),
                    is_system=True,
                )
            )

    existing_permissions = {
        row.permission_key: row for row in db.scalars(select(PermissionCatalog)).all()
    }
    for seed in PERMISSION_CATALOG_SEED:
        if seed["permission_key"] not in existing_permissions:
            db.add(
                PermissionCatalog(
                    permission_key=seed["permission_key"],
                    display_name=seed["display_name"],
                    domain=seed["domain"],
                    description=seed.get("description"),
                )
            )

    db.flush()

    role_by_key = {row.role_key: row for row in db.scalars(select(RoleCatalog)).all()}
    permission_by_key = {row.permission_key: row for row in db.scalars(select(PermissionCatalog)).all()}

    existing_pairs = {
        (row.role_id, row.permission_id)
        for row in db.scalars(select(RolePermission)).all()
    }
    for role_key, permission_keys in ROLE_PERMISSION_MAP.items():
        role = role_by_key.get(role_key)
        if not role:
            continue
        for permission_key in permission_keys:
            permission = permission_by_key.get(permission_key)
            if not permission:
                continue
            if (role.id, permission.id) in existing_pairs:
                continue
            db.add(RolePermission(role_id=role.id, permission_id=permission.id))

    db.flush()


def resolve_user_permissions(db: Session, user: User) -> set[str]:
    ensure_default_catalog_seeded(db)

    role_rows = db.execute(
        select(RoleCatalog.role_key)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == RoleCatalog.id)
        .where(UserRoleAssignment.user_id == user.id, UserRoleAssignment.is_active.is_(True))
    ).all()
    role_keys = {_normalize_role_key(row.role_key) for row in role_rows if row.role_key}

    if not role_keys:
        mapped = map_primary_role_for_user(user)
        if mapped:
            role_keys.add(mapped)

    permissions: set[str] = set()
    for role_key in role_keys:
        permissions.update(ROLE_PERMISSION_MAP.get(role_key, set()))
    return permissions


def resolve_effective_role_keys(db: Session, user: User) -> set[str]:
    ensure_default_catalog_seeded(db)
    role_rows = db.execute(
        select(RoleCatalog.role_key)
        .join(UserRoleAssignment, UserRoleAssignment.role_id == RoleCatalog.id)
        .where(UserRoleAssignment.user_id == user.id, UserRoleAssignment.is_active.is_(True))
    ).all()
    role_keys = {_normalize_role_key(row.role_key) for row in role_rows if row.role_key}
    if role_keys:
        return role_keys
    mapped = map_primary_role_for_user(user)
    if mapped:
        return {mapped}
    return set()


def has_permission(db: Session, user: User, permission_key: str) -> bool:
    normalized_permission = permission_key.strip().lower()
    return normalized_permission in resolve_user_permissions(db, user)


def ensure_primary_assignment_for_user(
    db: Session,
    *,
    user: User,
    role_key: str,
    scope: str,
    tenant_id: int | None,
    commercial_client_account_id: int | None = None,
) -> None:
    ensure_default_catalog_seeded(db)
    normalized_role_key = map_legacy_role_key(role_key) or _normalize_role_key(role_key)

    role = db.scalar(select(RoleCatalog).where(RoleCatalog.role_key == normalized_role_key))
    if not role:
        return

    assignments = db.scalars(select(UserRoleAssignment).where(UserRoleAssignment.user_id == user.id)).all()
    for row in assignments:
        row.is_primary = False
        row.is_active = True

    existing = db.scalar(
        select(UserRoleAssignment).where(
            UserRoleAssignment.user_id == user.id,
            UserRoleAssignment.role_id == role.id,
            UserRoleAssignment.scope == scope,
            UserRoleAssignment.tenant_id.is_(tenant_id) if tenant_id is None else UserRoleAssignment.tenant_id == tenant_id,
            UserRoleAssignment.commercial_client_account_id.is_(commercial_client_account_id)
            if commercial_client_account_id is None
            else UserRoleAssignment.commercial_client_account_id == commercial_client_account_id,
        )
    )
    if existing:
        existing.is_primary = True
        existing.is_active = True
        return

    db.add(
        UserRoleAssignment(
            user_id=user.id,
            role_id=role.id,
            scope=scope,
            tenant_id=tenant_id,
            commercial_client_account_id=commercial_client_account_id,
            is_primary=True,
            is_active=True,
        )
    )


def role_aliases_for_key(role_key: str) -> set[str]:
    return ROLE_ALIAS_KEYS.get(_normalize_role_key(role_key), {_normalize_role_key(role_key)})


def role_matches_any_alias(user_role: str, role_keys: Iterable[str]) -> bool:
    normalized_user_role = _normalize_role_key(user_role)
    for role_key in role_keys:
        if normalized_user_role in role_aliases_for_key(role_key):
            return True
    return False
