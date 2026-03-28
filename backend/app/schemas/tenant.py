from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class TenantCreate(BaseModel):
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool = True
    plan_id: int | None = None


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    subdomain: str | None = None
    business_type: str | None = None
    is_active: bool | None = None
    plan_id: int | None = None


class TenantRead(TimestampSchema):
    id: int
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool
    plan_id: int | None
