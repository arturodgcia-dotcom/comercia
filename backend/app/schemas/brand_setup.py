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
    file_url: str | None = None
    uploaded_at: datetime


class BrandIdentityData(BaseModel):
    brand_name: str
    business_description: str
    business_type: str
    has_existing_landing: bool = False
    existing_landing_url: str | None = None
    primary_color: str
    secondary_color: str
    brand_tone: str
    logo_asset_id: str | None = None
    base_image_asset_ids: list[str] = Field(default_factory=list)


class BrandGeneratedContent(BaseModel):
    prompt_master: str
    value_proposition: str
    communication_tone: str
    suggested_sections: list[str] = Field(default_factory=list)
    base_copy: str


class BrandLandingSection(BaseModel):
    title: str
    body: str


class BrandLandingDraft(BaseModel):
    hero_title: str
    hero_subtitle: str
    cta_primary: str
    cta_secondary: str
    sections: list[BrandLandingSection] = Field(default_factory=list)
    contact_cta: str


class BrandEcommerceData(BaseModel):
    catalog_mode: str = "manual"
    categories_ready: bool = False
    products_ready: bool = False
    distributor_catalog_ready: bool = False
    volume_rules_ready: bool = False
    recurring_orders_ready: bool = False
    massive_upload_enabled: bool = False
    notes: str | None = None


class EcommercePublicSummary(BaseModel):
    categories_count: int = 0
    products_count: int = 0
    services_count: int = 0
    stripe_products_synced: int = 0
    stripe_products_total: int = 0
    stripe_sync_status: str = "pendiente"
    last_import_at: datetime | None = None
    last_import_total_rows: int = 0
    last_import_valid_rows: int = 0
    last_import_error_rows: int = 0
    last_import_categories_created: int = 0
    last_import_products_created: int = 0
    last_import_products_updated: int = 0
    import_completed: bool = False
    ready_for_approval: bool = False
    step_status: str = "pending"


class BrandPosSetupData(BaseModel):
    pos_enabled: bool = True
    payment_methods: list[str] = Field(default_factory=list)
    qr_enabled: bool = True
    payment_link_enabled: bool = True
    notes: str | None = None


class BrandSetupWorkflowRead(BaseModel):
    tenant_id: int
    tenant_name: str
    tenant_slug: str
    current_step: str
    is_published: bool = False
    prompt_master: str | None = None
    selected_template: str | None = None
    landing_template: str | None = None
    public_store_template: str | None = None
    distributor_store_template: str | None = None
    billing_model: str | None = None
    commission_percentage: float | None = None
    commission_enabled: bool | None = None
    commission_scope: str | None = None
    commission_notes: str | None = None
    commercial_plan_key: str | None = None
    commercial_plan_status: str | None = None
    ai_tokens_balance: int | None = None
    ai_tokens_locked: bool | None = None
    flow_type: str = "without_landing"
    steps: list[BrandSetupStepState]
    assets: list[BrandSetupAssetRead]
    identity_data: BrandIdentityData | None = None
    generated_content: BrandGeneratedContent | None = None
    landing_draft: BrandLandingDraft | None = None
    ecommerce_data: BrandEcommerceData | None = None
    ecommerce_public_summary: EcommercePublicSummary | None = None
    pos_setup_data: BrandPosSetupData | None = None


class BrandSetupWorkflowUpdate(BaseModel):
    current_step: str | None = None
    is_published: bool | None = None
    prompt_master: str | None = None
    selected_template: str | None = None
    landing_template: str | None = None
    public_store_template: str | None = None
    distributor_store_template: str | None = None
    billing_model: str | None = None
    commission_percentage: float | None = None
    commission_enabled: bool | None = None
    commission_scope: str | None = None
    commission_notes: str | None = None
    flow_type: str | None = None
    steps: list[BrandSetupStepState] | None = None
    identity_data: BrandIdentityData | None = None
    generated_content: BrandGeneratedContent | None = None
    landing_draft: BrandLandingDraft | None = None
    ecommerce_data: BrandEcommerceData | None = None
    pos_setup_data: BrandPosSetupData | None = None


class BrandGenerateContentRequest(BaseModel):
    prompt_master: str


class BrandGenerateLandingRequest(BaseModel):
    regenerate: bool = False


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
    mercadopago_qr_enabled: bool = True
    mercadopago_payment_link_enabled: bool = True
    mercadopago_point_enabled: bool = False
    mercadopago_active_for_pos_only: bool = True
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
    mercadopago_qr_enabled: bool | None = None
    mercadopago_payment_link_enabled: bool | None = None
    mercadopago_point_enabled: bool | None = None
    mercadopago_active_for_pos_only: bool | None = None
    mfa_totp_enabled: bool | None = None
    mfa_required_for_admins: bool | None = None
    mfa_required_for_staff: bool | None = None
    mfa_required_for_distributors: bool | None = None
    mfa_required_for_public: bool | None = None
