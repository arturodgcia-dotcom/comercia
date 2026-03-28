from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class RecurringOrderCreate(BaseModel):
    tenant_id: int
    customer_id: int | None = None
    distributor_profile_id: int | None = None
    frequency: str
    next_run_at: datetime
    is_active: bool = True
    notes: str | None = None


class RecurringOrderUpdate(BaseModel):
    frequency: str | None = None
    next_run_at: datetime | None = None
    is_active: bool | None = None
    notes: str | None = None


class RecurringOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price_snapshot: Decimal


class RecurringOrderRead(TimestampSchema):
    id: int
    tenant_id: int
    customer_id: int | None
    distributor_profile_id: int | None
    frequency: str
    next_run_at: datetime
    is_active: bool
    notes: str | None
