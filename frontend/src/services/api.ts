import {
  Appointment,
  AutomationEventLog,
  Banner,
  BrandDiagnostic,
  BrandDiagnosticSummary,
  BrandGeneratedContent,
  BrandEcommerceData,
  BrandIdentityData,
  BrandLandingDraft,
  BrandPosSetupData,
  BrandChannelSettings,
  BrandSetupAsset,
  BrandSetupStepState,
  BrandSetupWorkflow,
  BotChannelConfig,
  BotMessageTemplate,
  CatalogBulkImportResult,
  Category,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  ContractTemplate,
  CommercialPlanCatalog,
  Coupon,
  CurrencySettings,
  PlatformSettings,
  BrandAdminSettings,
  CustomerContactLead,
  DistributorApplication,
  DistributorEmployee,
  DistributorProfile,
  ExchangeRate,
  InternalAlert,
  LogisticsAdditionalService,
  LogisticsEvent,
  LogisticsOrder,
  LoginResponse,
  LoyaltyProgram,
  MarketingProspect,
  MembershipPlan,
  MercadoPagoSettings,
  OnboardingGuide,
  OnboardingProgressResponse,
  PosCustomer,
  PosEmployee,
  PosLocation,
  PosSale,
  PosPaymentTransaction,
  PlanPurchaseLead,
  Order,
  PaymentsDashboard,
  Plan,
  Product,
  AdminUser,
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
  SecurityAlert,
  SecurityEvent,
  SecurityKpis,
  SecurityRule,
  BlockedEntity,
  ServiceOffering,
  SignedContract,
  StorefrontDistributorsPayload,
  StorefrontHomePayload,
  StorefrontPayload,
  StorefrontSnapshot,
  StripeConfig,
  TenantReportOverview,
  TenantReportSales,
  TenantReportUsers,
  Tenant,
  TenantCommercialStatus,
  TenantBranding,
  TenantConfig,
  User,
  WishlistItem
} from "../types/domain";

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/^['"]+|['"]+$/g, "").replace(/\/+$/, "");
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000");
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? "15000");
const RUNTIME_BASE_URL_KEY = "comercia.runtime_api_url";
const DEV_LOCAL_BASE_URLS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

function isLocalBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost");
  } catch {
    return false;
  }
}

let runtimeBaseUrl: string | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(RUNTIME_BASE_URL_KEY);
    if (!stored) return null;
    const normalized = normalizeBaseUrl(stored);
    // Evita quedar pegado a puertos efimeros que luego rompen login/modulos.
    if (isLocalBaseUrl(normalized) && !DEV_LOCAL_BASE_URLS.includes(normalized) && normalized !== BASE_URL) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
})();

function getApiBaseUrl(): string {
  return runtimeBaseUrl ?? BASE_URL;
}

function setApiBaseUrl(url: string): void {
  const normalized = normalizeBaseUrl(url);
  runtimeBaseUrl = normalized;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RUNTIME_BASE_URL_KEY, normalized);
  } catch {
    // Ignorar storage failures en entornos restringidos.
  }
}

