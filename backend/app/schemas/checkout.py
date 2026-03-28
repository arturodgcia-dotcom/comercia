from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase

class CheckoutItemInput(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CheckoutSessionRequest(BaseModel):
    tenant_id: int
    items: list[CheckoutItemInput] = Field(min_length=1)
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    order_id: int
    session_id: str
    session_url: str
    total_amount: Decimal
    commission_amount: Decimal
    net_amount: Decimal
    payment_mode: str


class OrderItemRead(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class OrderRead(ORMBase):
    id: int
    tenant_id: int
    customer_id: int | None
    total_amount: Decimal
    commission_amount: Decimal
    net_amount: Decimal
    currency: str
    status: str
    payment_mode: str
    stripe_session_id: str | None
    stripe_payment_intent_id: str | None
    created_at: datetime


class PaymentDashboardResponse(BaseModel):
    orders: list[OrderRead]
    total_sold: Decimal
    total_commission: Decimal
    total_net: Decimal
