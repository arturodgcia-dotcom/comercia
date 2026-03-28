export interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  business_type: "products" | "services" | "mixed" | string;
  is_active: boolean;
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
  notes?: string;
}

export interface StripeConfig {
  id: number;
  tenant_id: number;
  publishable_key: string;
  secret_key: string;
  webhook_secret?: string;
  is_reinpia_managed: boolean;
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
  storefront_config_id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  position: number;
  is_active: boolean;
}

export interface StorefrontPayload {
  tenant: Tenant;
  branding?: TenantBranding;
  storefront_config?: StorefrontConfig;
  categories: Category[];
  featured_products: Product[];
  recent_products: Product[];
}

export interface CheckoutSessionRequest {
  tenant_id: number;
  items: Array<{ product_id: number; quantity: number }>;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSessionResponse {
  order_id: number;
  session_id: string;
  session_url: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  payment_mode: "plan1" | "plan2" | string;
}

export interface Order {
  id: number;
  tenant_id: number;
  customer_id: number | null;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | string;
  payment_mode: "plan1" | "plan2" | string;
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
}
