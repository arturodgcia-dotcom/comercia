from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import ORMBase, TimestampSchema


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


class PosSaleRead(ORMBase):
    id: int
    tenant_id: int
    pos_location_id: int
    customer_id: int | None
    employee_id: int | None
    subtotal_amount: Decimal
    discount_amount: Decimal
    commission_amount: Decimal
    net_amount: Decimal
    total_amount: Decimal
    payment_mode: str
    currency: str
    payment_method: str
    notes: str | None
    created_at: datetime


class PosPaymentCreateRequest(BaseModel):
    tenant_id: int
    pos_location_id: int | None = None
    customer_id: int | None = None
    employee_id: int | None = None
    amount: Decimal
    currency: str = "MXN"
    sale_payload: dict | None = None
    notes: str | None = None


class PosPaymentConfirmRequest(BaseModel):
    external_reference: str
    paid: bool = True
    provider_payload: dict | None = None
    notes: str | None = None


class PosPaymentTransactionRead(ORMBase):
    id: int
    tenant_id: int
    pos_sale_id: int | None
    pos_location_id: int | None
    customer_id: int | None
    employee_id: int | None
    payment_provider: str
    payment_method: str
    status: str
    external_reference: str
    amount: Decimal
    currency: str
    payment_url: str | None
    qr_payload: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PosMembershipRegistrationRead(ORMBase):
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


class PosCustomerRead(ORMBase):
    id: int
    tenant_id: int
    full_name: str
    email: str | None
    phone: str | None
    loyalty_points: int
