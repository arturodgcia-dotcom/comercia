from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class MembershipPlanCreate(BaseModel):
    tenant_id: int
    name: str
    description: str | None = None
    duration_days: int
    price: Decimal
    points_multiplier: Decimal = Decimal("1")
    benefits_json: str | None = None
    is_active: bool = True


class MembershipPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    duration_days: int | None = None
    price: Decimal | None = None
    points_multiplier: Decimal | None = None
    benefits_json: str | None = None
    is_active: bool | None = None


class MembershipPlanRead(TimestampSchema):
    id: int
    tenant_id: int
    name: str
    description: str | None
    duration_days: int
    price: Decimal
    points_multiplier: Decimal
    benefits_json: str | None
    is_active: bool
