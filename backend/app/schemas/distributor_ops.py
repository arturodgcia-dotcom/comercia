from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class DistributorApplicationCreate(BaseModel):
    tenant_id: int
    company_name: str
    contact_name: str
    email: str
    phone: str
    city: str | None = None
    state: str | None = None
    country: str | None = None
    requested_by_user_id: int | None = None
    notes: str | None = None


class DistributorApplicationStatus(BaseModel):
    notes: str | None = None


class DistributorApplicationRead(TimestampSchema):
    id: int
    tenant_id: int
    company_name: str
    contact_name: str
    email: str
    phone: str
    city: str | None
    state: str | None
    country: str | None
    status: str
    requested_by_user_id: int | None
    notes: str | None


class DistributorProfileRead(TimestampSchema):
    id: int
    tenant_id: int
    customer_id: int | None
    distributor_application_id: int | None
    business_name: str
    contact_name: str
    email: str
    phone: str
    is_authorized: bool
    authorization_date: str | None
    can_purchase_wholesale: bool
    can_sell_as_franchise: bool
    warehouse_address: str | None
    delivery_notes: str | None


class DistributorProfileCreate(BaseModel):
    tenant_id: int
    business_name: str
    contact_name: str
    email: str
    phone: str
    is_authorized: bool = False
    can_purchase_wholesale: bool = True
    can_sell_as_franchise: bool = False
    warehouse_address: str | None = None
    delivery_notes: str | None = None


class DistributorProfileAuthorize(BaseModel):
    notes: str | None = None


class DistributorProfileSummaryRead(BaseModel):
    distributor_profile_id: int
    tenant_id: int
    business_name: str
    contact_name: str
    email: str
    is_authorized: bool
    employees_count: int
    distributor_users_count: int
    pos_sales_count: int
    pos_sales_total_mxn: float


class DistributorEmployeeCreate(BaseModel):
    tenant_id: int
    distributor_profile_id: int
    full_name: str
    email: str
    phone: str | None = None
    role_name: str | None = None
    is_active: bool = True


class DistributorEmployeeRead(TimestampSchema):
    id: int
    tenant_id: int
    distributor_profile_id: int
    full_name: str
    email: str
    phone: str | None
    role_name: str | None
    is_active: bool
