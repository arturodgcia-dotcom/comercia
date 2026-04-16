from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class AutonomyLevelRead(TimestampSchema):
    id: int
    level: int
    code: str
    display_name: str
    description: str
    is_premium: bool


class AiProviderSettingRead(TimestampSchema):
    id: int
    provider_key: str
    display_name: str
    is_enabled: bool
    default_model: str
    api_key_masked: str | None = None
    config_json: str | None = None


class AiProviderSettingUpdate(BaseModel):
    is_enabled: bool | None = None
    default_model: str | None = None
    api_key: str | None = None
    config_json: str | None = None


class AiAgentRead(TimestampSchema):
    id: int
    tenant_id: int | None
    name: str
    description: str | None
    provider_key: str
    autonomy_level: int
    status: str
    is_active: bool
    total_actions: int
    successful_actions: int
    estimated_roi_mxn: Decimal
    last_action_at: datetime | None
    owner_scope: str


class AiAgentCreate(BaseModel):
    tenant_id: int | None = None
    name: str
    description: str | None = None
    provider_key: str
    autonomy_level: int
    status: str = "activo"
    is_active: bool = True
    owner_scope: str = "global"


class AiAgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    provider_key: str | None = None
    autonomy_level: int | None = None
    status: str | None = None
    is_active: bool | None = None
    owner_scope: str | None = None


class AiUsageRead(TimestampSchema):
    id: int
    tenant_id: int | None
    agent_id: int | None
    provider_key: str
    usage_date: date
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_mxn: Decimal
    estimated_value_mxn: Decimal


class AiEventRead(BaseModel):
    id: int
    tenant_id: int | None
    agent_id: int | None
    event_type: str
    event_status: str
    summary: str
    action_payload_json: str | None
    result_payload_json: str | None
    provider_key: str
    autonomy_level: int
    tokens_used: int
    cost_mxn: Decimal
    estimated_value_mxn: Decimal
    roi_delta_mxn: Decimal
    created_at: datetime


class AiEventCreate(BaseModel):
    tenant_id: int | None = None
    event_type: str
    event_status: str = "ejecutado"
    summary: str
    action_payload_json: str | None = None
    result_payload_json: str | None = None
    tokens_used: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cost_mxn: Decimal = Decimal("0")
    estimated_value_mxn: Decimal = Decimal("0")


class AiAutonomyDashboardRead(BaseModel):
    active_agents: int
    total_consumption_tokens: int
    total_cost_mxn: Decimal
    total_actions: int
    estimated_roi_mxn: Decimal
    success_rate_pct: float
    autonomy_distribution: list[dict[str, int]]
    provider_distribution: list[dict[str, int]]
    recent_events: list[AiEventRead]
