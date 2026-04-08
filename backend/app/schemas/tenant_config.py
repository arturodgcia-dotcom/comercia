from pydantic import BaseModel


class TenantCommissionTier(BaseModel):
    up_to: str | None = None
    rate: str
    label: str


class TenantCommissionRules(BaseModel):
    tiers: list[TenantCommissionTier]
    minimum_per_operation: str | None = None


class TenantSubscriptionPlan(BaseModel):
    cycle: str
    price: str
    benefits: list[str]


class LandingVariantCopy(BaseModel):
    headline: str
    subtitle: str
    cta: str


class TenantConfigRead(BaseModel):
    tenant_id: int
    tenant_slug: str
    tenant_name: str
    business_type: str
    plan_type: str
    commission_rules: TenantCommissionRules
    subscription_plan: TenantSubscriptionPlan
    billing_model: str
    commission_percentage: str
    commission_enabled: bool
    commission_scope: str
    commission_notes: str | None = None
    checkout_badge: str
    landing_variant: LandingVariantCopy
