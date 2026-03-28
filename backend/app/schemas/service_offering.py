from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class ServiceOfferingCreate(BaseModel):
    tenant_id: int
    category_id: int | None = None
    name: str
    slug: str
    description: str | None = None
    duration_minutes: int
    price: Decimal
    is_active: bool = True
    is_featured: bool = False
    requires_schedule: bool = True


class ServiceOfferingUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    price: Decimal | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    requires_schedule: bool | None = None


class ServiceOfferingRead(TimestampSchema):
    id: int
    tenant_id: int
    category_id: int | None
    name: str
    slug: str
    description: str | None
    duration_minutes: int
    price: Decimal
    is_active: bool
    is_featured: bool
    requires_schedule: bool
