from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class ProductCreate(BaseModel):
    tenant_id: int
    category_id: int | None = None
    name: str
    slug: str
    description: str | None = None
    price_public: Decimal
    price_wholesale: Decimal | None = None
    price_retail: Decimal | None = None
    is_featured: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    price_public: Decimal | None = None
    price_wholesale: Decimal | None = None
    price_retail: Decimal | None = None
    is_featured: bool | None = None
    is_active: bool | None = None


class ProductRead(TimestampSchema):
    id: int
    tenant_id: int
    category_id: int | None
    name: str
    slug: str
    description: str | None
    price_public: Decimal
    price_wholesale: Decimal | None
    price_retail: Decimal | None
    is_featured: bool
    is_active: bool
