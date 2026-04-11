from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.models import Tenant, User
from app.schemas.users_admin import AdminUserCreate, AdminUserRead, AdminUserUpdate
from app.services.commercial_account_guard_service import enforce_user_limit_for_tenant

router = APIRouter()

GLOBAL_ALLOWED_ROLES = {"reinpia_admin", "super_admin", "contador", "soporte"}
BRAND_ALLOWED_ROLES = {"tenant_admin", "tenant_staff", "distributor_user"}


def _to_read(user: User) -> AdminUserRead:
    return AdminUserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        tenant_id=user.tenant_id,
        preferred_language=user.preferred_language,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _resolve_scope(current_user: User, scope: str, tenant_id: int | None) -> tuple[str, int | None]:
    requested_scope = scope.strip().lower()
    if current_user.role in {"reinpia_admin", "super_admin"}:
        if requested_scope == "global":
            return "global", None
        if requested_scope == "brand":
            if not tenant_id:
                raise HTTPException(status_code=400, detail="tenant_id requerido para scope brand")
            return "brand", tenant_id
        raise HTTPException(status_code=400, detail="scope invalido")

    if current_user.role not in {"tenant_admin", "tenant_staff"}:
        raise HTTPException(status_code=403, detail="sin permisos para administrar usuarios")
    if current_user.tenant_id is None:
        raise HTTPException(status_code=403, detail="usuario sin tenant asignado")
    return "brand", current_user.tenant_id


def _validate_role_for_scope(scope: str, role: str) -> None:
    if scope == "global":
        if role not in GLOBAL_ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="rol no permitido para usuarios globales")
        return
    if role not in BRAND_ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="rol no permitido para usuarios de marca")


@router.get("/users", response_model=list[AdminUserRead])
def list_admin_users(
    scope: str = Query(default="brand", pattern="^(global|brand)$"),
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_scope, resolved_tenant_id = _resolve_scope(current_user, scope, tenant_id)
    if resolved_scope == "global":
        rows = db.scalars(select(User).where(User.tenant_id.is_(None)).order_by(User.id.asc())).all()
        return [_to_read(row) for row in rows]

    rows = db.scalars(select(User).where(User.tenant_id == resolved_tenant_id).order_by(User.id.asc())).all()
    return [_to_read(row) for row in rows]


@router.post("/users", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    payload: AdminUserCreate,
    scope: str = Query(default="brand", pattern="^(global|brand)$"),
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"reinpia_admin", "super_admin", "tenant_admin"}:
        raise HTTPException(status_code=403, detail="sin permisos para crear usuarios")
    resolved_scope, resolved_tenant_id = _resolve_scope(current_user, scope, tenant_id)
    _validate_role_for_scope(resolved_scope, payload.role)

    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="email ya registrado")

    target_tenant_id = None if resolved_scope == "global" else resolved_tenant_id
    if target_tenant_id is not None and not db.get(Tenant, target_tenant_id):
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    if target_tenant_id is not None:
        try:
            enforce_user_limit_for_tenant(db, target_tenant_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    row = User(
        email=payload.email.lower(),
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        tenant_id=target_tenant_id,
        preferred_language=(payload.preferred_language or "es").lower(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_read(row)


@router.put("/users/{user_id}", response_model=AdminUserRead)
def update_admin_user(
    user_id: int,
    payload: AdminUserUpdate,
    scope: str = Query(default="brand", pattern="^(global|brand)$"),
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"reinpia_admin", "super_admin", "tenant_admin"}:
        raise HTTPException(status_code=403, detail="sin permisos para editar usuarios")
    resolved_scope, resolved_tenant_id = _resolve_scope(current_user, scope, tenant_id)

    row = db.get(User, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="usuario no encontrado")
    if resolved_scope == "global":
        if row.tenant_id is not None:
            raise HTTPException(status_code=400, detail="el usuario no pertenece al scope global")
    else:
        if row.tenant_id != resolved_tenant_id:
            raise HTTPException(status_code=403, detail="sin acceso a este usuario")

    updates = payload.model_dump(exclude_unset=True)
    if "role" in updates and updates["role"]:
        _validate_role_for_scope(resolved_scope, str(updates["role"]))
        row.role = str(updates["role"])
    if "full_name" in updates and updates["full_name"]:
        row.full_name = str(updates["full_name"]).strip()
    if "preferred_language" in updates and updates["preferred_language"]:
        row.preferred_language = str(updates["preferred_language"]).lower()
    if "is_active" in updates:
        row.is_active = bool(updates["is_active"])
    if "password" in updates and updates["password"]:
        row.hashed_password = get_password_hash(str(updates["password"]))
    db.commit()
    db.refresh(row)
    return _to_read(row)
