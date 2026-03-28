from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserRead
from app.services.security_hooks import on_auth_login_failed, on_auth_login_success

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    source_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password) or not user.is_active:
        on_auth_login_failed(db, email=payload.email, source_ip=source_ip, user_agent=user_agent)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")

    on_auth_login_success(
        db,
        user_id=user.id,
        tenant_id=user.tenant_id,
        source_ip=source_ip,
        user_agent=user_agent,
    )
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
