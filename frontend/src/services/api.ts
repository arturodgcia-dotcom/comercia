import {
  Category,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  LoginResponse,
  PaymentsDashboard,
  Plan,
  Product,
  StorefrontDistributorsPayload,
  StorefrontPayload,
  Tenant,
  TenantBranding,
  User
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
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || response.statusText, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
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
  ) =>
    request<Tenant>("/api/v1/tenants", { method: "POST", body: JSON.stringify(payload) }, token),
  getTenantById: (token: string, tenantId: number) => request<Tenant>(`/api/v1/tenants/${tenantId}`, {}, token),
  updateTenant: (token: string, tenantId: number, payload: Partial<Tenant>) =>
    request<Tenant>(`/api/v1/tenants/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getTenantBranding: (token: string, tenantId: number) =>
    request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, {}, token),
  upsertTenantBranding: (token: string, tenantId: number, payload: Partial<TenantBranding>) =>
    request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getPlans: (token: string) => request<Plan[]>("/api/v1/plans", {}, token),
  getCategoriesByTenant: (token: string, tenantId: number) =>
    request<Category[]>(`/api/v1/categories/by-tenant/${tenantId}`, {}, token),
  createCategory: (
    token: string,
    payload: { tenant_id: number; name: string; slug: string; description?: string; is_active?: boolean }
  ) => request<Category>("/api/v1/categories", { method: "POST", body: JSON.stringify(payload) }, token),
  updateCategory: (token: string, categoryId: number, payload: Partial<Category>) =>
    request<Category>(`/api/v1/categories/${categoryId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getProductsByTenant: (token: string, tenantId: number) =>
    request<Product[]>(`/api/v1/products/by-tenant/${tenantId}`, {}, token),
  createProduct: (
    token: string,
    payload: {
      tenant_id: number;
      category_id?: number | null;
      name: string;
      slug: string;
      description?: string;
      price_public: number;
      price_wholesale?: number;
      price_retail?: number;
      is_featured?: boolean;
      is_active?: boolean;
    }
  ) => request<Product>("/api/v1/products", { method: "POST", body: JSON.stringify(payload) }, token),
  updateProduct: (token: string, productId: number, payload: Partial<Product>) =>
    request<Product>(`/api/v1/products/${productId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getStorefront: (tenantSlug: string) => request<StorefrontPayload>(`/api/v1/storefront/${tenantSlug}`),
  getStorefrontDistributors: (tenantSlug: string) =>
    request<StorefrontDistributorsPayload>(`/api/v1/storefront/${tenantSlug}/distribuidores`),
  createCheckoutSession: (payload: CheckoutSessionRequest) =>
    request<CheckoutSessionResponse>("/api/v1/checkout/create-session", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getPaymentsDashboard: (token: string, tenantId?: number) =>
    request<PaymentsDashboard>(`/api/v1/payments/dashboard${tenantId ? `?tenant_id=${tenantId}` : ""}`, {}, token)
};

export { ApiError };
