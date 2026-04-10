from pydantic import BaseModel, Field

from app.schemas.common import TimestampSchema


class CommercialClientAccountCreate(BaseModel):
    legal_name: str = Field(min_length=2, max_length=220)
    contact_name: str | None = Field(default=None, max_length=180)
    contact_email: str | None = Field(default=None, max_length=180)
    contact_phone: str | None = Field(default=None, max_length=40)
    billing_model: str = Field(default="fixed_subscription", max_length=30)
    commercial_plan_key: str | None = Field(default=None, max_length=60)
    commercial_limits_json: str = Field(default="{}")
    addons_json: str = Field(default="{}")
    status: str = Field(default="active", max_length=30)
    notes: str | None = None


class CommercialClientAccountUpdate(BaseModel):
    legal_name: str | None = Field(default=None, min_length=2, max_length=220)
    contact_name: str | None = Field(default=None, max_length=180)
    contact_email: str | None = Field(default=None, max_length=180)
    contact_phone: str | None = Field(default=None, max_length=40)
    billing_model: str | None = Field(default=None, max_length=30)
    commercial_plan_key: str | None = Field(default=None, max_length=60)
    commercial_limits_json: str | None = None
    addons_json: str | None = None
    status: str | None = Field(default=None, max_length=30)
    notes: str | None = None


class CommercialClientAccountRead(TimestampSchema):
    id: int
    legal_name: str
    contact_name: str | None
    contact_email: str | None
    contact_phone: str | None
    billing_model: str
    commercial_plan_key: str | None
    commercial_limits_json: str
    addons_json: str
    status: str
    notes: str | None


class AssignTenantToCommercialAccountPayload(BaseModel):
    tenant_id: int
    is_parent_brand: bool = False


class CommercialAccountUsageRead(BaseModel):
    account_id: int
    brands_used: int
    brands_limit: int
    users_used: int
    users_limit: int
    products_used: int
    products_limit: int
    branches_used: int
    branches_limit: int
    ai_tokens_included: int
    ai_tokens_used: int
    ai_tokens_balance: int


class CommercialPlanRequestCreate(BaseModel):
    tenant_id: int
    request_type: str = Field(max_length=30)  # addon|upgrade
    addon_id: str | None = Field(default=None, max_length=60)
    target_plan_key: str | None = Field(default=None, max_length=60)
    notes: str | None = None


class CommercialPlanRequestRead(TimestampSchema):
    id: int
    tenant_id: int
    commercial_client_account_id: int | None
    request_type: str
    addon_id: str | None
    target_plan_key: str | None
    status: str
    notes: str | None
    requested_by_user_id: int | None
