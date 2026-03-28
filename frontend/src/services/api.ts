import {
  Banner,
  Category,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  Coupon,
  LoginResponse,
  LoyaltyProgram,
  MembershipPlan,
  PaymentsDashboard,
  Plan,
  Product,
  ProductReview,
  StorefrontDistributorsPayload,
  StorefrontHomePayload,
  StorefrontPayload,
  Tenant,
  TenantBranding,
  User,
  WishlistItem
} from "../types/domain";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || response.statusText, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: (token: string) => request<User>("/api/v1/auth/me", {}, token),

  getTenants: (token: string) => request<Tenant[]>("/api/v1/tenants", {}, token),
  createTenant: (
    token: string,
    payload: { name: string; slug: string; subdomain: string; business_type: string; is_active: boolean }
  ) => request<Tenant>("/api/v1/tenants", { method: "POST", body: JSON.stringify(payload) }, token),
  getTenantById: (token: string, tenantId: number) => request<Tenant>(`/api/v1/tenants/${tenantId}`, {}, token),
  updateTenant: (token: string, tenantId: number, payload: Partial<Tenant>) =>
    request<Tenant>(`/api/v1/tenants/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getTenantBranding: (token: string, tenantId: number) => request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, {}, token),
  upsertTenantBranding: (token: string, tenantId: number, payload: Partial<TenantBranding>) =>
    request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getPlans: (token: string) => request<Plan[]>("/api/v1/plans", {}, token),
  getCategoriesByTenant: (token: string, tenantId: number) => request<Category[]>(`/api/v1/categories/by-tenant/${tenantId}`, {}, token),
  createCategory: (
    token: string,
    payload: { tenant_id: number; name: string; slug: string; description?: string; is_active?: boolean }
  ) => request<Category>("/api/v1/categories", { method: "POST", body: JSON.stringify(payload) }, token),
  updateCategory: (token: string, categoryId: number, payload: Partial<Category>) =>
    request<Category>(`/api/v1/categories/${categoryId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getProductsByTenant: (token: string, tenantId: number) => request<Product[]>(`/api/v1/products/by-tenant/${tenantId}`, {}, token),
  createProduct: (token: string, payload: Record<string, unknown>) =>
    request<Product>("/api/v1/products", { method: "POST", body: JSON.stringify(payload) }, token),
  updateProduct: (token: string, productId: number, payload: Partial<Product>) =>
    request<Product>(`/api/v1/products/${productId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getLoyaltyProgram: (token: string, tenantId: number) => request<LoyaltyProgram>(`/api/v1/loyalty/program/${tenantId}`, {}, token),
  upsertLoyaltyProgram: (token: string, tenantId: number, payload: Partial<LoyaltyProgram>) =>
    request<LoyaltyProgram>(`/api/v1/loyalty/program/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getMembershipPlans: (token: string, tenantId: number) =>
    request<MembershipPlan[]>(`/api/v1/memberships/by-tenant/${tenantId}`, {}, token),
  createMembershipPlan: (token: string, payload: Record<string, unknown>) =>
    request<MembershipPlan>("/api/v1/memberships", { method: "POST", body: JSON.stringify(payload) }, token),
  updateMembershipPlan: (token: string, id: number, payload: Record<string, unknown>) =>
    request<MembershipPlan>(`/api/v1/memberships/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getCoupons: (token: string, tenantId: number) => request<Coupon[]>(`/api/v1/coupons/by-tenant/${tenantId}`, {}, token),
  createCoupon: (token: string, payload: Record<string, unknown>) =>
    request<Coupon>("/api/v1/coupons", { method: "POST", body: JSON.stringify(payload) }, token),
  updateCoupon: (token: string, id: number, payload: Record<string, unknown>) =>
    request<Coupon>(`/api/v1/coupons/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  validateCoupon: (payload: Record<string, unknown>) =>
    request<{ valid: boolean; coupon_id: number; discount_amount: number }>("/api/v1/coupons/validate", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  getBanners: (token: string, tenantId: number) => request<Banner[]>(`/api/v1/banners/by-tenant/${tenantId}`, {}, token),
  createBanner: (token: string, payload: Record<string, unknown>) =>
    request<Banner>("/api/v1/banners", { method: "POST", body: JSON.stringify(payload) }, token),
  updateBanner: (token: string, id: number, payload: Record<string, unknown>) =>
    request<Banner>(`/api/v1/banners/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getProductReviews: (productId: number, includeUnapproved = false) =>
    request<ProductReview[]>(`/api/v1/reviews/product/${productId}?include_unapproved=${includeUnapproved ? "true" : "false"}`),
  createProductReview: (payload: Record<string, unknown>) =>
    request<ProductReview>("/api/v1/reviews", { method: "POST", body: JSON.stringify(payload) }),
  approveProductReview: (token: string, id: number) =>
    request<ProductReview>(`/api/v1/reviews/${id}/approve`, { method: "PUT" }, token),

  getWishlist: (tenantId: number, customerId: number) => request<WishlistItem[]>(`/api/v1/wishlist/${tenantId}/${customerId}`),
  addWishlistItem: (payload: Record<string, unknown>) =>
    request<WishlistItem>("/api/v1/wishlist", { method: "POST", body: JSON.stringify(payload) }),
  removeWishlistItem: (id: number) => request<{ deleted: boolean }>(`/api/v1/wishlist/${id}`, { method: "DELETE" }),

  getStorefront: (tenantSlug: string) => request<StorefrontPayload>(`/api/v1/storefront/${tenantSlug}`),
  getStorefrontHomeData: (tenantSlug: string) => request<StorefrontHomePayload>(`/api/v1/storefront/${tenantSlug}/home-data`),
  getStorefrontDistributors: (tenantSlug: string) =>
    request<StorefrontDistributorsPayload>(`/api/v1/storefront/${tenantSlug}/distribuidores`),
  getCheckoutUpsell: (tenantSlug: string, cartProductIds: number[]) =>
    request<{ upsell_products: Product[] }>(
      `/api/v1/storefront/${tenantSlug}/checkout-upsell?cart_product_ids=${cartProductIds.join(",")}`
    ),

  createCheckoutSession: (payload: CheckoutSessionRequest) =>
    request<CheckoutSessionResponse>("/api/v1/checkout/create-session", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getPaymentsDashboard: (token: string, tenantId?: number) =>
    request<PaymentsDashboard>(`/api/v1/payments/dashboard${tenantId ? `?tenant_id=${tenantId}` : ""}`, {}, token)
};

export { ApiError };
