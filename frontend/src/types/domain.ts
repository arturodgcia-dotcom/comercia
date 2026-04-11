export interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  business_type: "products" | "services" | "mixed" | string;
  is_active: boolean;
  plan_id?: number | null;
  plan_type?: "commission" | "subscription" | string;
  commission_rules_json?: string | null;
  subscription_plan_json?: string | null;
  billing_model?: "fixed_subscription" | "commission_based" | string;
  commission_percentage?: number;
  commission_enabled?: boolean;
  commission_scope?: string;
  commission_notes?: string | null;
  commercial_plan_key?: string | null;
  commercial_plan_status?: string;
  commercial_plan_source?: string | null;
  commercial_checkout_session_id?: string | null;
  commercial_limits_json?: string | null;
  commercial_client_account_id?: number | null;
  is_parent_brand?: boolean;
  ai_tokens_included?: number;
  ai_tokens_balance?: number;
  ai_tokens_used?: number;
  ai_tokens_locked?: boolean;
  ai_tokens_lock_reason?: string | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "reinpia_admin" | "tenant_admin" | "tenant_staff" | "distributor_user" | "public_customer" | string;
  is_active: boolean;
  tenant_id: number | null;
  preferred_language?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Plan {
  id: number;
  code: string;
  name: string;
  type: string;
  monthly_price: number;
  monthly_price_after_month_2: number;
  commission_low_rate: number;
  commission_high_rate: number;
  commission_threshold: number;
  commission_enabled: boolean;
  notes?: string;
}

export interface StripeConfig {
  id: number;
  tenant_id: number;
  publishable_key: string;
  secret_key: string;
  webhook_secret?: string;
  is_reinpia_managed: boolean;
  stripe_account_id?: string;
}

