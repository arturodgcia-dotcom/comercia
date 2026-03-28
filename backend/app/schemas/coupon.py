from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class CouponCreate(BaseModel):
    tenant_id: int
    code: str
    description: str | None = None
    discount_type: str
    discount_value: Decimal
    min_order_amount: Decimal | None = None
    max_uses: int | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    applies_to: str = "all"
    is_active: bool = True


class CouponUpdate(BaseModel):
    description: str | None = None
    discount_type: str | None = None
    discount_value: Decimal | None = None
    min_order_amount: Decimal | None = None
    max_uses: int | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    applies_to: str | None = None
    is_active: bool | None = None


class CouponRead(TimestampSchema):
    id: int
    tenant_id: int
    code: str
    description: str | None
    discount_type: str
    discount_value: Decimal
    min_order_amount: Decimal | None
    max_uses: int | None
    used_count: int
    starts_at: datetime | None
    ends_at: datetime | None
    applies_to: str
    is_active: bool


class CouponValidateRequest(BaseModel):
    tenant_id: int
    code: str
    order_total: Decimal
    applies_to: str = "public"
