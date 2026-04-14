import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleRoute } from "../components/RoleRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { StorePublicTemplate } from "../pages/templates/StorePublicTemplate";
import { StoreDistributorsTemplate } from "../pages/templates/StoreDistributorsTemplate";
import { StorePOSTemplate } from "../pages/templates/StorePOSTemplate";
import { TemplateFamilyDemoPage } from "../pages/templates/TemplateFamilyDemoPage";
import { AppointmentsAdminPage } from "../pages/AppointmentsAdminPage";
import { BrandingEditorPage } from "../pages/BrandingEditorPage";
import { BannersAdminPage } from "../pages/BannersAdminPage";
import { CatalogBulkUploadPage } from "../pages/CatalogBulkUploadPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { ComerciaConsultoriaPage } from "../pages/ComerciaConsultoriaPage";
import { ComerciaLandingPage } from "../pages/ComerciaLandingPage";
import { ComerciaMarketingPage } from "../pages/ComerciaMarketingPage";
import { ComerciaPreciosPage } from "../pages/ComerciaPreciosPage";
import { CurrencyAdminPage } from "../pages/CurrencyAdminPage";
import { LanguageAdminPage } from "../pages/LanguageAdminPage";
import { ContractsAdminPage } from "../pages/ContractsAdminPage";
import { CookiesPolicyPage } from "../pages/CookiesPolicyPage";
import { CouponsAdminPage } from "../pages/CouponsAdminPage";
import { DataProtectionPolicyPage } from "../pages/DataProtectionPolicyPage";
import { DashboardPage } from "../pages/DashboardPage";
import { BrandDiagnosticsPage } from "../pages/BrandDiagnosticsPage";
import { DistributorApplicationsAdminPage } from "../pages/DistributorApplicationsAdminPage";
import { DistributorLoginPlaceholderPage } from "../pages/DistributorLoginPlaceholderPage";
import { DistributorRegistrationPage } from "../pages/DistributorRegistrationPage";
import { DistributorsAdminPage } from "../pages/DistributorsAdminPage";
import { FeedbackModerationPage } from "../pages/FeedbackModerationPage";
import { InventoryPage } from "../pages/InventoryPage";
import { LoginPage } from "../pages/LoginPage";
import { LogisticsAdminPage } from "../pages/LogisticsAdminPage";
import { LoyaltyProgramAdminPage } from "../pages/LoyaltyProgramAdminPage";
import { MembershipPlansAdminPage } from "../pages/MembershipPlansAdminPage";
import { MercadoPagoSettingsPage } from "../pages/MercadoPagoSettingsPage";
import { NfcAddonPage } from "../pages/NfcAddonPage";
import { PaymentsAdminPage } from "../pages/PaymentsAdminPage";
import { PlansPage } from "../pages/PlansPage";
import { PosCustomersPage } from "../pages/PosCustomersPage";
import { PosLocationsPage } from "../pages/PosLocationsPage";
import { PosLoginPlaceholderPage } from "../pages/PosLoginPlaceholderPage";
import { PosPage } from "../pages/PosPage";
import { PosSalesPage } from "../pages/PosSalesPage";
import { PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { ProductsPage } from "../pages/ProductsPage";
import { RecurringOrdersAdminPage } from "../pages/RecurringOrdersAdminPage";
import { AutomationAdminPage } from "../pages/AutomationAdminPage";
import { ReinpiaDashboardPage } from "../pages/ReinpiaDashboardPage";
import { ReinpiaDiagnosticsPage } from "../pages/ReinpiaDiagnosticsPage";
import { ReinpiaBrandsNewPage } from "../pages/ReinpiaBrandsNewPage";
import { BrandSetupWizard } from "../pages/BrandSetupWizard";
import { ReinpiaCommissionAgentsPage } from "../pages/ReinpiaCommissionAgentsPage";
import { ReinpiaOperationsPage } from "../pages/ReinpiaOperationsPage";
import { ReinpiaPaymentsPage } from "../pages/ReinpiaPaymentsPage";
import { ReinpiaLogisticsServicesPage } from "../pages/ReinpiaLogisticsServicesPage";
import { ReinpiaReportsPage } from "../pages/ReinpiaReportsPage";
import { ReinpiaReportsOverviewPage } from "../pages/ReinpiaReportsOverviewPage";
import { ReinpiaGrowthReportPage } from "../pages/ReinpiaGrowthReportPage";
import { ReinpiaCommissionsReportPage } from "../pages/ReinpiaCommissionsReportPage";
import { ReinpiaLeadsReportPage } from "../pages/ReinpiaLeadsReportPage";
import { ReinpiaMarketingOpportunitiesPage } from "../pages/ReinpiaMarketingOpportunitiesPage";
import { ReinpiaCreatedChannelDetailPage } from "../pages/ReinpiaCreatedChannelDetailPage";
import { ReinpiaCreatedChannelsPage } from "../pages/ReinpiaCreatedChannelsPage";
import { ReinpiaSecurityAlertsPage } from "../pages/ReinpiaSecurityAlertsPage";
import { ReinpiaSecurityDashboardPage } from "../pages/ReinpiaSecurityDashboardPage";
import { ReinpiaSecurityRulesPage } from "../pages/ReinpiaSecurityRulesPage";
import { ReinpiaTenantDetailPage } from "../pages/ReinpiaTenantDetailPage";
import { ReinpiaTenantsPage } from "../pages/ReinpiaTenantsPage";
import { ReinpiaBlockedEntitiesPage } from "../pages/ReinpiaBlockedEntitiesPage";
import { ReinpiaAlertsPage } from "../pages/ReinpiaAlertsPage";
import { ReinpiaCommercialInboxPage } from "../pages/ReinpiaCommercialInboxPage";
import { ReinpiaCommercialClientsPage } from "../pages/ReinpiaCommercialClientsPage";
import { ReinpiaMarketingProspectsPage } from "../pages/ReinpiaMarketingProspectsPage";
import { ReviewsAdminPage } from "../pages/ReviewsAdminPage";
import { OnboardingSalesPage } from "../pages/OnboardingSalesPage";
import { OnboardingClientPage } from "../pages/OnboardingClientPage";
import { ServiceDetailPage } from "../pages/ServiceDetailPage";
import { ServicesAdminPage } from "../pages/ServicesAdminPage";
import { ResolvedStorefrontDistributorsPage } from "../pages/ResolvedStorefrontDistributorsPage";
import { ResolvedStorefrontLandingPage } from "../pages/ResolvedStorefrontLandingPage";
import { ResolvedStorefrontPublicPage } from "../pages/ResolvedStorefrontPublicPage";
import { StoreServicesPage } from "../pages/StoreServicesPage";
import { StripeSettingsPage } from "../pages/StripeSettingsPage";
import { TenantDetailPage } from "../pages/TenantDetailPage";
import { TenantReportsOverviewPage } from "../pages/TenantReportsOverviewPage";
import { TenantSalesReportPage } from "../pages/TenantSalesReportPage";
import { TenantProductsReportPage } from "../pages/TenantProductsReportPage";
import { TenantLoyaltyReportPage } from "../pages/TenantLoyaltyReportPage";
import { TenantDistributorsReportPage } from "../pages/TenantDistributorsReportPage";
import { TenantLogisticsReportPage } from "../pages/TenantLogisticsReportPage";
import { TenantServicesReportPage } from "../pages/TenantServicesReportPage";
import { TenantMarketingInsightsPage } from "../pages/TenantMarketingInsightsPage";
import { TenantsPage } from "../pages/TenantsPage";
import { UsersAdminPage } from "../pages/UsersAdminPage";
import {
  BrandDistributorsChannelPage,
  BrandLandingChannelPage,
  BrandPosChannelPage,
  BrandPublicEcommerceChannelPage,
} from "../pages/BrandChannelPages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/comercia" element={<ComerciaLandingPage />} />
      <Route path="/comercia/precios" element={<ComerciaPreciosPage />} />
      <Route path="/comercia/marketing" element={<ComerciaMarketingPage />} />
      <Route path="/comercia/consultoria" element={<ComerciaConsultoriaPage />} />
      <Route path="/legal/privacidad" element={<PrivacyPolicyPage />} />
      <Route path="/legal/cookies" element={<CookiesPolicyPage />} />
      <Route path="/legal/proteccion-datos" element={<DataProtectionPolicyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/store/:tenantSlug" element={<ResolvedStorefrontPublicPage />} />
      <Route path="/store/:tenantSlug/landing" element={<ResolvedStorefrontLandingPage />} />
      <Route path="/store/:tenantSlug/product/:productId" element={<ProductDetailPage />} />
      <Route path="/store/:tenantSlug/services" element={<StoreServicesPage />} />
      <Route path="/store/:tenantSlug/service/:serviceId" element={<ServiceDetailPage />} />
      <Route path="/store/:tenantSlug/distribuidores" element={<ResolvedStorefrontDistributorsPage />} />
      <Route path="/store/:tenantSlug/distribuidores/registro" element={<DistributorRegistrationPage />} />
      <Route path="/store/:tenantSlug/distribuidores/login-placeholder" element={<DistributorLoginPlaceholderPage />} />
      <Route path="/pos/login-placeholder" element={<PosLoginPlaceholderPage />} />

      {/* â”€â”€ Plantillas de muestra (preview sin autenticaciÃ³n) â”€â”€ */}
      <Route path="/templates/tienda-publica" element={<StorePublicTemplate />} />
      <Route path="/templates/distribuidores" element={<StoreDistributorsTemplate />} />
      <Route path="/templates/pos" element={<StorePOSTemplate />} />
      <Route path="/templates/familia" element={<TemplateFamilyDemoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AdminLayout />}>
          <Route element={<RoleRoute allowedRoles={["tenant_admin", "reinpia_admin", "super_admin", "tenant_staff"]} />}>
            <Route index element={<DashboardPage />} />
            <Route path="admin/services" element={<ServicesAdminPage />} />
            <Route path="admin/catalog/bulk-upload" element={<CatalogBulkUploadPage />} />
            <Route path="admin/inventory" element={<InventoryPage />} />
            <Route path="admin/feedback" element={<FeedbackModerationPage />} />
            <Route path="admin/appointments" element={<AppointmentsAdminPage />} />
            <Route path="admin/addons/nfc" element={<NfcAddonPage />} />
            <Route path="admin/distributor-applications" element={<DistributorApplicationsAdminPage />} />
            <Route path="admin/distributors" element={<DistributorsAdminPage />} />
            <Route path="admin/recurring-orders" element={<RecurringOrdersAdminPage />} />
            <Route path="admin/logistics" element={<LogisticsAdminPage />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="pos/locations" element={<PosLocationsPage />} />
            <Route path="pos/sales" element={<PosSalesPage />} />
            <Route path="pos/customers" element={<PosCustomersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["tenant_admin", "reinpia_admin", "super_admin", "contador"]} />}>
            <Route path="admin/channels/landing" element={<BrandLandingChannelPage />} />
            <Route path="admin/channels/public" element={<BrandPublicEcommerceChannelPage />} />
            <Route path="admin/channels/distributors" element={<BrandDistributorsChannelPage />} />
            <Route path="admin/channels/pos" element={<BrandPosChannelPage />} />
            <Route path="admin/diagnostico-inteligente" element={<BrandDiagnosticsPage />} />
            <Route path="admin/users" element={<UsersAdminPage />} />
            <Route path="admin/language" element={<LanguageAdminPage />} />
            <Route path="admin/currency" element={<CurrencyAdminPage />} />
            <Route path="admin/branding" element={<BrandingEditorPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="admin/payments" element={<PaymentsAdminPage />} />
            <Route path="admin/loyalty" element={<LoyaltyProgramAdminPage />} />
            <Route path="admin/memberships" element={<MembershipPlansAdminPage />} />
            <Route path="admin/coupons" element={<CouponsAdminPage />} />
            <Route path="admin/banners" element={<BannersAdminPage />} />
            <Route path="admin/reviews" element={<ReviewsAdminPage />} />
            <Route path="admin/contracts" element={<ContractsAdminPage />} />
            <Route path="admin/settings/payments/stripe" element={<StripeSettingsPage />} />
            <Route path="admin/settings/payments/mercadopago" element={<MercadoPagoSettingsPage />} />
            <Route path="admin/reports" element={<TenantReportsOverviewPage />} />
            <Route path="admin/reports/sales" element={<TenantSalesReportPage />} />
            <Route path="admin/reports/products" element={<TenantProductsReportPage />} />
            <Route path="admin/reports/loyalty" element={<TenantLoyaltyReportPage />} />
            <Route path="admin/reports/distributors" element={<TenantDistributorsReportPage />} />
            <Route path="admin/reports/logistics" element={<TenantLogisticsReportPage />} />
            <Route path="admin/reports/services" element={<TenantServicesReportPage />} />
            <Route path="admin/reports/marketing" element={<TenantMarketingInsightsPage />} />
            <Route path="onboarding/sales" element={<OnboardingSalesPage />} />
            <Route path="onboarding/client" element={<OnboardingClientPage />} />
            <Route path="admin/automation" element={<AutomationAdminPage />} />
            <Route element={<RoleRoute allowedRoles={["reinpia_admin", "super_admin"]} />}>
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
              <Route path="tenants/:tenantId/branding" element={<BrandingEditorPage />} />
              <Route path="reinpia/dashboard" element={<ReinpiaDashboardPage />} />
              <Route path="reinpia/brands/new" element={<ReinpiaBrandsNewPage />} />
              <Route path="reinpia/brands/:tenantId/setup" element={<BrandSetupWizard />} />
              <Route path="reinpia/tenants" element={<ReinpiaTenantsPage />} />
              <Route path="reinpia/users" element={<UsersAdminPage />} />
              <Route path="reinpia/language" element={<LanguageAdminPage />} />
              <Route path="reinpia/currency" element={<CurrencyAdminPage />} />
              <Route path="reinpia/tenants/:tenantId" element={<ReinpiaTenantDetailPage />} />
              <Route path="reinpia/canales-creados" element={<ReinpiaCreatedChannelsPage />} />
              <Route path="reinpia/canales-creados/:tenantId/:channelKey" element={<ReinpiaCreatedChannelDetailPage />} />
              <Route path="reinpia/diagnosticos" element={<ReinpiaDiagnosticsPage />} />
              <Route path="reinpia/operations" element={<ReinpiaOperationsPage />} />
              <Route path="reinpia/logistics-services" element={<ReinpiaLogisticsServicesPage />} />
              <Route path="reinpia/reports" element={<ReinpiaReportsPage />} />
              <Route path="reinpia/reports/overview" element={<ReinpiaReportsOverviewPage />} />
              <Route path="reinpia/reports/growth" element={<ReinpiaGrowthReportPage />} />
              <Route path="reinpia/reports/leads" element={<ReinpiaLeadsReportPage />} />
              <Route path="reinpia/reports/marketing-opportunities" element={<ReinpiaMarketingOpportunitiesPage />} />
              <Route path="reinpia/commercial-inbox" element={<ReinpiaCommercialInboxPage />} />
              <Route path="reinpia/clientes-comerciales" element={<ReinpiaCommercialClientsPage />} />
              <Route path="reinpia/marketing/prospectos" element={<ReinpiaMarketingProspectsPage />} />
              <Route path="reinpia/alerts" element={<ReinpiaAlertsPage />} />
              <Route path="reinpia/security" element={<ReinpiaSecurityDashboardPage />} />
              <Route path="reinpia/security/alerts" element={<ReinpiaSecurityAlertsPage />} />
              <Route path="reinpia/security/rules" element={<ReinpiaSecurityRulesPage />} />
              <Route path="reinpia/security/blocked" element={<ReinpiaBlockedEntitiesPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["reinpia_admin", "super_admin", "contador"]} />}>
              <Route path="reinpia/payments" element={<ReinpiaPaymentsPage />} />
              <Route path="reinpia/commission-agents" element={<ReinpiaCommissionAgentsPage />} />
              <Route path="reinpia/reports/commissions" element={<ReinpiaCommissionsReportPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/comercia" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