export interface MercadoPagoSettings {
  id: number;
  tenant_id: number;
  mercadopago_enabled: boolean;
  mercadopago_public_key?: string | null;
  mercadopago_access_token?: string | null;
  mercadopago_qr_enabled: boolean;
  mercadopago_payment_link_enabled: boolean;
  mercadopago_point_enabled: boolean;
  mercadopago_active_for_pos_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantBranding {
  id: number;
  tenant_id: number;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  font_family?: string;
}

export interface Category {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  tenant_id: number;
  category_id?: number;
  name: string;
  slug: string;
  description?: string;
  price_public: number;
  price_wholesale?: number;
  price_retail?: number;
  stripe_product_id?: string | null;
  stripe_price_id_public?: string | null;
  stripe_price_id_retail?: string | null;
  stripe_price_id_wholesale?: string | null;
  is_featured: boolean;
  is_active: boolean;
}

export interface ServiceOffering {
  id: number;
  tenant_id: number;
  category_id?: number | null;
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  requires_schedule: boolean;
}

export interface StorefrontConfig {
  id: number;
  tenant_id: number;
  is_initialized: boolean;
  hero_banner_url?: string;
  promotion_text?: string;
  ecommerce_enabled: boolean;
  landing_enabled: boolean;
  config_json?: string;
}

export interface StorefrontSnapshot {
  tenant_id: number;
  tenant_slug: string;
  branding?: TenantBranding | null;
  config?: StorefrontConfig | null;
  banners: Banner[];
}

export interface BrandSetupStepState {
  code: string;
  title: string;
  status: "pending" | "in_progress" | "approved" | string;
  approved: boolean;
  review_notes?: string | null;
  updated_at?: string | null;
}

export interface BrandSetupAsset {
  id: string;
  step_code: string;
  asset_type: string;
  file_name: string;
  file_path: string;
  file_url?: string | null;
  uploaded_at: string;
}

export interface BrandSetupWorkflow {
  tenant_id: number;
  tenant_name: string;
  tenant_slug: string;
  current_step: string;
  is_published: boolean;
  prompt_master?: string | null;
  selected_template?: string | null;
  landing_template?: string | null;
  public_store_template?: string | null;
  distributor_store_template?: string | null;
  billing_model?: "fixed_subscription" | "commission_based" | string | null;
  commission_percentage?: number | null;
  commission_enabled?: boolean | null;
  commission_scope?: string | null;
  commission_notes?: string | null;
  commercial_plan_key?: string | null;
  commercial_plan_status?: string | null;
  ai_tokens_balance?: number | null;
  ai_tokens_locked?: boolean | null;
  wizard_status?: string;
  plan_snapshot?: BrandPlanSnapshot | null;
  channel_runtime?: BrandChannelRuntime | null;
  channel_routes?: BrandChannelRoutes | null;
  blocking_issues?: string[];
  flow_type: "with_existing_landing" | "without_landing" | string;
  steps: BrandSetupStepState[];
  assets: BrandSetupAsset[];
  identity_data?: BrandIdentityData | null;
  generated_content?: BrandGeneratedContent | null;
  landing_draft?: BrandLandingDraft | null;
  ecommerce_data?: BrandEcommerceData | null;
  ecommerce_public_summary?: EcommercePublicSummary | null;
  pos_setup_data?: BrandPosSetupData | null;
}

export interface BrandPlanAddon {
  id: string;
  name: string;
  quantity: number;
}

export interface BrandPlanMetric {
  key: string;
  label: string;
  limit: number;
  used: number;
  remaining: number;
  is_exceeded: boolean;
}

export interface BrandPlanSnapshot {
  commercial_plan_key?: string | null;
  commercial_plan_status: string;
  commercial_plan_source?: string | null;
  billing_model: string;
  commission_enabled: boolean;
  commission_percentage: number;
  limits: Record<string, number>;
  metrics: BrandPlanMetric[];
  addons: BrandPlanAddon[];
  ai_tokens_included: number;
  ai_tokens_balance: number;
  ai_tokens_used: number;
  ai_tokens_locked: boolean;
  is_paid_plan: boolean;
}

export interface BrandChannelRuntime {
  landing_external_registered: boolean;
  landing_external_url?: string | null;
  landing_preview_internal_available: boolean;
  landing_review_mode: string;
  landing_last_regenerated_at?: string | null;
  public_last_regenerated_at?: string | null;
  distributors_last_regenerated_at?: string | null;
}

export interface BrandChannelRoutes {
  landing_url: string;
  landing_preview_url: string;
  public_url: string;
  public_preview_url: string;
  distributors_url: string;
  distributors_preview_url: string;
  pos_preview_url: string;
}

export interface BrandIdentityData {
  brand_name: string;
  business_description: string;
  business_type: "products" | "services" | "mixed" | string;
  has_existing_landing: boolean;
  existing_landing_url?: string | null;
  primary_color: string;
  secondary_color: string;
  brand_tone: string;
  logo_asset_id?: string | null;
  base_image_asset_ids: string[];
}

export interface BrandGeneratedContent {
  prompt_master: string;
  value_proposition: string;
  communication_tone: string;
  suggested_sections: string[];
  base_copy: string;
}

export interface BrandLandingSection {
  title: string;
  body: string;
}

export interface BrandLandingDraft {
  hero_title: string;
  hero_subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  sections: BrandLandingSection[];
  contact_cta: string;
}

export interface BrandEcommerceData {
  catalog_mode: "manual" | "bulk" | string;
  categories_ready: boolean;
  products_ready: boolean;
  distributor_catalog_ready: boolean;
  volume_rules_ready: boolean;
  recurring_orders_ready: boolean;
  massive_upload_enabled: boolean;
  notes?: string | null;
}

export interface BrandPosSetupData {
  pos_enabled: boolean;
  payment_methods: string[];
  qr_enabled: boolean;
  payment_link_enabled: boolean;
  notes?: string | null;
}

export interface CatalogImportErrorRow {
  index: number;
  reason: string;
}

export interface CatalogImportJob {
  id: number;
  tenant_id: number;
  source: string;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  categories_created: number;
  products_created: number;
  products_updated: number;
  status: string;
  notes?: string | null;
  created_at: string;
}

export interface CatalogBulkImportResult {
  tenant_id: number;
  job: CatalogImportJob;
  errors: CatalogImportErrorRow[];
}

export interface EcommercePublicSummary {
  categories_count: number;
  products_count: number;
  services_count: number;
  stripe_products_synced: number;
  stripe_products_total: number;
  stripe_sync_status: string;
  last_import_at?: string | null;
  last_import_total_rows: number;
  last_import_valid_rows: number;
  last_import_error_rows: number;
  last_import_categories_created: number;
  last_import_products_created: number;
  last_import_products_updated: number;
  import_completed: boolean;
  ready_for_approval: boolean;
  step_status: string;
}

export interface BrandChannelSettings {
  tenant_id: number;
  nfc_enabled: boolean;
  nfc_setup_fee: number;
  nfc_card_price_standard: number;
  nfc_card_price_bulk: number;
  nfc_bulk_threshold: number;
  mercadopago_enabled: boolean;
  mercadopago_public_key?: string | null;
  mercadopago_access_token?: string | null;
  mercadopago_qr_enabled: boolean;
  mercadopago_payment_link_enabled: boolean;
  mercadopago_point_enabled: boolean;
  mercadopago_active_for_pos_only: boolean;
  mfa_totp_enabled: boolean;
  mfa_required_for_admins: boolean;
  mfa_required_for_staff: boolean;
  mfa_required_for_distributors: boolean;
  mfa_required_for_public: boolean;
}

export interface Banner {
  id: number;
  tenant_id: number;
  storefront_config_id?: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  target_type: string;
  target_value?: string;
  position: "hero" | "store_top" | "distributors_top" | "checkout_upsell" | string;
  priority: number;
  starts_at?: string;
  ends_at?: string;
  is_active: boolean;
}

export interface Coupon {
  id: number;
  tenant_id: number;
  code: string;
  description?: string;
  discount_type: "fixed" | "percentage" | string;
  discount_value: number;
  min_order_amount?: number;
  max_uses?: number;
  used_count: number;
  starts_at?: string;
  ends_at?: string;
  applies_to: "public" | "distributor" | "all" | string;
  is_active: boolean;
}

export interface MembershipPlan {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  duration_days: number;
  price: number;
  points_multiplier: number;
  benefits_json?: string;
  is_active: boolean;
}

export interface Appointment {
  id: number;
  tenant_id: number;
  customer_id?: number | null;
  service_offering_id?: number | null;
  scheduled_for?: string | null;
  status: string;
  is_gift: boolean;
  gift_sender_name?: string | null;
  gift_sender_email?: string | null;
  gift_is_anonymous: boolean;
  gift_message?: string | null;
  gift_recipient_name?: string | null;
  gift_recipient_email?: string | null;
  gift_recipient_phone?: string | null;
  instructions_sent_at?: string | null;
  confirmation_received_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributorApplication {
  id: number;
  tenant_id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  country?: string;
  status: string;
  requested_by_user_id?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributorProfile {
  id: number;
  tenant_id: number;
  customer_id?: number | null;
  distributor_application_id?: number | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  is_authorized: boolean;
  authorization_date?: string | null;
  can_purchase_wholesale: boolean;
  can_sell_as_franchise: boolean;
  warehouse_address?: string | null;
  delivery_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributorEmployee {
  id: number;
  tenant_id: number;
  distributor_profile_id: number;
  full_name: string;
  email: string;
  phone?: string;
  role_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: number;
  tenant_id?: number | null;
  contract_type: string;
  name: string;
  content_markdown: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignedContract {
  id: number;
  tenant_id: number;
  contract_template_id: number;
  distributor_profile_id?: number | null;
  signed_by_name: string;
  signed_by_email: string;
  signed_at: string;
  signature_text: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringOrderSchedule {
  id: number;
  tenant_id: number;
  customer_id?: number | null;
  distributor_profile_id?: number | null;
  frequency: "weekly" | "biweekly" | "monthly" | string;
  next_run_at: string;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsOrder {
  id: number;
  tenant_id: number;
  order_id?: number | null;
  recurring_order_schedule_id?: number | null;
  customer_id?: number | null;
  distributor_profile_id?: number | null;
  delivery_type: "public" | "distributor" | "internal_pickup" | "franchise" | string;
  status: "pending" | "scheduled" | "in_transit" | "delivered" | "failed" | "rescheduled" | string;
  warehouse_address?: string | null;
  delivery_address: string;
  scheduled_delivery_at?: string | null;
  delivered_at?: string | null;
  tracking_reference?: string | null;
  courier_name?: string | null;
  delivery_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsEvent {
  id: number;
  logistics_order_id: number;
  event_type: string;
  event_at: string;
  notes?: string | null;
  created_at: string;
}

export interface LogisticsAdditionalService {
  id: number;
  tenant_id: number;
  service_type: "recoleccion" | "entrega" | "ambos" | "resguardo" | string;
  origin: string;
  destination: string;
  kilometers: number;
  unit_cost: number;
  subtotal: number;
  iva: number;
  total: number;
  currency: string;
  observations?: string | null;
  status: string;
  service_date: string;
  billing_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  id: number;
  tenant_id: number;
  name: string;
  is_active: boolean;
  points_enabled: boolean;
  points_conversion_rate: number;
  welcome_points: number;
  birthday_points?: number;
}

export interface ProductReview {
  id: number;
  tenant_id: number;
  product_id: number;
  customer_id?: number;
  rating: number;
  title?: string;
  comment?: string;
  moderation_status: "pending" | "approved" | "rejected" | string;
  is_approved: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  tenant_id: number;
  customer_id: number;
  product_id: number;
  created_at: string;
}

export interface StorefrontPayload {
  tenant: Tenant;
  branding?: TenantBranding;
  storefront_config?: StorefrontConfig;
  categories: Category[];
  featured_products: Product[];
  recent_products: Product[];
  banners?: Banner[];
  coupons?: Coupon[];
  average_rating?: number;
}

export interface StorefrontHomePayload extends StorefrontPayload {
  promo_products: Product[];
  best_sellers: Product[];
  membership_plans: MembershipPlan[];
  services: ServiceOffering[];
}

export interface CheckoutSessionRequest {
  tenant_id: number;
  items: Array<{ product_id?: number; service_offering_id?: number; quantity: number }>;
  success_url: string;
  cancel_url: string;
  coupon_code?: string;
  use_loyalty_points?: boolean;
  customer_id?: number;
  applies_to?: string;
  is_gift?: boolean;
  gift_sender_name?: string;
  gift_sender_email?: string;
  gift_is_anonymous?: boolean;
  gift_message?: string;
  gift_recipient_name?: string;
  gift_recipient_email?: string;
  gift_recipient_phone?: string;
  appointment_scheduled_for?: string;
}

export interface CheckoutSessionResponse {
  order_id: number;
  session_id: string;
  session_url: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  payment_mode: "plan1" | "plan2" | string;
  plan_type: "commission" | "subscription" | string;
}

export interface TenantCommissionTier {
  up_to?: string | null;
  rate: string;
  label: string;
}

export interface TenantCommissionRules {
  tiers: TenantCommissionTier[];
  minimum_per_operation?: string | null;
}

export interface TenantSubscriptionPlan {
  cycle: "monthly" | "yearly" | string;
  price: string;
  benefits: string[];
}

export interface TenantConfig {
  tenant_id: number;
  tenant_slug: string;
  tenant_name: string;
  business_type: string;
  plan_type: "commission" | "subscription" | string;
  commission_rules: TenantCommissionRules;
  subscription_plan: TenantSubscriptionPlan;
  billing_model: "fixed_subscription" | "commission_based" | string;
  commission_percentage: string;
  commission_enabled: boolean;
  commission_scope: string;
  commission_notes?: string | null;
  commercial_plan_key?: string | null;
  commercial_plan_status?: string | null;
  limits: Record<string, unknown>;
  ai_tokens_balance: number;
  ai_tokens_locked: boolean;
  checkout_badge: string;
  landing_variant: {
    headline: string;
    subtitle: string;
    cta: string;
  };
}

export interface Order {
  id: number;
  tenant_id: number;
  customer_id: number | null;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | string;
  payment_mode: "plan1" | "plan2" | string;
  coupon_code?: string;
  loyalty_points_used: number;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export interface PaymentsDashboard {
  orders: Order[];
  total_sold: number;
  total_commission: number;
  total_net: number;
}

export interface StorefrontDistributorsPayload {
  tenant: Tenant;
  distributors: Array<{
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
    is_active: boolean;
  }>;
  banners?: Banner[];
}

export interface ReinpiaGlobalKpis {
  total_tenants: number;
  tenants_active: number;
  tenants_inactive: number;
  total_revenue: number;
  total_commissions: number;
  total_net_amount: number;
  total_paid_orders: number;
  total_failed_orders: number;
  average_order_value: number;
  total_distributor_applications: number;
  total_approved_distributors: number;
  total_active_subscriptions: number;
  total_appointments: number;
  total_logistics_orders: number;
  delivered_logistics_orders: number;
  total_commission_agents: number;
  total_commission_sales: number;
  total_direct_sales: number;
  total_plan_purchase_leads: number;
  total_leads_requiring_followup: number;
  total_leads_requesting_appointment: number;
  total_accountant_notices_pending: number;
  tenants_with_paid_commercial_plan?: number;
  tenants_with_locked_ai_tokens?: number;
}

export interface ReinpiaKpisResponse {
  kpis: ReinpiaGlobalKpis;
  active_vs_inactive: { active: number; inactive: number };
  plan_distribution: Array<{ plan_code: string; plan_name: string; count: number }>;
  business_type_distribution: Array<{ business_type: string; count: number }>;
}

export interface ReinpiaTimeseriesPoint {
  day: string;
  revenue: number;
  commissions: number;
  orders: number;
  paid_orders: number;
  failed_orders: number;
}

export interface ReinpiaTenantSummaryRow {
  tenant_id: number;
  tenant_name: string;
  slug: string;
  is_active: boolean;
  plan_id?: number | null;
  business_type: string;
  revenue: number;
  commissions: number;
  net_amount: number;
  paid_orders: number;
  billing_model?: "fixed_subscription" | "commission_based" | string;
  commission_enabled?: boolean;
  commission_percentage?: number;
  commission_scope?: string;
  sales_subject_to_commission?: number;
  estimated_commission_amount?: number;
  commercial_plan_key?: string | null;
  commercial_plan_status?: string;
  ai_tokens_included?: number;
  ai_tokens_balance?: number;
  ai_tokens_used?: number;
  ai_tokens_locked?: boolean;
}

export interface ReinpiaTenantKpis {
  tenant_id: number;
  revenue: number;
  commissions: number;
  net_amount: number;
  paid_orders: number;
  failed_orders: number;
  active_subscription_status: boolean;
  distributors_approved: number;
  appointments_count: number;
  logistics_delivered_count: number;
  billing_model?: "fixed_subscription" | "commission_based" | string;
  commission_enabled?: boolean;
  commission_percentage?: number;
  commission_scope?: string;
  sales_subject_to_commission?: number;
  estimated_commission_amount?: number;
  commercial_plan_key?: string | null;
  commercial_plan_status?: string;
  ai_tokens_included?: number;
  ai_tokens_balance?: number;
  ai_tokens_used?: number;
  ai_tokens_locked?: boolean;
}

export interface CommercialPlan {
  id: string;
  code: string;
  display_name: string;
  name: string;
  tier: string;
  billing_model: string;
  commission_enabled: boolean;
  commission_percentage: string;
  monthly_price_mxn: string;
  total_price_mxn: string;
  stripe_price_id: string;
  support: string;
  limits: Record<string, unknown>;
  price_without_tax_mxn: string;
  tax_rate: string;
  tax_amount_mxn: string;
  price_with_tax_mxn: string;
}

export interface CommercialAddon {
  id: string;
  code: string;
  display_name: string;
  name: string;
  billing_model: string;
  commission_enabled: boolean;
  commission_percentage: string;
  monthly_price_mxn: string;
  total_price_mxn: string;
  stripe_price_id: string;
  price_without_tax_mxn: string;
  tax_rate: string;
  tax_amount_mxn: string;
  price_with_tax_mxn: string;
}

export interface CommercialPlanCatalog {
  iva_rate: string;
  plans: CommercialPlan[];
  addons: CommercialAddon[];
}

export interface TenantCommercialStatus {
  tenant_id: number;
  commercial_plan_key?: string | null;
  commercial_plan_status: string;
  commercial_plan_source?: string | null;
  billing_model: string;
  commission_enabled: boolean;
  commission_percentage: string;
  limits: Record<string, unknown>;
  ai_tokens_included: number;
  ai_tokens_balance: number;
  ai_tokens_used: number;
  ai_tokens_locked: boolean;
  ai_tokens_lock_reason?: string | null;
  plan_display_name?: string | null;
  support?: string | null;
  plan_activated_at?: string | null;
}

export interface TenantAddonUsage {
  addon_id: string;
  addon_name: string;
  quantity: number;
}

export interface TenantCommercialUsage {
  tenant_id: number;
  brands_used: number;
  brands_limit: number;
  users_used: number;
  users_limit: number;
  ai_agents_used: number;
  ai_agents_limit: number;
  products_used: number;
  products_limit: number;
  branches_used: number;
  branches_limit: number;
  branches_active: number;
  branches_inactive: number;
  ai_tokens_included: number;
  ai_tokens_used: number;
  ai_tokens_balance: number;
  ai_tokens_extra: number;
  ai_tokens_assigned: number;
  ai_tokens_reserved: number;
  ai_tokens_remaining: number;
  ai_tokens_consumption_percentage: number;
  ai_key_state: "abierta" | "advertencia" | "bloqueada" | "override_admin" | string;
  ai_override_active: boolean;
  ai_override_reason?: string | null;
  addons: TenantAddonUsage[];
}

export interface AiCreditMovement {
  id: number;
  tenant_id: number;
  commercial_client_account_id?: number | null;
  source: string;
  action: string;
  tokens_delta: number;
  balance_after: number;
  notes?: string | null;
  created_by_user_id?: number | null;
  created_at: string;
}

export interface CommercialClientAccount {
  id: number;
  legal_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  billing_model: string;
  commercial_plan_key?: string | null;
  commercial_limits_json: string;
  addons_json: string;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialAccountUsage {
  account_id: number;
  brands_used: number;
  brands_limit: number;
  users_used: number;
  users_limit: number;
  products_used: number;
  products_limit: number;
  branches_used: number;
  branches_limit: number;
  ai_tokens_included: number;
  ai_tokens_used: number;
  ai_tokens_balance: number;
  ai_tokens_extra: number;
  ai_tokens_reserved: number;
  ai_tokens_remaining: number;
  brands_warning: number;
  brands_blocked: number;
  brands_override: number;
}

export interface BrandAiCredit {
  tenant_id: number;
  tenant_name: string;
  assigned_tokens: number;
  reserved_tokens: number;
  consumed_tokens: number;
  remaining_tokens: number;
  percentage_consumed: number;
  key_state: "abierta" | "advertencia" | "bloqueada" | "override_admin" | string;
  override_active: boolean;
  override_reason?: string | null;
  included_by_plan: number;
  extra_assigned: number;
}

export interface CommercialAccountAiCredits {
  account_id: number;
  total_tokens_included: number;
  total_tokens_extra: number;
  total_tokens_capacity: number;
  total_tokens_assigned: number;
  total_tokens_consumed: number;
  total_tokens_reserved: number;
  total_tokens_remaining: number;
  brands_warning: number;
  brands_blocked: number;
  brands_override: number;
  brands: BrandAiCredit[];
}

export interface CommercialPlanRequest {
  id: number;
  tenant_id: number;
  commercial_client_account_id?: number | null;
  request_type: string;
  addon_id?: string | null;
  target_plan_key?: string | null;
  status: string;
  notes?: string | null;
  requested_by_user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReinpiaSubscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  status: string;
  started_at: string;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReinpiaSummaryByStatus {
  total: number;
  by_status: Array<{ status: string; count: number }>;
}

export interface ReinpiaDistributorsSummary {
  total_applications: number;
  approved_profiles: number;
}

export interface SalesCommissionAgent {
  id: number;
  code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  commission_percentage: number;
  valid_from?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesReferral {
  id: number;
  commission_agent_id?: number | null;
  tenant_id?: number | null;
  lead_email?: string | null;
  lead_name?: string | null;
  lead_phone?: string | null;
  source_type: string;
  referral_code_entered?: string | null;
  plan_code?: string | null;
  needs_followup: boolean;
  needs_appointment: boolean;
  requested_contact: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlanPurchaseLead {
  id: number;
  company_name: string;
  legal_type: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  selected_plan_code: string;
  commission_agent_id?: number | null;
  referral_code?: string | null;
  is_commissioned_sale: boolean;
  needs_followup: boolean;
  needs_appointment: boolean;
  purchase_status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerContactLead {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  contact_reason: string;
  message: string;
  channel: string;
  recommended_plan?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingProspectInternalSection {
  title: string;
  body: string;
}

export interface MarketingProspectStatusEvent {
  status: string;
  changed_at: string;
  note?: string | null;
}

export interface MarketingProspect {
  id: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  company_brand: string;
  location?: string | null;
  industry?: string | null;
  sells: string;
  main_goal: string;
  desired_conversion_channel: string;
  active_social_networks?: string | null;
  products_to_promote: number;
  average_ticket_mxn: number;
  offer_clarity?: string | null;
  urgency: string;
  followup_level: string;
  has_landing: boolean;
  has_ecommerce: boolean;
  needs_extra_landing: boolean;
  needs_extra_ecommerce: boolean;
  needs_commercial_tracking: boolean;
  wants_custom_proposal: boolean;
  client_notes?: string | null;
  status: string;
  status_history: MarketingProspectStatusEvent[];
  internal_notes?: string | null;
  contacted_at?: string | null;
  responsible_user_id?: number | null;
  channel: string;
  internal_summary: string;
  internal_sections: MarketingProspectInternalSection[];
  suggested_price_min_mxn: number;
  suggested_price_max_mxn: number;
  suggested_price_mxn: number;
  recommended_services: string[];
  risks: string[];
  created_at: string;
  updated_at: string;
}

export interface InternalAlert {
  id: number;
  alert_type: string;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
  tenant_id?: number | null;
  commission_agent_id?: number | null;
  title: string;
  message: string;
  severity: "info" | "warning" | "high" | string;
  is_read: boolean;
  created_at: string;
}

export interface OnboardingStep {
  id: number;
  guide_id: number;
  step_order: number;
  title: string;
  content: string;
  cta_label?: string | null;
  cta_path?: string | null;
  is_required: boolean;
}

export interface OnboardingGuide {
  id: number;
  code: string;
  title: string;
  audience: string;
  description?: string | null;
  is_active: boolean;
  steps: OnboardingStep[];
}

export interface OnboardingProgressRow {
  id: number;
  user_id: number;
  guide_id: number;
  step_id: number;
  completed: boolean;
  completed_at?: string | null;
}

export interface OnboardingProgressResponse {
  progress: OnboardingProgressRow[];
  total_steps: number;
  completed_steps: number;
}

export interface CurrencySettings {
  id: number;
  tenant_id: number;
  base_currency: string;
  enabled_currencies: string[];
  display_mode: string;
  exchange_mode: string;
  auto_update_enabled: boolean;
  rounding_mode: string;
}

export interface PlatformSettings {
  id: number;
  global_base_currency: string;
  global_enabled_currencies: string[];
  global_exchange_mode: string;
  global_auto_update_enabled: boolean;
  platform_default_language: string;
  platform_enabled_languages: string[];
  created_at: string;
  updated_at: string;
}

export interface BrandAdminSettings {
  tenant_id: number;
  currency_inherit_global: boolean;
  currency_base_currency: string;
  currency_visible_currencies: string[];
  language_primary: string;
  language_visible: string[];
  market_profile: string;
  country_code: string;
  countries_enabled: string[];
  country_channels: Array<{
    country_code: string;
    currency: string;
    language: string;
    landing_enabled: boolean;
    ecommerce_enabled: boolean;
    webapp_enabled: boolean;
  }>;
  expansion_enabled: boolean;
  cross_border_enabled: boolean;
  addon_logistics_status: "deshabilitado" | "configurando" | "activo" | "suspendido" | string;
  addon_logistics_plan?: string | null;
  addon_logistics_scope_branch_ids: number[];
  addon_workday_status: "deshabilitado" | "configurando" | "activo" | "suspendido" | string;
  addon_workday_plan?: string | null;
  addon_workday_scope_branch_ids: number[];
  addon_nfc_status: "deshabilitado" | "configurando" | "activo" | "suspendido" | string;
  addon_nfc_plan?: string | null;
  addon_nfc_scope_branch_ids: number[];
  feature_logistics_enabled: boolean;
  feature_workday_enabled: boolean;
  feature_nfc_operations_enabled: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  tenant_id: number | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface BrandDiagnosticFinding {
  status: string;
  criterion: string;
  detail: string;
}

export interface BrandDiagnosticScores {
  seo: number;
  aeo: number;
  branding: number;
  global: number;
}

export interface BrandDiagnosticFindings {
  seo: BrandDiagnosticFinding[];
  aeo: BrandDiagnosticFinding[];
  branding: BrandDiagnosticFinding[];
}

export interface BrandDiagnosticRecommendations {
  high_priority: string[];
  medium_priority: string[];
  low_priority: string[];
}

export interface BrandDiagnostic {
  id: number;
  tenant_id: number;
  brand_name: string;
  analysis_type: "internal_brand" | "external_url" | string;
  source_url?: string | null;
  analyzed_at: string;
  status: string;
  scores: BrandDiagnosticScores;
  findings: BrandDiagnosticFindings;
  recommendations: BrandDiagnosticRecommendations;
  summary: string;
  next_actions: string[];
  missing_data: string[];
  raw_context: Record<string, unknown>;
  improvement_plan?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BrandDiagnosticSummary {
  id: number;
  tenant_id: number;
  brand_name: string;
  analysis_type?: "internal_brand" | "external_url" | string;
  source_url?: string | null;
  analyzed_at: string;
  status: string;
  global_score: number;
}

export interface ExchangeRate {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  source_name: string;
  is_manual: boolean;
  valid_at: string;
  created_at: string;
}

export interface PosLocation {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  location_type: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosEmployee {
  id: number;
  tenant_id: number;
  pos_location_id: number;
  distributor_profile_id?: number | null;
  full_name: string;
  email: string;
  phone?: string | null;
  role_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosSale {
  id: number;
  tenant_id: number;
  pos_location_id: number;
  customer_id?: number | null;
  employee_id?: number | null;
  subtotal_amount: number;
  discount_amount: number;
  commission_amount: number;
  net_amount: number;
  total_amount: number;
  payment_mode: string;
  currency: string;
  payment_method: string;
  notes?: string | null;
  created_at: string;
}

export interface PosPaymentTransaction {
  id: number;
  tenant_id: number;
  pos_sale_id?: number | null;
  pos_location_id?: number | null;
  customer_id?: number | null;
  employee_id?: number | null;
  payment_provider: string;
  payment_method: string;
  status: string;
  external_reference: string;
  amount: number;
  currency: string;
  payment_url?: string | null;
  qr_payload?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PosCustomer {
  id: number;
  tenant_id: number;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  loyalty_points: number;
}

export interface BotChannelConfig {
  id: number;
  tenant_id?: number | null;
  channel: string;
  is_enabled: boolean;
  provider_name?: string | null;
  config_json?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BotMessageTemplate {
  id: number;
  tenant_id?: number | null;
  event_type: string;
  channel: string;
  template_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationEventLog {
  id: number;
  tenant_id?: number | null;
  event_type: string;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
  payload_json?: string | null;
  created_at: string;
}

export interface SecurityEvent {
  id: number;
  tenant_id?: number | null;
  user_id?: number | null;
  event_type: string;
  source_ip?: string | null;
  user_agent?: string | null;
  severity: "low" | "medium" | "high" | "critical" | string;
  status: "new" | "reviewed" | "blocked" | "ignored" | string;
  event_payload_json?: string | null;
  created_at: string;
}

export interface SecurityAlert {
  id: number;
  tenant_id?: number | null;
  security_event_id?: number | null;
  alert_type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  is_read: boolean;
  assigned_to?: string | null;
  created_at: string;
}

export interface SecurityRule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  rule_type: string;
  threshold_count?: number | null;
  threshold_window_minutes?: number | null;
  action_type: string;
  is_active: boolean;
  severity: "low" | "medium" | "high" | "critical" | string;
  created_at: string;
  updated_at: string;
}

export interface BlockedEntity {
  id: number;
  entity_type: string;
  entity_key: string;
  reason: string;
  blocked_until?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SecurityKpis {
  total_events: number;
  critical_events: number;
  high_events: number;
  medium_events: number;
  low_events: number;
  new_alerts: number;
  unread_alerts: number;
  blocked_entities: number;
  top_event_types: Array<{ event_type: string; count: number }>;
}

export interface TenantReportUsers {
  total_public_users: number;
  total_distributor_users: number;
  total_distributor_profiles: number;
  total_authorized_distributors: number;
  new_registrations: number;
}

export interface TenantReportSales {
  total_sales: number;
  paid_orders: number;
  failed_orders: number;
  average_ticket: number;
  recurring_sales: number;
  timeseries: Array<{ bucket: string; revenue: number; orders: number }>;
  payment_channels?: {
    stripe_ecommerce: { orders: number; amount: number };
    pos_total: { sales: number; amount: number };
    pos_by_method: Array<{ payment_method: string; sales: number; amount: number }>;
  };
}

export interface TenantReportOverview {
  users: TenantReportUsers;
  sales: TenantReportSales;
  memberships: Record<string, number>;
  loyalty: Record<string, number>;
  top_products: Array<{ product_id: number; name: string; units: number; revenue: number }>;
  logistics: Record<string, number>;
}

export interface MarketingInsightItem {
  id: number;
  tenant_id: number;
  insight_type: string;
  category?: string | null;
  product_id?: number | null;
  message: string;
  recommendation: string;
  period_label: string;
  created_at: string;
}
