from decimal import Decimal

from app.schemas.common import TimestampSchema


class PlanRead(TimestampSchema):
    id: int
    code: str
    name: str
    type: str
    monthly_price: Decimal
    monthly_price_after_month_2: Decimal
    commission_low_rate: Decimal
    commission_high_rate: Decimal
    commission_threshold: Decimal
    commission_enabled: bool
    notes: str | None
    is_active: bool
