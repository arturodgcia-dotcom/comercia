from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class TenantCreate(BaseModel):
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool = True


class TenantRead(TimestampSchema):
    id: int
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool
