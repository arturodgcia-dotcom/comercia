from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(TimestampSchema):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    tenant_id: int | None
