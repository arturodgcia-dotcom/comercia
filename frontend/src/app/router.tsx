import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RoleRoute } from "../components/RoleRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { AppointmentsAdminPage } from "../pages/AppointmentsAdminPage";
import { BrandingEditorPage } from "../pages/BrandingEditorPage";
import { BannersAdminPage } from "../pages/BannersAdminPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { ComerciaLandingPage } from "../pages/ComerciaLandingPage";
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
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { ProductsPage } from "../pages/ProductsPage";
import { RecurringOrdersAdminPage } from "../pages/RecurringOrdersAdminPage";
import { ReinpiaDashboardPage } from "../pages/ReinpiaDashboardPage";
import { ReinpiaOperationsPage } from "../pages/ReinpiaOperationsPage";
import { ReinpiaPaymentsPage } from "../pages/ReinpiaPaymentsPage";
import { ReinpiaReportsPage } from "../pages/ReinpiaReportsPage";
import { ReinpiaTenantDetailPage } from "../pages/ReinpiaTenantDetailPage";
import { ReinpiaTenantsPage } from "../pages/ReinpiaTenantsPage";
import { ReviewsAdminPage } from "../pages/ReviewsAdminPage";
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
          <Route element={<RoleRoute allowedRoles={["reinpia_admin"]} />}>
            <Route path="reinpia/dashboard" element={<ReinpiaDashboardPage />} />
            <Route path="reinpia/tenants" element={<ReinpiaTenantsPage />} />
            <Route path="reinpia/tenants/:tenantId" element={<ReinpiaTenantDetailPage />} />
            <Route path="reinpia/payments" element={<ReinpiaPaymentsPage />} />
            <Route path="reinpia/operations" element={<ReinpiaOperationsPage />} />
            <Route path="reinpia/reports" element={<ReinpiaReportsPage />} />
          </Route>
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
