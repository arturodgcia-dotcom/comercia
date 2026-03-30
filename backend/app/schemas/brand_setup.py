from datetime import datetime

from pydantic import BaseModel, Field


class BrandSetupStepState(BaseModel):
    code: str
    title: str
    status: str = "pending"
    approved: bool = False
    review_notes: str | None = None
    updated_at: datetime | None = None


class BrandSetupAssetRead(BaseModel):
    id: str
    step_code: str
    asset_type: str
    file_name: str
    file_path: str
    uploaded_at: datetime


class BrandSetupWorkflowRead(BaseModel):
    tenant_id: int
    tenant_name: str
    tenant_slug: str
    current_step: str
    is_published: bool = False
    prompt_master: str | None = None
    selected_template: str | None = None
    steps: list[BrandSetupStepState]
    assets: list[BrandSetupAssetRead]


class BrandSetupWorkflowUpdate(BaseModel):
    current_step: str | None = None
    is_published: bool | None = None
    prompt_master: str | None = None
    selected_template: str | None = None
    steps: list[BrandSetupStepState] | None = None


class BrandChannelSettingsRead(BaseModel):
    tenant_id: int
    nfc_enabled: bool = False
    nfc_setup_fee: int = 500
    nfc_card_price_standard: int = 200
    nfc_card_price_bulk: int = 150
    nfc_bulk_threshold: int = 10
    mercadopago_enabled: bool = False
    mercadopago_public_key: str | None = None
    mercadopago_access_token: str | None = None
    mercadopago_point_enabled: bool = False
    mfa_totp_enabled: bool = False
    mfa_required_for_admins: bool = True
    mfa_required_for_staff: bool = False
    mfa_required_for_distributors: bool = False
    mfa_required_for_public: bool = False


class BrandChannelSettingsUpdate(BaseModel):
    nfc_enabled: bool | None = None
    nfc_setup_fee: int | None = Field(default=None, ge=0)
    nfc_card_price_standard: int | None = Field(default=None, ge=0)
    nfc_card_price_bulk: int | None = Field(default=None, ge=0)
    nfc_bulk_threshold: int | None = Field(default=None, ge=1)
    mercadopago_enabled: bool | None = None
    mercadopago_public_key: str | None = None
    mercadopago_access_token: str | None = None
    mercadopago_point_enabled: bool | None = None
    mfa_totp_enabled: bool | None = None
    mfa_required_for_admins: bool | None = None
    mfa_required_for_staff: bool | None = None
    mfa_required_for_distributors: bool | None = None
    mfa_required_for_public: bool | None = None
