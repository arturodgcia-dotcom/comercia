from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class SalesCommissionAgentCreate(BaseModel):
    full_name: str
    email: str
    phone: str | None = None
    is_active: bool = True
    commission_percentage: Decimal = Decimal("30")
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    notes: str | None = None


class SalesCommissionAgentUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    commission_percentage: Decimal | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    notes: str | None = None


class SalesCommissionAgentRead(TimestampSchema):
    id: int
    code: str
    full_name: str
    email: str
    phone: str | None
    is_active: bool
    commission_percentage: Decimal
    valid_from: datetime | None
    valid_until: datetime | None
    notes: str | None


class SalesReferralCreate(BaseModel):
    commission_agent_id: int | None = None
    tenant_id: int | None = None
    lead_email: str | None = None
    lead_name: str | None = None
    lead_phone: str | None = None
    source_type: str = "direct"
    referral_code_entered: str | None = None
    plan_code: str | None = None
    needs_followup: bool = False
    needs_appointment: bool = False
    requested_contact: bool = False
    status: str = "lead"


class SalesReferralRead(TimestampSchema):
    id: int
    commission_agent_id: int | None
    tenant_id: int | None
    lead_email: str | None
    lead_name: str | None
    lead_phone: str | None
    source_type: str
    referral_code_entered: str | None
    plan_code: str | None
    needs_followup: bool
    needs_appointment: bool
    requested_contact: bool
    status: str


class PlanPurchaseLeadCreate(BaseModel):
    company_name: str
    legal_type: str
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    selected_plan_code: str
    referral_code: str | None = None
    source_type: str = "direct"
    needs_followup: bool = True
    needs_appointment: bool = False
    notes: str | None = None
    purchase_status: str = "initiated"


class PlanPurchaseLeadRead(TimestampSchema):
    id: int
    company_name: str
    legal_type: str
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    selected_plan_code: str
    commission_agent_id: int | None
    referral_code: str | None
    is_commissioned_sale: bool
    needs_followup: bool
    needs_appointment: bool
    purchase_status: str
    notes: str | None


class InternalAlertRead(BaseModel):
    id: int
    alert_type: str
    related_entity_type: str | None
    related_entity_id: int | None
    tenant_id: int | None
    commission_agent_id: int | None
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime
