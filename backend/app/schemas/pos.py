from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class PosLocationCreate(BaseModel):
    tenant_id: int
    name: str
    code: str
    location_type: str
    address: str
    is_active: bool = True


class PosLocationUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    location_type: str | None = None
    address: str | None = None
    is_active: bool | None = None


class PosLocationRead(TimestampSchema):
    id: int
    tenant_id: int
    name: str
    code: str
    location_type: str
    address: str
    is_active: bool


class PosEmployeeCreate(BaseModel):
    tenant_id: int
    pos_location_id: int
    distributor_profile_id: int | None = None
    full_name: str
    email: str
    phone: str | None = None
    role_name: str
    is_active: bool = True


class PosEmployeeUpdate(BaseModel):
    pos_location_id: int | None = None
    distributor_profile_id: int | None = None
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    role_name: str | None = None
    is_active: bool | None = None


class PosEmployeeRead(TimestampSchema):
    id: int
    tenant_id: int
    pos_location_id: int
    distributor_profile_id: int | None
    full_name: str
    email: str
    phone: str | None
    role_name: str
    is_active: bool


class PosSaleItemPayload(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal


class PosSaleCreate(BaseModel):
    tenant_id: int
    pos_location_id: int
    customer_id: int | None = None
    employee_id: int | None = None
    currency: str = "MXN"
    payment_method: str = "cash"
    notes: str | None = None
    coupon_code: str | None = None
    use_loyalty_points: bool = False
    register_membership: bool = False
    items: list[PosSaleItemPayload]


class PosSaleRead(BaseModel):
    id: int
    tenant_id: int
    pos_location_id: int
    customer_id: int | None
    employee_id: int | None
    subtotal_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    payment_method: str
    notes: str | None
    created_at: datetime


class PosMembershipRegistrationRead(BaseModel):
    id: int
    tenant_id: int
    customer_id: int
    pos_location_id: int
    registration_source: str
    created_at: datetime


class PosCustomerCreate(BaseModel):
    tenant_id: int
    full_name: str
    email: str | None = None
    phone: str | None = None


class PosCustomerRead(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    email: str | None
    phone: str | None
    loyalty_points: int
