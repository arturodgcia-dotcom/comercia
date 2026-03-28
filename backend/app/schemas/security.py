from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.schemas.common import ORMBase, TimestampSchema


class SecurityEventRead(ORMBase):
    id: int
    tenant_id: int | None
    user_id: int | None
    event_type: str
    source_ip: str | None
    user_agent: str | None
    severity: str
    status: str
    event_payload_json: str | None
    created_at: datetime


class SecurityAlertRead(ORMBase):
    id: int
    tenant_id: int | None
    security_event_id: int | None
    alert_type: str
    title: str
    message: str
    severity: str
    is_read: bool
    assigned_to: str | None
    created_at: datetime


class SecurityRuleRead(TimestampSchema):
    id: int
    code: str
    name: str
    description: str | None
    rule_type: str
    threshold_count: int | None
    threshold_window_minutes: int | None
    action_type: str
    is_active: bool
    severity: str


class SecurityRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    threshold_count: int | None = None
    threshold_window_minutes: int | None = None
    action_type: str | None = None
    severity: str | None = None


class ToggleRuleResponse(BaseModel):
    id: int
    is_active: bool


class BlockedEntityCreate(BaseModel):
    entity_type: str
    entity_key: str
    reason: str
    blocked_until: datetime | None = None


class BlockedEntityRead(ORMBase):
    id: int
    entity_type: str
    entity_key: str
    reason: str
    blocked_until: datetime | None
    is_active: bool
    created_at: datetime


class SecurityKpisResponse(BaseModel):
    total_events: int
    critical_events: int
    high_events: int
    medium_events: int
    low_events: int
    new_alerts: int
    unread_alerts: int
    blocked_entities: int
    top_event_types: list[dict[str, Any]]

