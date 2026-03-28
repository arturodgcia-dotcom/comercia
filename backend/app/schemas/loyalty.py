from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import ORMBase, TimestampSchema


class LoyaltyProgramUpsert(BaseModel):
    name: str
    is_active: bool = True
    points_enabled: bool = True
    points_conversion_rate: Decimal = Decimal("1")
    welcome_points: int = 0
    birthday_points: int | None = None


class LoyaltyProgramRead(TimestampSchema):
    id: int
    tenant_id: int
    name: str
    is_active: bool
    points_enabled: bool
    points_conversion_rate: Decimal
    welcome_points: int
    birthday_points: int | None


class LoyaltyAccountRead(TimestampSchema):
    id: int
    tenant_id: int
    customer_id: int
    loyalty_program_id: int
    points_balance: int
    membership_plan_id: int | None
    membership_expires_at: datetime | None


class LoyaltyApplyPointsRequest(BaseModel):
    order_total: Decimal


class LoyaltyPointsResult(ORMBase):
    discount_amount: Decimal
    points_to_consume: int
