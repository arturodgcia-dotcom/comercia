export interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  business_type: "products" | "services" | "mixed" | string;
  is_active: boolean;
  plan_id?: number | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "reinpia_admin" | "tenant_admin" | "tenant_staff" | "distributor_user" | string;
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
  total_amount: number;
  currency: string;
  payment_method: string;
  notes?: string | null;
  created_at: string;
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
