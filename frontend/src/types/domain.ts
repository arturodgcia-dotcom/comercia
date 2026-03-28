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
}

export interface CheckoutSessionRequest {
  tenant_id: number;
  items: Array<{ product_id: number; quantity: number }>;
  success_url: string;
  cancel_url: string;
  coupon_code?: string;
  use_loyalty_points?: boolean;
  customer_id?: number;
  applies_to?: string;
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
