from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class AdminUserRead(TimestampSchema):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    tenant_id: int | None
    preferred_language: str


class AdminUserCreate(BaseModel):
    email: str
    full_name: str
    role: str
    password: str
    tenant_id: int | None = None
    preferred_language: str = "es"
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    password: str | None = None
    preferred_language: str | None = None
    is_active: bool | None = None
