from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class BotChannelConfigCreate(BaseModel):
    tenant_id: int | None = None
    channel: str
    is_enabled: bool = False
    provider_name: str | None = None
    config_json: str | None = None


class BotChannelConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    provider_name: str | None = None
    config_json: str | None = None


class BotChannelConfigRead(TimestampSchema):
    id: int
    tenant_id: int | None
    channel: str
    is_enabled: bool
    provider_name: str | None
    config_json: str | None


class BotMessageTemplateCreate(BaseModel):
    tenant_id: int | None = None
    event_type: str
    channel: str
    template_text: str
    is_active: bool = True


class BotMessageTemplateRead(TimestampSchema):
    id: int
    tenant_id: int | None
    event_type: str
    channel: str
    template_text: str
    is_active: bool


class AutomationEventRead(BaseModel):
    id: int
    tenant_id: int | None
    event_type: str
    related_entity_type: str | None
    related_entity_id: int | None
    payload_json: str | None
    created_at: datetime


class AutomationEventCreate(BaseModel):
    tenant_id: int | None = None
    event_type: str
    related_entity_type: str | None = None
    related_entity_id: int | None = None
    payload_json: str | None = None
