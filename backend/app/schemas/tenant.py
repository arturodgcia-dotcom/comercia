from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class TenantCreate(BaseModel):
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool = True
    plan_id: int | None = None
    plan_type: str | None = None
    commission_rules_json: str | None = None
    subscription_plan_json: str | None = None
    billing_model: str | None = None
    commission_percentage: float | None = None
    commission_enabled: bool | None = None
    commission_scope: str | None = None
    commission_notes: str | None = None
    commercial_plan_key: str | None = None
    commercial_plan_status: str | None = None
    commercial_plan_source: str | None = None
    commercial_client_account_id: int | None = None
    is_parent_brand: bool = False


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    subdomain: str | None = None
    business_type: str | None = None
    is_active: bool | None = None
    plan_id: int | None = None
    plan_type: str | None = None
    commission_rules_json: str | None = None
    subscription_plan_json: str | None = None
    billing_model: str | None = None
    commission_percentage: float | None = None
    commission_enabled: bool | None = None
    commission_scope: str | None = None
    commission_notes: str | None = None
    commercial_plan_key: str | None = None
    commercial_plan_status: str | None = None
    commercial_plan_source: str | None = None
    commercial_client_account_id: int | None = None
    is_parent_brand: bool | None = None
    ai_tokens_locked: bool | None = None
    ai_tokens_lock_reason: str | None = None


class TenantRead(TimestampSchema):
    id: int
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool
    plan_id: int | None
    plan_type: str
    commission_rules_json: str | None
    subscription_plan_json: str | None
    billing_model: str
    commission_percentage: float
    commission_enabled: bool
    commission_scope: str
    commission_notes: str | None
    commercial_plan_key: str | None
    commercial_plan_status: str
    commercial_plan_source: str | None
    commercial_client_account_id: int | None
    is_parent_brand: bool
    commercial_checkout_session_id: str | None
    commercial_limits_json: str | None
    ai_tokens_included: int
    ai_tokens_balance: int
    ai_tokens_used: int
    ai_tokens_locked: bool
    ai_tokens_lock_reason: str | None
