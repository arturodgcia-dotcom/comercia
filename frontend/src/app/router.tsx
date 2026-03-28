import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleRoute } from "../components/RoleRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { AppointmentsAdminPage } from "../pages/AppointmentsAdminPage";
import { BrandingEditorPage } from "../pages/BrandingEditorPage";
import { BannersAdminPage } from "../pages/BannersAdminPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { ComerciaLandingPage } from "../pages/ComerciaLandingPage";
import { CurrencyAdminPage } from "../pages/CurrencyAdminPage";
import { ContractsAdminPage } from "../pages/ContractsAdminPage";
import { CouponsAdminPage } from "../pages/CouponsAdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DistributorApplicationsAdminPage } from "../pages/DistributorApplicationsAdminPage";
import { DistributorLoginPlaceholderPage } from "../pages/DistributorLoginPlaceholderPage";
import { DistributorRegistrationPage } from "../pages/DistributorRegistrationPage";
import { DistributorsAdminPage } from "../pages/DistributorsAdminPage";
import { LoginPage } from "../pages/LoginPage";
import { LogisticsAdminPage } from "../pages/LogisticsAdminPage";
import { LoyaltyProgramAdminPage } from "../pages/LoyaltyProgramAdminPage";
import { MembershipPlansAdminPage } from "../pages/MembershipPlansAdminPage";
import { PaymentsAdminPage } from "../pages/PaymentsAdminPage";
import { PlansPage } from "../pages/PlansPage";
import { PosCustomersPage } from "../pages/PosCustomersPage";
import { PosLocationsPage } from "../pages/PosLocationsPage";
import { PosLoginPlaceholderPage } from "../pages/PosLoginPlaceholderPage";
import { PosPage } from "../pages/PosPage";
import { PosSalesPage } from "../pages/PosSalesPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { ProductsPage } from "../pages/ProductsPage";
import { RecurringOrdersAdminPage } from "../pages/RecurringOrdersAdminPage";
import { AutomationAdminPage } from "../pages/AutomationAdminPage";
import { ReinpiaDashboardPage } from "../pages/ReinpiaDashboardPage";
import { ReinpiaCommissionAgentsPage } from "../pages/ReinpiaCommissionAgentsPage";
import { ReinpiaOperationsPage } from "../pages/ReinpiaOperationsPage";
import { ReinpiaPaymentsPage } from "../pages/ReinpiaPaymentsPage";
import { ReinpiaReportsPage } from "../pages/ReinpiaReportsPage";
import { ReinpiaTenantDetailPage } from "../pages/ReinpiaTenantDetailPage";
import { ReinpiaTenantsPage } from "../pages/ReinpiaTenantsPage";
import { ReinpiaAlertsPage } from "../pages/ReinpiaAlertsPage";
import { ReviewsAdminPage } from "../pages/ReviewsAdminPage";
import { OnboardingSalesPage } from "../pages/OnboardingSalesPage";
import { OnboardingClientPage } from "../pages/OnboardingClientPage";
import { ServiceDetailPage } from "../pages/ServiceDetailPage";
import { ServicesAdminPage } from "../pages/ServicesAdminPage";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { StoreServicesPage } from "../pages/StoreServicesPage";
import { TenantDetailPage } from "../pages/TenantDetailPage";
import { TenantsPage } from "../pages/TenantsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/comercia" element={<ComerciaLandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/store/:tenantSlug" element={<StorefrontPage />} />
      <Route path="/store/:tenantSlug/product/:productId" element={<ProductDetailPage />} />
      <Route path="/store/:tenantSlug/services" element={<StoreServicesPage />} />
      <Route path="/store/:tenantSlug/service/:serviceId" element={<ServiceDetailPage />} />
      <Route path="/store/:tenantSlug/distribuidores" element={<StorefrontDistributorsPage />} />
      <Route path="/store/:tenantSlug/distribuidores/registro" element={<DistributorRegistrationPage />} />
      <Route path="/store/:tenantSlug/distribuidores/login-placeholder" element={<DistributorLoginPlaceholderPage />} />
      <Route path="/pos/login-placeholder" element={<PosLoginPlaceholderPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
          <Route path="tenants/:tenantId/branding" element={<BrandingEditorPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="admin/payments" element={<PaymentsAdminPage />} />
          <Route path="admin/loyalty" element={<LoyaltyProgramAdminPage />} />
          <Route path="admin/memberships" element={<MembershipPlansAdminPage />} />
          <Route path="admin/coupons" element={<CouponsAdminPage />} />
          <Route path="admin/banners" element={<BannersAdminPage />} />
          <Route path="admin/reviews" element={<ReviewsAdminPage />} />
          <Route path="admin/services" element={<ServicesAdminPage />} />
          <Route path="admin/appointments" element={<AppointmentsAdminPage />} />
          <Route path="admin/distributor-applications" element={<DistributorApplicationsAdminPage />} />
          <Route path="admin/distributors" element={<DistributorsAdminPage />} />
          <Route path="admin/contracts" element={<ContractsAdminPage />} />
          <Route path="admin/recurring-orders" element={<RecurringOrdersAdminPage />} />
          <Route path="admin/logistics" element={<LogisticsAdminPage />} />
          <Route path="admin/currency" element={<CurrencyAdminPage />} />
          <Route path="onboarding/sales" element={<OnboardingSalesPage />} />
          <Route path="onboarding/client" element={<OnboardingClientPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="pos/locations" element={<PosLocationsPage />} />
          <Route path="pos/sales" element={<PosSalesPage />} />
          <Route path="pos/customers" element={<PosCustomersPage />} />
          <Route path="admin/automation" element={<AutomationAdminPage />} />
          <Route element={<RoleRoute allowedRoles={["reinpia_admin"]} />}>
            <Route path="reinpia/dashboard" element={<ReinpiaDashboardPage />} />
            <Route path="reinpia/tenants" element={<ReinpiaTenantsPage />} />
            <Route path="reinpia/tenants/:tenantId" element={<ReinpiaTenantDetailPage />} />
            <Route path="reinpia/payments" element={<ReinpiaPaymentsPage />} />
            <Route path="reinpia/operations" element={<ReinpiaOperationsPage />} />
            <Route path="reinpia/reports" element={<ReinpiaReportsPage />} />
            <Route path="reinpia/commission-agents" element={<ReinpiaCommissionAgentsPage />} />
            <Route path="reinpia/alerts" element={<ReinpiaAlertsPage />} />
          </Route>
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
