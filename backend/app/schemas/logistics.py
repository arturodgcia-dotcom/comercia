from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class LogisticsCreate(BaseModel):
    tenant_id: int
    order_id: int | None = None
    recurring_order_schedule_id: int | None = None
    customer_id: int | None = None
    distributor_profile_id: int | None = None
    delivery_type: str
    delivery_address: str
    warehouse_address: str | None = None
    scheduled_delivery_at: datetime | None = None
    tracking_reference: str | None = None
    courier_name: str | None = None
    delivery_notes: str | None = None


class LogisticsScheduleUpdate(BaseModel):
    scheduled_delivery_at: datetime
    tracking_reference: str | None = None
    courier_name: str | None = None
    delivery_notes: str | None = None


class LogisticsRescheduleUpdate(BaseModel):
    scheduled_delivery_at: datetime
    notes: str | None = None


class LogisticsRead(TimestampSchema):
    id: int
    tenant_id: int
    order_id: int | None
    recurring_order_schedule_id: int | None
    customer_id: int | None
    distributor_profile_id: int | None
    delivery_type: str
    status: str
    warehouse_address: str | None
    delivery_address: str
    scheduled_delivery_at: datetime | None
    delivered_at: datetime | None
    tracking_reference: str | None
    courier_name: str | None
    delivery_notes: str | None


class LogisticsEventRead(BaseModel):
    id: int
    logistics_order_id: int
    event_type: str
    event_at: datetime
    notes: str | None
    created_at: datetime
