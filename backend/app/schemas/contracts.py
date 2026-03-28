from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class ContractTemplateCreate(BaseModel):
    tenant_id: int | None = None
    contract_type: str
    name: str
    content_markdown: str
    is_active: bool = True


class ContractTemplateRead(TimestampSchema):
    id: int
    tenant_id: int | None
    contract_type: str
    name: str
    content_markdown: str
    is_active: bool


class ContractTemplateUpdate(BaseModel):
    contract_type: str | None = None
    name: str | None = None
    content_markdown: str | None = None
    is_active: bool | None = None


class SignedContractCreate(BaseModel):
    tenant_id: int
    contract_template_id: int
    distributor_profile_id: int | None = None
    signed_by_name: str
    signed_by_email: str
    signature_text: str
    accept_terms: bool = True


class SignedContractRead(TimestampSchema):
    id: int
    tenant_id: int
    contract_template_id: int
    distributor_profile_id: int | None
    signed_by_name: str
    signed_by_email: str
    signed_at: datetime
    signature_text: str
    status: str
