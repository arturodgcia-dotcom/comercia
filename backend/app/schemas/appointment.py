from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class AppointmentSelfCreate(BaseModel):
    tenant_id: int
    customer_id: int | None = None
    service_offering_id: int
    scheduled_for: datetime
    notes: str | None = None


class AppointmentGiftCreate(BaseModel):
    tenant_id: int
    service_offering_id: int
    scheduled_for: datetime
    gift_sender_name: str | None = None
    gift_sender_email: str | None = None
    gift_is_anonymous: bool = False
    gift_message: str | None = None
    gift_recipient_name: str | None = None
    gift_recipient_email: str | None = None
    gift_recipient_phone: str | None = None
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: str


class AppointmentRead(TimestampSchema):
    id: int
    tenant_id: int
    customer_id: int | None
    service_offering_id: int | None
    scheduled_for: datetime | None
    status: str
    is_gift: bool
    gift_sender_name: str | None
    gift_sender_email: str | None
    gift_is_anonymous: bool
    gift_message: str | None
    gift_recipient_name: str | None
    gift_recipient_email: str | None
    gift_recipient_phone: str | None
    instructions_sent_at: datetime | None
    confirmation_received_at: datetime | None
    notes: str | None
