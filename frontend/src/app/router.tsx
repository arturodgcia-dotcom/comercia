import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { BrandingEditorPage } from "../pages/BrandingEditorPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { PaymentsAdminPage } from "../pages/PaymentsAdminPage";
import { PlansPage } from "../pages/PlansPage";
import { ProductsPage } from "../pages/ProductsPage";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { TenantDetailPage } from "../pages/TenantDetailPage";
import { TenantsPage } from "../pages/TenantsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/store/:tenantSlug" element={<StorefrontPage />} />
      <Route path="/store/:tenantSlug/distribuidores" element={<StorefrontDistributorsPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
          <Route path="tenants/:tenantId/branding" element={<BrandingEditorPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="admin/payments" element={<PaymentsAdminPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
