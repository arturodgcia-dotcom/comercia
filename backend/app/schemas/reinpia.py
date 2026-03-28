from datetime import datetime

from app.schemas.common import ORMBase, TimestampSchema


class SubscriptionRead(TimestampSchema):
    id: int
    tenant_id: int
    plan_id: int
    status: str
    started_at: datetime
    ends_at: datetime | None

