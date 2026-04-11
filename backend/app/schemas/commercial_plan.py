from pydantic import BaseModel, Field


class CommercialPlanRead(BaseModel):
    id: str
    code: str
    display_name: str
    name: str
    tier: str
    billing_model: str
    commission_enabled: bool
    commission_percentage: str
    monthly_price_mxn: str
    total_price_mxn: str
    stripe_price_id: str
    support: str
    limits: dict
    price_without_tax_mxn: str
    tax_rate: str
    tax_amount_mxn: str
    price_with_tax_mxn: str


class CommercialAddonRead(BaseModel):
    id: str
    code: str
    display_name: str
    name: str
    billing_model: str
    commission_enabled: bool
    commission_percentage: str
    monthly_price_mxn: str
    total_price_mxn: str
    stripe_price_id: str
    price_without_tax_mxn: str
    tax_rate: str
    tax_amount_mxn: str
    price_with_tax_mxn: str


class CommercialPlanCatalogRead(BaseModel):
    iva_rate: str
    plans: list[CommercialPlanRead]
    addons: list[CommercialAddonRead]


class CommercialPlanCheckoutRequest(BaseModel):
    tenant_id: int | None = None
    plan_key: str | None = None
    item_code: str | None = None
    success_url: str
    cancel_url: str


class CommercialPlanCheckoutResponse(BaseModel):
    item_code: str
    item_type: str
    checkout_url: str
    session_id: str
    total_price_mxn: str


class TenantCommercialStatusRead(BaseModel):
    tenant_id: int
    commercial_plan_key: str | None
    commercial_plan_status: str
    commercial_plan_source: str | None
    billing_model: str
    commission_enabled: bool
    commission_percentage: str
    limits: dict
    ai_tokens_included: int
    ai_tokens_balance: int
    ai_tokens_used: int
    ai_tokens_locked: bool
    ai_tokens_lock_reason: str | None
    plan_display_name: str | None = None
    support: str | None = None
    plan_activated_at: str | None = None


class TenantAddonUsageRead(BaseModel):
    addon_id: str
    addon_name: str
    quantity: int


class TenantCommercialUsageRead(BaseModel):
    tenant_id: int
    brands_used: int
    brands_limit: int
    users_used: int
    users_limit: int
    ai_agents_used: int
    ai_agents_limit: int
    products_used: int
    products_limit: int
    branches_used: int
    branches_limit: int
    branches_active: int
    branches_inactive: int
    ai_tokens_included: int
    ai_tokens_used: int
    ai_tokens_balance: int
    addons: list[TenantAddonUsageRead] = Field(default_factory=list)


class TokenConsumeRequest(BaseModel):
    tokens: int = Field(ge=1)
    reason: str | None = None


class TokenTopupRequest(BaseModel):
    tokens: int = Field(ge=1)
    reason: str | None = None


class TokenLockRequest(BaseModel):
    locked: bool
    reason: str | None = None
