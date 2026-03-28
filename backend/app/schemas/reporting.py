from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMBase, TimestampSchema


class ReportRequestRead(TimestampSchema):
    id: int
    tenant_id: int | None
    requested_by_user_id: int | None
    report_type: str
    date_from: datetime | None
    date_to: datetime | None
    filters_json: str | None
    status: str
    output_format: str


class ReportInsightRead(ORMBase):
    id: int
    tenant_id: int | None
    report_type: str
    title: str
    message: str
    severity: str
    created_at: datetime


class MarketingInsightRead(ORMBase):
    id: int
    tenant_id: int
    insight_type: str
    category: str | None
    product_id: int | None
    message: str
    recommendation: str
    period_label: str
    created_at: datetime


class ReportPeriodQuery(BaseModel):
    period: str = "month"
    date_from: datetime | None = None
    date_to: datetime | None = None

