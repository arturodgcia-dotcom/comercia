from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import ORMBase, TimestampSchema


class LogisticsAdditionalServiceBase(ORMBase):
    tenant_id: int
    service_type: str = Field(description="recoleccion|entrega|ambos|resguardo")
    origin: str
    destination: str
    kilometers: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    subtotal: Decimal | None = None
    iva: Decimal = Decimal("0")
    total: Decimal | None = None
    currency: str = "MXN"
    observations: str | None = None
    status: str = "pendiente"
    service_date: datetime
    billing_summary: str | None = None


class LogisticsAdditionalServiceCreate(LogisticsAdditionalServiceBase):
    pass


class LogisticsAdditionalServiceUpdate(ORMBase):
    service_type: str | None = None
    origin: str | None = None
    destination: str | None = None
    kilometers: Decimal | None = None
    unit_cost: Decimal | None = None
    subtotal: Decimal | None = None
    iva: Decimal | None = None
    total: Decimal | None = None
    currency: str | None = None
    observations: str | None = None
    status: str | None = None
    service_date: datetime | None = None
    billing_summary: str | None = None


class LogisticsAdditionalServiceRead(LogisticsAdditionalServiceBase, TimestampSchema):
    id: int


class LogisticsAdditionalServiceSummary(ORMBase):
    total_services: int
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    by_status: list[dict]