function getCandidateBaseUrls(): string[] {
  const configured = normalizeBaseUrl(BASE_URL);
  const ordered = [configured, ...DEV_LOCAL_BASE_URLS];
  if (runtimeBaseUrl) {
    ordered.push(runtimeBaseUrl);
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host) {
      ordered.push(`http://${host}:8000`);
    }
  }

  try {
    const parsed = new URL(configured);
    const isLocalHost = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    if (isLocalHost && parsed.protocol === "http:") {
      ordered.push(`http://${parsed.hostname}:8000`);
    }
  } catch {
    // Si configured no es una URL valida, seguimos con los defaults.
  }

  return [...new Set(ordered)];
}

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

  const candidateBaseUrls = getCandidateBaseUrls();
  let lastNetworkEndpoint = `${BASE_URL}${path}`;
  let sawTimeout = false;

  for (let index = 0; index < candidateBaseUrls.length; index += 1) {
    const candidateBaseUrl = candidateBaseUrls[index];
    const endpoint = `${candidateBaseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, { ...init, headers, signal: controller.signal });
      window.clearTimeout(timeoutId);
      if (!response.ok) {
        if (
          response.status === 404 &&
          isLocalBaseUrl(candidateBaseUrl) &&
          index < candidateBaseUrls.length - 1
        ) {
          continue;
        }
        const errorText = await response.text();
        throw new ApiError(`Error ${response.status} en ${endpoint}: ${errorText || response.statusText}`, response.status);
      }
      setApiBaseUrl(candidateBaseUrl);
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      window.clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      lastNetworkEndpoint = endpoint;
      if (error instanceof DOMException && error.name === "AbortError") {
        sawTimeout = true;
      }
    }
  }

  if (sawTimeout) {
    throw new ApiError(`La solicitud excedio el tiempo de espera en ${lastNetworkEndpoint}. Verifica backend y red local.`, 0);
  }
  const message =
    `No fue posible conectar con el backend en ${lastNetworkEndpoint}. ` +
    "Verifica que la API este arriba y que VITE_API_URL apunte al puerto correcto.";
  throw new ApiError(message, 0);
}

export const api = {
  getBaseUrl: () => getApiBaseUrl(),
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: (token: string) => request<User>("/api/v1/auth/me", {}, token),

  getTenants: (token: string) => request<Tenant[]>("/api/v1/tenants", {}, token),
  createTenant: (
    token: string,
    payload: {
      name: string;
      slug: string;
      subdomain: string;
      business_type: string;
      is_active: boolean;
      billing_model?: string;
      commission_percentage?: number;
      commission_enabled?: boolean;
      commission_scope?: string;
      commission_notes?: string;
    }
  ) => request<Tenant>("/api/v1/tenants", { method: "POST", body: JSON.stringify(payload) }, token),
  getTenantById: (token: string, tenantId: number) => request<Tenant>(`/api/v1/tenants/${tenantId}`, {}, token),
  updateTenant: (token: string, tenantId: number, payload: Partial<Tenant>) =>
    request<Tenant>(`/api/v1/tenants/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getTenantStorefrontConfig: (token: string, tenantId: number) =>
    request<StorefrontSnapshot>(`/api/v1/tenants/${tenantId}/storefront-config`, {}, token),
  getBrandSetupWorkflow: (token: string, tenantId: number) =>
    request<BrandSetupWorkflow>(`/api/v1/brand-setup/${tenantId}`, {}, token),
  updateBrandSetupWorkflow: (
    token: string,
    tenantId: number,
    payload: {
      current_step?: string;
      is_published?: boolean;
      prompt_master?: string;
      selected_template?: string;
      landing_template?: string;
      public_store_template?: string;
      distributor_store_template?: string;
      billing_model?: string;
      commission_percentage?: number;
      commission_enabled?: boolean;
      commission_scope?: string;
      commission_notes?: string;
      flow_type?: string;
      steps?: BrandSetupStepState[];
      identity_data?: BrandIdentityData;
      generated_content?: BrandGeneratedContent;
      landing_draft?: BrandLandingDraft;
      ecommerce_data?: BrandEcommerceData;
      pos_setup_data?: BrandPosSetupData;
    }
  ) => request<BrandSetupWorkflow>(`/api/v1/brand-setup/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  generateBrandSetupContent: (token: string, tenantId: number, prompt_master: string) =>
    request<BrandSetupWorkflow>(
      `/api/v1/brand-setup/${tenantId}/generate-content`,
      { method: "POST", body: JSON.stringify({ prompt_master }) },
      token
    ),
  generateBrandSetupLanding: (token: string, tenantId: number, regenerate = false) =>
    request<BrandSetupWorkflow>(
      `/api/v1/brand-setup/${tenantId}/generate-landing`,
      { method: "POST", body: JSON.stringify({ regenerate }) },
      token
    ),
  approveBrandSetupStep: (token: string, tenantId: number, stepCode: string) =>
    request<BrandSetupWorkflow>(`/api/v1/brand-setup/${tenantId}/steps/${stepCode}/approve`, { method: "POST" }, token),
  activateBrandSetupEcommercePublic: (token: string, tenantId: number) =>
    request<BrandSetupWorkflow>(`/api/v1/brand-setup/${tenantId}/ecommerce-public/activate`, { method: "POST" }, token),
  applyBrandEcommerceTemplate: (token: string, tenantId: number) =>
    request<BrandSetupWorkflow>(`/api/v1/brand-setup/${tenantId}/ecommerce-template/apply`, { method: "POST" }, token),
  uploadBrandAsset: async (token: string, tenantId: number, stepCode: string, assetType: string, file: File) => {
    const formData = new FormData();
    formData.set("step_code", stepCode);
    formData.set("asset_type", assetType);
    formData.set("file", file);
    const endpoint = `${getApiBaseUrl()}/api/v1/brand-setup/${tenantId}/assets`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch {
      throw new ApiError(`No fue posible conectar con el endpoint de upload (${endpoint}).`, 0);
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Error ${response.status} al subir archivo en ${endpoint}: ${errorText || response.statusText}`, response.status);
    }
    return (await response.json()) as BrandSetupAsset;
  },
  getBrandChannelSettings: (token: string, tenantId: number) =>
    request<BrandChannelSettings>(`/api/v1/brand-setup/${tenantId}/channel-settings`, {}, token),
  updateBrandChannelSettings: (token: string, tenantId: number, payload: Partial<BrandChannelSettings>) =>
    request<BrandChannelSettings>(
      `/api/v1/brand-setup/${tenantId}/channel-settings`,
      { method: "PUT", body: JSON.stringify(payload) },
      token
    ),

  getTenantBranding: (token: string, tenantId: number) => request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, {}, token),
  upsertTenantBranding: (token: string, tenantId: number, payload: Partial<TenantBranding>) =>
    request<TenantBranding>(`/api/v1/tenant-branding/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getPlans: (token: string) => request<Plan[]>("/api/v1/plans", {}, token),
  getCommercialPlanCatalog: (token: string) =>
    request<CommercialPlanCatalog>("/api/v1/commercial-plans/catalog", {}, token),
  createCommercialPlanCheckoutSession: (
    token: string,
    payload: { tenant_id: number; plan_key: string; success_url: string; cancel_url: string }
  ) =>
    request<{ plan_key: string; session_id: string; session_url: string; price_with_tax_mxn: string }>(
      "/api/v1/commercial-plans/create-checkout-session",
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  getTenantCommercialStatus: (token: string, tenantId: number) =>
    request<TenantCommercialStatus>(`/api/v1/commercial-plans/tenant/${tenantId}/status`, {}, token),
  consumeTenantAiTokens: (token: string, tenantId: number, payload: { tokens: number; reason?: string }) =>
    request<TenantCommercialStatus>(
      `/api/v1/commercial-plans/tenant/${tenantId}/tokens/consume`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  topupTenantAiTokens: (token: string, tenantId: number, payload: { tokens: number; reason?: string }) =>
    request<TenantCommercialStatus>(
      `/api/v1/commercial-plans/tenant/${tenantId}/tokens/topup`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  setTenantAiTokensLock: (token: string, tenantId: number, payload: { locked: boolean; reason?: string }) =>
    request<TenantCommercialStatus>(
      `/api/v1/commercial-plans/tenant/${tenantId}/tokens/lock`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  getStripeConfigByTenant: (token: string, tenantId: number) =>
    request<StripeConfig>(`/api/v1/stripe-config/${tenantId}`, {}, token),
  upsertStripeConfig: (token: string, payload: Record<string, unknown>) =>
    request<StripeConfig>("/api/v1/stripe-config", { method: "POST", body: JSON.stringify(payload) }, token),
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
  bulkImportCatalog: (
    token: string,
    payload: {
      tenant_id: number;
      rows: Array<Record<string, unknown>>;
    }
  ) => request<CatalogBulkImportResult>("/api/v1/products/bulk-import", { method: "POST", body: JSON.stringify(payload) }, token),
  getLatestCatalogImportJob: (token: string, tenantId: number) =>
    request<CatalogBulkImportResult["job"] | null>(`/api/v1/products/bulk-import/tenant/${tenantId}/latest`, {}, token),
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

  getProductReviews: (productId: number, includeUnapproved = false, moderationStatus?: string) =>
    request<ProductReview[]>(
      `/api/v1/reviews/product/${productId}?include_unapproved=${includeUnapproved ? "true" : "false"}${
        moderationStatus ? `&moderation_status=${encodeURIComponent(moderationStatus)}` : ""
      }`
    ),
  createProductReview: (payload: Record<string, unknown>) =>
    request<ProductReview>("/api/v1/reviews", { method: "POST", body: JSON.stringify(payload) }),
  approveProductReview: (token: string, id: number) =>
    request<ProductReview>(`/api/v1/reviews/${id}/approve`, { method: "PUT" }, token),
  rejectProductReview: (token: string, id: number) =>
    request<ProductReview>(`/api/v1/reviews/${id}/reject`, { method: "PUT" }, token),

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
  getTenantConfig: (params: { tenantId?: number; tenantSlug?: string }) => {
    const query = params.tenantId ? `tenant_id=${params.tenantId}` : `tenant_slug=${encodeURIComponent(params.tenantSlug ?? "")}`;
    return request<TenantConfig>(`/api/v1/tenant/config?${query}`);
  },
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
  getReinpiaLogisticsServices: (token: string, query = "") =>
    request<LogisticsAdditionalService[]>(`/api/v1/reinpia/logistics-services${query ? `?${query}` : ""}`, {}, token),
  createReinpiaLogisticsService: (token: string, payload: Record<string, unknown>) =>
    request<LogisticsAdditionalService>("/api/v1/reinpia/logistics-services", { method: "POST", body: JSON.stringify(payload) }, token),
  updateReinpiaLogisticsService: (token: string, id: number, payload: Record<string, unknown>) =>
    request<LogisticsAdditionalService>(`/api/v1/reinpia/logistics-services/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getReinpiaLogisticsServiceSummary: (token: string, query = "") =>
    request<{ total_services: number; subtotal: number; iva: number; total: number; by_status: Array<{ status: string; count: number }> }>(
      `/api/v1/reinpia/logistics-services-summary${query ? `?${query}` : ""}`,
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
    const url = `${getApiBaseUrl()}/api/v1/reinpia/exports/${type}.csv${query ? `?${query}` : ""}`;
    return { url, token };
  },
  getTenantReportOverview: (token: string, tenantId: number, query = "") =>
    request<TenantReportOverview>(`/api/v1/reports/tenant/${tenantId}/overview${query ? `?${query}` : ""}`, {}, token),
  getTenantReportUsers: (token: string, tenantId: number, query = "") =>
    request<TenantReportUsers>(`/api/v1/reports/tenant/${tenantId}/users${query ? `?${query}` : ""}`, {}, token),
  getTenantReportSales: (token: string, tenantId: number, query = "") =>
    request<TenantReportSales>(`/api/v1/reports/tenant/${tenantId}/sales${query ? `?${query}` : ""}`, {}, token),
  getTenantReportMemberships: (token: string, tenantId: number, query = "") =>
    request<Record<string, number>>(`/api/v1/reports/tenant/${tenantId}/memberships${query ? `?${query}` : ""}`, {}, token),
  getTenantReportLoyalty: (token: string, tenantId: number, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reports/tenant/${tenantId}/loyalty${query ? `?${query}` : ""}`, {}, token),
  getTenantTopProducts: (token: string, tenantId: number, query = "") =>
    request<Array<Record<string, unknown>>>(`/api/v1/reports/tenant/${tenantId}/products/top-selling${query ? `?${query}` : ""}`, {}, token),
  getTenantLowProducts: (token: string, tenantId: number, query = "") =>
    request<Array<Record<string, unknown>>>(`/api/v1/reports/tenant/${tenantId}/products/low-selling${query ? `?${query}` : ""}`, {}, token),
  getTenantUnsoldProducts: (token: string, tenantId: number, query = "") =>
    request<Array<Record<string, unknown>>>(`/api/v1/reports/tenant/${tenantId}/products/unsold${query ? `?${query}` : ""}`, {}, token),
  getTenantDistributorsReport: (token: string, tenantId: number, query = "") =>
    request<Record<string, number>>(`/api/v1/reports/tenant/${tenantId}/distributors${query ? `?${query}` : ""}`, {}, token),
  getTenantLogisticsReport: (token: string, tenantId: number, query = "") =>
    request<Record<string, number>>(`/api/v1/reports/tenant/${tenantId}/logistics${query ? `?${query}` : ""}`, {}, token),
  getTenantServicesReport: (token: string, tenantId: number, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reports/tenant/${tenantId}/services${query ? `?${query}` : ""}`, {}, token),
  getTenantMarketingInsights: (token: string, tenantId: number, query = "") =>
    request<{ insights: Array<Record<string, unknown>>; top_categories: Array<Record<string, unknown>> }>(
      `/api/v1/reports/tenant/${tenantId}/marketing-insights${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getTenantReportExportUrl: (
    tenantId: number,
    type: "users" | "sales" | "products" | "loyalty" | "distributors" | "logistics" | "services" | "marketing-insights",
    query = ""
  ) => `${getApiBaseUrl()}/api/v1/reports/tenant/${tenantId}/export/${type}.csv${query ? `?${query}` : ""}`,
  getReinpiaReportsOverview: (token: string, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reinpia/reports/overview${query ? `?${query}` : ""}`, {}, token),
  getReinpiaReportsGrowth: (token: string, query = "") =>
    request<Record<string, Array<Record<string, unknown>>>>(`/api/v1/reinpia/reports/tenants-growth${query ? `?${query}` : ""}`, {}, token),
  getReinpiaReportsCommissions: (token: string, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reinpia/reports/commissions${query ? `?${query}` : ""}`, {}, token),
  getReinpiaReportsLeads: (token: string, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reinpia/reports/leads${query ? `?${query}` : ""}`, {}, token),
  getReinpiaReportsMarketingOpportunities: (token: string, query = "") =>
    request<{ opportunities: Array<Record<string, unknown>> }>(
      `/api/v1/reinpia/reports/marketing-opportunities${query ? `?${query}` : ""}`,
      {},
      token
    ),
  getReinpiaReportsCommercialSummary: (token: string, query = "") =>
    request<Record<string, unknown>>(`/api/v1/reinpia/reports/commercial-summary${query ? `?${query}` : ""}`, {}, token),
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
    request<PlanPurchaseLead>("/api/v1/comercia/plan-purchase-leads", { method: "POST", body: JSON.stringify(payload) }),
  createComerciaCustomerContactLead: (payload: Record<string, unknown>) =>
    request<CustomerContactLead>("/api/v1/comercia/customer-contact-leads", { method: "POST", body: JSON.stringify(payload) }),
  createComerciaMarketingProspect: (payload: Record<string, unknown>) =>
    request<MarketingProspect>("/api/v1/comercia/marketing-prospects", { method: "POST", body: JSON.stringify(payload) }),
  getReinpiaCustomerContactLeads: (token: string, query = "") =>
    request<CustomerContactLead[]>(`/api/v1/reinpia/customer-contact-leads${query ? `?${query}` : ""}`, {}, token),
  updateReinpiaCustomerContactLead: (token: string, leadId: number, payload: Record<string, unknown>) =>
    request<CustomerContactLead>(`/api/v1/reinpia/customer-contact-leads/${leadId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getReinpiaMarketingProspects: (token: string, query = "") =>
    request<MarketingProspect[]>(`/api/v1/reinpia/marketing-prospects${query ? `?${query}` : ""}`, {}, token),
  getReinpiaMarketingProspectById: (token: string, prospectId: number) =>
    request<MarketingProspect>(`/api/v1/reinpia/marketing-prospects/${prospectId}`, {}, token),
  updateReinpiaMarketingProspect: (token: string, prospectId: number, payload: Record<string, unknown>) =>
    request<MarketingProspect>(`/api/v1/reinpia/marketing-prospects/${prospectId}`, { method: "PUT", body: JSON.stringify(payload) }, token),

  getOnboardingGuides: (token: string) => request<OnboardingGuide[]>("/api/v1/onboarding/guides", {}, token),
  getOnboardingGuide: (token: string, guideId: number) =>
    request<OnboardingGuide>(`/api/v1/onboarding/guides/${guideId}`, {}, token),
  getOnboardingProgressMe: (token: string) =>
    request<OnboardingProgressResponse>("/api/v1/onboarding/progress/me", {}, token),
  completeOnboardingStep: (token: string, payload: { guide_id: number; step_id: number; completed: boolean }) =>
    request("/api/v1/onboarding/progress/step-complete", { method: "POST", body: JSON.stringify(payload) }, token),

  getCurrencySettings: (tenantId: number) => request<CurrencySettings>(`/api/v1/currency-settings/${tenantId}`),
  upsertCurrencySettings: (token: string, tenantId: number, payload: Record<string, unknown>) =>
    request<CurrencySettings>(`/api/v1/currency-settings/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getPlatformSettings: (token: string) => request<PlatformSettings>("/api/v1/admin/platform-settings", {}, token),
  updatePlatformSettings: (token: string, payload: Record<string, unknown>) =>
    request<PlatformSettings>("/api/v1/admin/platform-settings", { method: "PUT", body: JSON.stringify(payload) }, token),
  getBrandAdminSettings: (token: string, tenantId: number) =>
    request<BrandAdminSettings>(`/api/v1/admin/brand-settings/${tenantId}`, {}, token),
  updateBrandAdminSettings: (token: string, tenantId: number, payload: Record<string, unknown>) =>
    request<BrandAdminSettings>(`/api/v1/admin/brand-settings/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  analyzeBrandDiagnostics: (token: string, tenantId: number) =>
    request<BrandDiagnostic>(`/api/v1/brand-diagnostics/${tenantId}/analyze`, { method: "POST" }, token),
  analyzeExternalUrlDiagnostics: (token: string, payload: { url: string; tenant_id?: number }) =>
    request<BrandDiagnostic>(
      "/api/v1/brand-diagnostics/analyze-external-url",
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  getBrandDiagnosticsLatest: (token: string, tenantId: number) =>
    request<BrandDiagnostic>(`/api/v1/brand-diagnostics/${tenantId}/latest`, {}, token),
  getBrandDiagnosticsLatestExternal: (token: string, tenantId: number) =>
    request<BrandDiagnostic>(`/api/v1/brand-diagnostics/${tenantId}/latest-external`, {}, token),
  getBrandDiagnosticsHistory: (token: string, tenantId: number) =>
    request<BrandDiagnosticSummary[]>(`/api/v1/brand-diagnostics/${tenantId}`, {}, token),
  saveBrandDiagnosticsImprovementPlan: (
    token: string,
    tenantId: number,
    payload: {
      accepted_high_priority: string[];
      accepted_medium_priority: string[];
      accepted_low_priority: string[];
      notes: string;
      owner: string;
    }
  ) =>
    request<BrandDiagnostic>(
      `/api/v1/brand-diagnostics/${tenantId}/improvement-plan`,
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  getReinpiaDiagnostics: (token: string) =>
    request<BrandDiagnosticSummary[]>("/api/v1/reinpia/diagnostics", {}, token),
  getExchangeRates: (query = "") =>
    request<ExchangeRate[]>(`/api/v1/exchange-rates${query ? `?${query}` : ""}`),
  createManualExchangeRate: (token: string, payload: Record<string, unknown>) =>
    request<ExchangeRate>("/api/v1/exchange-rates/manual", { method: "POST", body: JSON.stringify(payload) }, token),
  refreshExchangeRates: (token: string) =>
    request<ExchangeRate[]>("/api/v1/exchange-rates/refresh", { method: "POST" }, token),
  getMercadoPagoSettings: (token: string, tenantId: number) =>
    request<MercadoPagoSettings>(`/api/v1/mercadopago-settings/${tenantId}`, {}, token),
  upsertMercadoPagoSettings: (token: string, tenantId: number, payload: Record<string, unknown>) =>
    request<MercadoPagoSettings>(`/api/v1/mercadopago-settings/${tenantId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  previewConversion: (payload: Record<string, unknown>) =>
    request<{ converted_amount: number; rate: number }>("/api/v1/exchange-rates/preview", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getAdminUsers: (token: string, params: { scope: "global" | "brand"; tenant_id?: number }) => {
    const query = new URLSearchParams();
    query.set("scope", params.scope);
    if (params.tenant_id) query.set("tenant_id", String(params.tenant_id));
    return request<AdminUser[]>(`/api/v1/admin/users?${query.toString()}`, {}, token);
  },
  createAdminUser: (
    token: string,
    params: { scope: "global" | "brand"; tenant_id?: number },
    payload: Record<string, unknown>
  ) => {
    const query = new URLSearchParams();
    query.set("scope", params.scope);
    if (params.tenant_id) query.set("tenant_id", String(params.tenant_id));
    return request<AdminUser>(`/api/v1/admin/users?${query.toString()}`, { method: "POST", body: JSON.stringify(payload) }, token);
  },
  updateAdminUser: (
    token: string,
    userId: number,
    params: { scope: "global" | "brand"; tenant_id?: number },
    payload: Record<string, unknown>
  ) => {
    const query = new URLSearchParams();
    query.set("scope", params.scope);
    if (params.tenant_id) query.set("tenant_id", String(params.tenant_id));
    return request<AdminUser>(
      `/api/v1/admin/users/${userId}?${query.toString()}`,
      { method: "PUT", body: JSON.stringify(payload) },
      token
    );
  },

  getPosLocations: (token: string, tenantId: number) =>
    request<PosLocation[]>(`/api/v1/pos/locations/by-tenant/${tenantId}`, {}, token),
  createPosLocation: (token: string, payload: Record<string, unknown>) =>
    request<PosLocation>("/api/v1/pos/locations", { method: "POST", body: JSON.stringify(payload) }, token),
  updatePosLocation: (token: string, id: number, payload: Record<string, unknown>) =>
    request<PosLocation>(`/api/v1/pos/locations/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getPosEmployeesByLocation: (token: string, locationId: number) =>
    request<PosEmployee[]>(`/api/v1/pos/employees/by-location/${locationId}`, {}, token),
  createPosEmployee: (token: string, payload: Record<string, unknown>) =>
    request<PosEmployee>("/api/v1/pos/employees", { method: "POST", body: JSON.stringify(payload) }, token),
  updatePosEmployee: (token: string, id: number, payload: Record<string, unknown>) =>
    request<PosEmployee>(`/api/v1/pos/employees/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  createPosSale: (token: string, payload: Record<string, unknown>) =>
    request<PosSale>("/api/v1/pos/sales", { method: "POST", body: JSON.stringify(payload) }, token),
  getPosSalesByTenant: (token: string, tenantId: number) =>
    request<PosSale[]>(`/api/v1/pos/sales/by-tenant/${tenantId}`, {}, token),
  getPosSalesByLocation: (token: string, locationId: number) =>
    request<PosSale[]>(`/api/v1/pos/sales/by-location/${locationId}`, {}, token),
  getPosCustomersByTenant: (token: string, tenantId: number) =>
    request<PosCustomer[]>(`/api/v1/pos/customers/by-tenant/${tenantId}`, {}, token),
  createPosCustomer: (token: string, payload: Record<string, unknown>) =>
    request<PosCustomer>("/api/v1/pos/customers", { method: "POST", body: JSON.stringify(payload) }, token),
  createPosMercadoPagoLink: (token: string, payload: Record<string, unknown>) =>
    request<PosPaymentTransaction>("/api/v1/pos/payments/mercadopago/link", { method: "POST", body: JSON.stringify(payload) }, token),
  createPosMercadoPagoQr: (token: string, payload: Record<string, unknown>) =>
    request<PosPaymentTransaction>("/api/v1/pos/payments/mercadopago/qr", { method: "POST", body: JSON.stringify(payload) }, token),
  confirmPosMercadoPagoPayment: (token: string, payload: Record<string, unknown>) =>
    request<PosPaymentTransaction>(
      "/api/v1/pos/payments/mercadopago/confirm",
      { method: "POST", body: JSON.stringify(payload) },
      token
    ),
  getPosPaymentsByTenant: (token: string, tenantId: number) =>
    request<PosPaymentTransaction[]>(`/api/v1/pos/payments/by-tenant/${tenantId}`, {}, token),

  getAutomationEvents: (token: string, query = "") =>
    request<AutomationEventLog[]>(`/api/v1/automation/events${query ? `?${query}` : ""}`, {}, token),
  createAutomationEvent: (token: string, payload: Record<string, unknown>) =>
    request<AutomationEventLog>("/api/v1/automation/events", { method: "POST", body: JSON.stringify(payload) }, token),
  getAutomationChannels: (token: string, query = "") =>
    request<BotChannelConfig[]>(`/api/v1/automation/channels${query ? `?${query}` : ""}`, {}, token),
  upsertAutomationChannel: (token: string, payload: Record<string, unknown>) =>
    request<BotChannelConfig>("/api/v1/automation/channels", { method: "POST", body: JSON.stringify(payload) }, token),
  updateAutomationChannel: (token: string, id: number, payload: Record<string, unknown>) =>
    request<BotChannelConfig>(`/api/v1/automation/channels/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  getAutomationTemplates: (token: string, query = "") =>
    request<BotMessageTemplate[]>(`/api/v1/automation/templates${query ? `?${query}` : ""}`, {}, token),
  upsertAutomationTemplate: (token: string, payload: Record<string, unknown>) =>
    request<BotMessageTemplate>("/api/v1/automation/templates", { method: "POST", body: JSON.stringify(payload) }, token),

  getSecurityKpis: (token: string, query = "") =>
    request<SecurityKpis>(`/api/v1/security/kpis${query ? `?${query}` : ""}`, {}, token),
  getSecurityEvents: (token: string, query = "") =>
    request<SecurityEvent[]>(`/api/v1/security/events${query ? `?${query}` : ""}`, {}, token),
  getSecurityAlerts: (token: string, query = "") =>
    request<SecurityAlert[]>(`/api/v1/security/alerts${query ? `?${query}` : ""}`, {}, token),
  markSecurityAlertRead: (token: string, id: number) =>
    request<SecurityAlert>(`/api/v1/security/alerts/${id}/read`, { method: "PUT" }, token),
  getSecurityRules: (token: string) => request<SecurityRule[]>("/api/v1/security/rules", {}, token),
  updateSecurityRule: (token: string, ruleId: number, payload: Record<string, unknown>) =>
    request<SecurityRule>(`/api/v1/security/rules/${ruleId}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  toggleSecurityRule: (token: string, ruleId: number) =>
    request<{ id: number; is_active: boolean }>(`/api/v1/security/rules/${ruleId}/toggle`, { method: "POST" }, token),
  getBlockedEntities: (token: string, query = "") =>
    request<BlockedEntity[]>(`/api/v1/security/blocked-entities${query ? `?${query}` : ""}`, {}, token),
  createBlockedEntity: (token: string, payload: Record<string, unknown>) =>
    request<BlockedEntity>("/api/v1/security/blocked-entities", { method: "POST", body: JSON.stringify(payload) }, token),
  unblockEntity: (token: string, blockedId: number) =>
    request<BlockedEntity>(`/api/v1/security/blocked-entities/${blockedId}/unblock`, { method: "PUT" }, token)
};

export { ApiError };



