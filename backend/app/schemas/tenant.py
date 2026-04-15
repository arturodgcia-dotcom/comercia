from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class TenantCreate(BaseModel):
    name: str
    slug: str
    subdomain: str
    business_type: str
    tenant_type: str = "direct_client_tenant"
    owner_scope: str = "reinpia_internal"
    owner_agency_tenant_id: int | None = None
    comercia_connection_enabled: bool = False
    comercia_connection_source: str | None = None
    nervia_sync_enabled: bool = False
    nervia_customer_identifier: str | None = None
    nervia_marketing_contract_active: bool = False
    acquisition_origin: str = "reinpia_direct"
    acquisition_commission_agent_id: int | None = None
    acquisition_referral_code: str | None = None
    acquisition_notes: str | None = None
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
    tenant_type: str | None = None
    owner_scope: str | None = None
    owner_agency_tenant_id: int | None = None
    comercia_connection_enabled: bool | None = None
    comercia_connection_source: str | None = None
    nervia_sync_enabled: bool | None = None
    nervia_customer_identifier: str | None = None
    nervia_marketing_contract_active: bool | None = None
    acquisition_origin: str | None = None
    acquisition_commission_agent_id: int | None = None
    acquisition_referral_code: str | None = None
    acquisition_notes: str | None = None
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
    tenant_type: str
    owner_scope: str
    owner_agency_tenant_id: int | None
    comercia_connection_enabled: bool
    comercia_connection_source: str | None
    nervia_sync_enabled: bool
    nervia_customer_identifier: str | None
    nervia_marketing_contract_active: bool
    acquisition_origin: str
    acquisition_commission_agent_id: int | None
    acquisition_referral_code: str | None
    acquisition_notes: str | None
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
