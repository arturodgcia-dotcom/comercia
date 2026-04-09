from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import TimestampSchema


class MarketingProspectInternalSection(BaseModel):
    title: str
    body: str


class MarketingProspectStatusEvent(BaseModel):
    status: str
    changed_at: datetime
    note: str | None = None


class MarketingProspectCreate(BaseModel):
    contact_name: str = Field(min_length=2, max_length=180)
    contact_email: str = Field(min_length=5, max_length=180)
    contact_phone: str | None = Field(default=None, max_length=40)
    company_brand: str = Field(min_length=2, max_length=180)
    location: str | None = Field(default=None, max_length=180)
    industry: str | None = Field(default=None, max_length=120)
    sells: str = Field(default="productos", max_length=30)
    main_goal: str = Field(default="ventas", max_length=40)
    desired_conversion_channel: str = Field(default="ecommerce", max_length=50)
    active_social_networks: str | None = Field(default=None, max_length=255)
    products_to_promote: int = Field(default=1, ge=1, le=20000)
    average_ticket_mxn: Decimal = Field(default=Decimal("0"), ge=0)
    offer_clarity: str | None = Field(default=None, max_length=30)
    urgency: str = Field(default="media", max_length=30)
    followup_level: str = Field(default="medio", max_length=30)
    has_landing: bool = False
    has_ecommerce: bool = False
    needs_extra_landing: bool = False
    needs_extra_ecommerce: bool = False
    needs_commercial_tracking: bool = False
    wants_custom_proposal: bool = True
    client_notes: str | None = Field(default=None, max_length=4000)
    channel: str = Field(default="landing_marketing_form", max_length=40)


class MarketingProspectRead(TimestampSchema):
    id: int
    contact_name: str
    contact_email: str
    contact_phone: str | None
    company_brand: str
    location: str | None
    industry: str | None
    sells: str
    main_goal: str
    desired_conversion_channel: str
    active_social_networks: str | None
    products_to_promote: int
    average_ticket_mxn: Decimal
    offer_clarity: str | None
    urgency: str
    followup_level: str
    has_landing: bool
    has_ecommerce: bool
    needs_extra_landing: bool
    needs_extra_ecommerce: bool
    needs_commercial_tracking: bool
    wants_custom_proposal: bool
    client_notes: str | None
    status: str
    status_history: list[MarketingProspectStatusEvent]
    internal_notes: str | None
    contacted_at: datetime | None
    responsible_user_id: int | None
    channel: str
    internal_summary: str
    internal_sections: list[MarketingProspectInternalSection]
    suggested_price_min_mxn: Decimal
    suggested_price_max_mxn: Decimal
    suggested_price_mxn: Decimal
    recommended_services: list[str]
    risks: list[str]


class MarketingProspectUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=30)
    internal_notes: str | None = Field(default=None, max_length=5000)
    contacted_at: datetime | None = None
    responsible_user_id: int | None = None
