from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
GLOBAL_ADMIN_ROLES = {"reinpia_admin", "super_admin"}
FINANCE_VIEW_ROLES = {"reinpia_admin", "super_admin", "contador"}
NERVIA_OPERATOR_ROLES = {"reinpia_admin", "super_admin", "agency_admin"}


def _get_forced_superadmin_user(db: Session) -> User:
    settings = get_settings()
    user = db.scalar(
        select(User).where(
            User.email == settings.force_superadmin_email,
            User.is_active.is_(True),
        )
    )
    if user:
        return user

    user = db.scalar(
        select(User).where(
            User.role.in_(tuple(GLOBAL_ADMIN_ROLES)),
            User.is_active.is_(True),
        ).order_by(User.id.asc())
    )
    if user:
        return user

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="FORCE_SUPERADMIN_AUTH activo pero no hay un usuario reinpia_admin activo",
    )


def get_current_user(token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    settings = get_settings()
    if settings.environment.lower() != "production" and settings.force_superadmin_auth:
        return _get_forced_superadmin_user(db)

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales invalidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", "0"))
    except Exception as exc:
        raise credentials_error from exc

    user = db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise credentials_error
    return user


def get_reinpia_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in GLOBAL_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="requiere rol super_admin o reinpia_admin")
    return current_user


def get_finance_view_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in FINANCE_VIEW_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="requiere rol financiero autorizado")
    return current_user


def get_nervia_operator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in NERVIA_OPERATOR_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="requiere rol operativo de Nervia")
    return current_user
