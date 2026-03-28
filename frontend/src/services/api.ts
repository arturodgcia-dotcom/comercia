import {
  Appointment,
  Banner,
  Category,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  ContractTemplate,
  Coupon,
  DistributorApplication,
  DistributorEmployee,
  DistributorProfile,
  InternalAlert,
  LogisticsEvent,
  LogisticsOrder,
  LoginResponse,
  LoyaltyProgram,
  MembershipPlan,
  PlanPurchaseLead,
  Order,
  PaymentsDashboard,
  Plan,
  Product,
  ProductReview,
  SalesCommissionAgent,
  SalesReferral,
  ReinpiaDistributorsSummary,
  ReinpiaKpisResponse,
  ReinpiaSubscription,
  ReinpiaSummaryByStatus,
  ReinpiaTenantKpis,
  ReinpiaTenantSummaryRow,
  ReinpiaTimeseriesPoint,
  RecurringOrderSchedule,
  ServiceOffering,
  SignedContract,
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
  getServicesByTenant: (token: string, tenantId: number) =>
    request<ServiceOffering[]>(`/api/v1/services/by-tenant/${tenantId}`, {}, token),
  createService: (token: string, payload: Record<string, unknown>) =>
    request<ServiceOffering>("/api/v1/services", { method: "POST", body: JSON.stringify(payload) }, token),
  updateService: (token: string, serviceId: number, payload: Record<string, unknown>) =>
    request<ServiceOffering>(`/api/v1/services/${serviceId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

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
  getStorefrontServices: (tenantSlug: string) =>
    request<{ tenant: Tenant; services: ServiceOffering[] }>(`/api/v1/storefront/${tenantSlug}/services`),
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
    request<PaymentsDashboard>(`/api/v1/payments/dashboard${tenantId ? `?tenant_id=${tenantId}` : ""}`, {}, token),

  createAppointmentSelf: (token: string, payload: Record<string, unknown>) =>
    request<Appointment>("/api/v1/appointments/self", { method: "POST", body: JSON.stringify(payload) }, token),
  createAppointmentGift: (token: string, payload: Record<string, unknown>) =>
    request<Appointment>("/api/v1/appointments/gift", { method: "POST", body: JSON.stringify(payload) }, token),
  getAppointmentsByTenant: (token: string, tenantId: number) =>
    request<Appointment[]>(`/api/v1/appointments/by-tenant/${tenantId}`, {}, token),
  confirmAppointmentReceived: (token: string, appointmentId: number) =>
    request<Appointment>(`/api/v1/appointments/${appointmentId}/confirm-received`, { method: "PUT" }, token),
  updateAppointmentStatus: (token: string, appointmentId: number, payload: { status: string }) =>
    request<Appointment>(`/api/v1/appointments/${appointmentId}/status`, { method: "PUT", body: JSON.stringify(payload) }, token),

  createDistributorApplication: (payload: Record<string, unknown>) =>
    request<DistributorApplication>("/api/v1/distributors/applications", { method: "POST", body: JSON.stringify(payload) }),
  getDistributorApplicationsByTenant: (token: string, tenantId: number) =>
    request<DistributorApplication[]>(`/api/v1/distributors/applications/by-tenant/${tenantId}`, {}, token),
  approveDistributorApplication: (token: string, id: number, notes?: string) =>
    request<DistributorProfile>(`/api/v1/distributors/applications/${id}/approve`, { method: "PUT", body: JSON.stringify({ notes }) }, token),
  rejectDistributorApplication: (token: string, id: number, notes?: string) =>
    request<DistributorApplication>(
      `/api/v1/distributors/applications/${id}/reject`,
      { method: "PUT", body: JSON.stringify({ notes }) },
      token
    ),
  getDistributorsByTenant: (token: string, tenantId: number) =>
    request<DistributorProfile[]>(`/api/v1/distributors/by-tenant/${tenantId}`, {}, token),
  createDistributorEmployee: (token: string, payload: Record<string, unknown>) =>
    request<DistributorEmployee>("/api/v1/distributors/employees", { method: "POST", body: JSON.stringify(payload) }, token),
  getDistributorEmployees: (token: string, distributorProfileId: number) =>
    request<DistributorEmployee[]>(`/api/v1/distributors/employees/${distributorProfileId}`, {}, token),

  getContractTemplates: (token: string, tenantId: number) =>
    request<ContractTemplate[]>(`/api/v1/contracts/templates/${tenantId}`, {}, token),
  createContractTemplate: (token: string, payload: Record<string, unknown>) =>
    request<ContractTemplate>("/api/v1/contracts/templates", { method: "POST", body: JSON.stringify(payload) }, token),
  updateContractTemplate: (token: string, id: number, payload: Record<string, unknown>) =>
    request<ContractTemplate>(`/api/v1/contracts/templates/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  signContract: (payload: Record<string, unknown>) =>
    request<SignedContract>("/api/v1/contracts/sign", { method: "POST", body: JSON.stringify(payload) }),
  getSignedContractsByTenant: (token: string, tenantId: number) =>
    request<SignedContract[]>(`/api/v1/contracts/signed/by-tenant/${tenantId}`, {}, token),

  getRecurringOrdersByTenant: (token: string, tenantId: number) =>
    request<RecurringOrderSchedule[]>(`/api/v1/recurring-orders/by-tenant/${tenantId}`, {}, token),
  createRecurringOrder: (token: string, payload: Record<string, unknown>) =>
    request<RecurringOrderSchedule>("/api/v1/recurring-orders", { method: "POST", body: JSON.stringify(payload) }, token),
  addRecurringOrderItems: (token: string, scheduleId: number, payload: Array<Record<string, unknown>>) =>
    request<{ schedule_id: number; items_added: number }>(
      `/api/v1/recurring-orders/${scheduleId}/items`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  updateRecurringOrder: (token: string, scheduleId: number, payload: Record<string, unknown>) =>
    request<RecurringOrderSchedule>(`/api/v1/recurring-orders/${scheduleId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getLogisticsByTenant: (token: string, tenantId: number) =>
    request<LogisticsOrder[]>(`/api/v1/logistics/by-tenant/${tenantId}`, {}, token),
  createLogisticsOrder: (token: string, payload: Record<string, unknown>) =>
    request<LogisticsOrder>("/api/v1/logistics", { method: "POST", body: JSON.stringify(payload) }, token),
  scheduleLogistics: (token: string, id: number, payload: Record<string, unknown>) =>
    request<LogisticsOrder>(`/api/v1/logistics/${id}/schedule`, { method: "PUT", body: JSON.stringify(payload) }, token),
  rescheduleLogistics: (token: string, id: number, payload: Record<string, unknown>) =>
    request<LogisticsOrder>(`/api/v1/logistics/${id}/reschedule`, { method: "PUT", body: JSON.stringify(payload) }, token),
  markLogisticsDelivered: (token: string, id: number) =>
    request<LogisticsOrder>(`/api/v1/logistics/${id}/mark-delivered`, { method: "PUT" }, token),
  getLogisticsEvents: (token: string, id: number) =>
    request<LogisticsEvent[]>(`/api/v1/logistics/${id}/events`, {}, token),

  getReinpiaDashboardKpis: (token: string, query = "") =>
    request<ReinpiaKpisResponse>(`/api/v1/reinpia/dashboard/kpis${query ? `?${query}` : ""}`, {}, token),
  getReinpiaOrdersTimeseries: (token: string, query = "") =>
    request<ReinpiaTimeseriesPoint[]>(`/api/v1/reinpia/dashboard/orders-timeseries${query ? `?${query}` : ""}`, {}, token),
  getReinpiaTopTenants: (token: string, query = "") =>
    request<Array<{ tenant_id: number; tenant_name: string; revenue: number; commissions: number; net_amount: number }>>(
      `/api/v1/reinpia/dashboard/top-tenants${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getReinpiaTenantsSummary: (token: string, query = "") =>
    request<ReinpiaTenantSummaryRow[]>(`/api/v1/reinpia/tenants/summary${query ? `?${query}` : ""}`, {}, token),
  getReinpiaTenantKpis: (token: string, tenantId: number, query = "") =>
    request<ReinpiaTenantKpis>(`/api/v1/reinpia/tenants/${tenantId}/kpis${query ? `?${query}` : ""}`, {}, token),
  getReinpiaTenantOrders: (token: string, tenantId: number, query = "") =>
    request<Order[]>(`/api/v1/reinpia/tenants/${tenantId}/orders${query ? `?${query}` : ""}`, {}, token),
  getReinpiaTenantSubscriptions: (token: string, tenantId: number, query = "") =>
    request<ReinpiaSubscription[]>(`/api/v1/reinpia/tenants/${tenantId}/subscriptions${query ? `?${query}` : ""}`, {}, token),
  getReinpiaSalesSummary: (token: string, query = "") =>
    request<{ total_orders: number; subtotal_amount: number; discount_amount: number; total_revenue: number }>(
      `/api/v1/reinpia/payments/sales-summary${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getReinpiaCommissionsSummary: (token: string, query = "") =>
    request<{ total_commissions: number; total_net_amount: number }>(
      `/api/v1/reinpia/payments/commissions-summary${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getReinpiaPaymentsOrders: (token: string, query = "") =>
    request<Order[]>(`/api/v1/reinpia/payments/orders${query ? `?${query}` : ""}`, {}, token),
  getReinpiaAppointmentsSummary: (token: string, query = "") =>
    request<ReinpiaSummaryByStatus>(`/api/v1/reinpia/appointments/summary${query ? `?${query}` : ""}`, {}, token),
  getReinpiaLogisticsSummary: (token: string, query = "") =>
    request<{ total: number; delivered: number; by_status: Array<{ status: string; count: number }> }>(
      `/api/v1/reinpia/logistics/summary${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getReinpiaDistributorsSummary: (token: string, query = "") =>
    request<ReinpiaDistributorsSummary>(`/api/v1/reinpia/distributors/summary${query ? `?${query}` : ""}`, {}, token),
  getReinpiaExportUrl: (
    token: string,
    type: "sales" | "commissions" | "tenants" | "orders" | "commission-agents" | "plan-purchase-leads",
    query = ""
  ) => {
    const url = `${BASE_URL}/api/v1/reinpia/exports/${type}.csv${query ? `?${query}` : ""}`;
    return { url, token };
  },
  getReinpiaCommissionAgents: (token: string) =>
    request<SalesCommissionAgent[]>("/api/v1/reinpia/commission-agents", {}, token),
  createReinpiaCommissionAgent: (token: string, payload: Record<string, unknown>) =>
    request<SalesCommissionAgent>("/api/v1/reinpia/commission-agents", { method: "POST", body: JSON.stringify(payload) }, token),
  updateReinpiaCommissionAgent: (token: string, id: number, payload: Record<string, unknown>) =>
    request<SalesCommissionAgent>(`/api/v1/reinpia/commission-agents/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getReinpiaCommissionAgentSummary: (token: string, id: number, query = "") =>
    request<Record<string, number | string>>(`/api/v1/reinpia/commission-agents/${id}/summary${query ? `?${query}` : ""}`, {}, token),
  createReinpiaReferral: (token: string, payload: Record<string, unknown>) =>
    request<SalesReferral>("/api/v1/reinpia/referrals", { method: "POST", body: JSON.stringify(payload) }, token),
  getReinpiaReferrals: (token: string, query = "") =>
    request<SalesReferral[]>(`/api/v1/reinpia/referrals${query ? `?${query}` : ""}`, {}, token),
  createReinpiaPlanPurchaseLead: (token: string, payload: Record<string, unknown>) =>
    request<PlanPurchaseLead>("/api/v1/reinpia/plan-purchase-leads", { method: "POST", body: JSON.stringify(payload) }, token),
  getReinpiaPlanPurchaseLeads: (token: string, query = "") =>
    request<PlanPurchaseLead[]>(`/api/v1/reinpia/plan-purchase-leads${query ? `?${query}` : ""}`, {}, token),
  getReinpiaAlerts: (token: string, query = "") =>
    request<InternalAlert[]>(`/api/v1/reinpia/alerts${query ? `?${query}` : ""}`, {}, token),
  markReinpiaAlertRead: (token: string, id: number) =>
    request<InternalAlert>(`/api/v1/reinpia/alerts/${id}/read`, { method: "PUT" }, token),
  getComerciaReferralValidation: (refCode: string) =>
    request<{ valid: boolean; code: string; agent_name?: string }>(`/api/v1/comercia/referral/${encodeURIComponent(refCode)}`),
  createComerciaPlanPurchaseLead: (payload: Record<string, unknown>) =>
    request<PlanPurchaseLead>("/api/v1/comercia/plan-purchase-leads", { method: "POST", body: JSON.stringify(payload) })
};

export { ApiError };
