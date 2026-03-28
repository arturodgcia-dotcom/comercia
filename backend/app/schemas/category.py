from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class CategoryCreate(BaseModel):
    tenant_id: int
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    is_active: bool | None = None


class CategoryRead(TimestampSchema):
    id: int
    tenant_id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
