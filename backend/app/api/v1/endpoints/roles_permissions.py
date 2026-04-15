from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import PermissionCatalog, RoleCatalog, RolePermission, User, UserRoleAssignment
from app.schemas.roles_permissions import (
    PermissionCatalogRead,
    RoleCatalogRead,
    RolePermissionRead,
    UserRoleAssignmentCreate,
    UserRoleAssignmentRead,
)
from app.services.role_permissions_service import ensure_default_catalog_seeded, role_matches_any_alias

router = APIRouter()



def _assert_roles_admin(current_user: User) -> None:
    if not role_matches_any_alias(current_user.role, {"super_admin"}):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="requiere rol de super administrador")


@router.get("/roles", response_model=list[RoleCatalogRead])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_roles_admin(current_user)
    ensure_default_catalog_seeded(db)

    rows = db.scalars(select(RoleCatalog).order_by(RoleCatalog.scope.asc(), RoleCatalog.role_key.asc())).all()
    permission_rows = db.execute(
        select(RolePermission.role_id, PermissionCatalog)
        .join(PermissionCatalog, PermissionCatalog.id == RolePermission.permission_id)
        .order_by(PermissionCatalog.domain.asc(), PermissionCatalog.permission_key.asc())
    ).all()

    permissions_by_role: dict[int, list[RolePermissionRead]] = {}
    for role_id, permission in permission_rows:
        permissions_by_role.setdefault(role_id, []).append(
            RolePermissionRead(
                permission_key=permission.permission_key,
                display_name=permission.display_name,
                domain=permission.domain,
            )
        )

    return [
        RoleCatalogRead(
            id=row.id,
            role_key=row.role_key,
            display_name=row.display_name,
            scope=row.scope,
            description=row.description,
            is_system=row.is_system,
            permissions=permissions_by_role.get(row.id, []),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.get("/permissions", response_model=list[PermissionCatalogRead])
def list_permissions(
    domain: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_roles_admin(current_user)
    ensure_default_catalog_seeded(db)

    query = select(PermissionCatalog)
    if domain:
        query = query.where(PermissionCatalog.domain == domain.strip().lower())
    rows = db.scalars(query.order_by(PermissionCatalog.domain.asc(), PermissionCatalog.permission_key.asc())).all()
    return [
        PermissionCatalogRead(
            id=row.id,
            permission_key=row.permission_key,
            display_name=row.display_name,
            domain=row.domain,
            description=row.description,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.get("/role-assignments", response_model=list[UserRoleAssignmentRead])
def list_role_assignments(
    scope: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_roles_admin(current_user)
    ensure_default_catalog_seeded(db)

    query = (
        select(UserRoleAssignment, User, RoleCatalog)
        .join(User, User.id == UserRoleAssignment.user_id)
        .join(RoleCatalog, RoleCatalog.id == UserRoleAssignment.role_id)
        .order_by(UserRoleAssignment.created_at.desc())
    )
    if scope:
        query = query.where(UserRoleAssignment.scope == scope.strip().lower())
    if user_id:
        query = query.where(UserRoleAssignment.user_id == user_id)

    rows = db.execute(query).all()
    return [
        UserRoleAssignmentRead(
            id=assignment.id,
            user_id=user.id,
            user_email=user.email,
            user_full_name=user.full_name,
            role_id=role.id,
            role_key=role.role_key,
            role_display_name=role.display_name,
            scope=assignment.scope,
            commercial_client_account_id=assignment.commercial_client_account_id,
            tenant_id=assignment.tenant_id,
            is_primary=assignment.is_primary,
            is_active=assignment.is_active,
            created_at=assignment.created_at,
            updated_at=assignment.updated_at,
        )
        for assignment, user, role in rows
    ]


@router.post("/role-assignments", response_model=UserRoleAssignmentRead, status_code=status.HTTP_201_CREATED)
def create_role_assignment(
    payload: UserRoleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_roles_admin(current_user)
    ensure_default_catalog_seeded(db)

    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="usuario no encontrado")

    role = db.scalar(select(RoleCatalog).where(RoleCatalog.role_key == payload.role_key.strip().lower()))
    if not role:
        raise HTTPException(status_code=404, detail="rol no encontrado")

    normalized_scope = payload.scope.strip().lower()
    if normalized_scope not in {"global", "client", "brand"}:
        raise HTTPException(status_code=400, detail="scope inválido")

    if normalized_scope == "global":
        target_tenant_id = None
    else:
        target_tenant_id = payload.tenant_id if payload.tenant_id is not None else user.tenant_id

    existing_primary = db.scalars(select(UserRoleAssignment).where(UserRoleAssignment.user_id == user.id)).all()
    if payload.is_primary:
        for item in existing_primary:
            item.is_primary = False

    row = UserRoleAssignment(
        user_id=user.id,
        role_id=role.id,
        scope=normalized_scope,
        commercial_client_account_id=payload.commercial_client_account_id,
        tenant_id=target_tenant_id,
        is_primary=payload.is_primary,
        is_active=payload.is_active,
    )
    user.role = role.role_key

    db.add(row)
    db.commit()
    db.refresh(row)

    return UserRoleAssignmentRead(
        id=row.id,
        user_id=user.id,
        user_email=user.email,
        user_full_name=user.full_name,
        role_id=role.id,
        role_key=role.role_key,
        role_display_name=role.display_name,
        scope=row.scope,
        commercial_client_account_id=row.commercial_client_account_id,
        tenant_id=row.tenant_id,
        is_primary=row.is_primary,
        is_active=row.is_active,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
