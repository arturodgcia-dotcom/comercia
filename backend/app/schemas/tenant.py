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
