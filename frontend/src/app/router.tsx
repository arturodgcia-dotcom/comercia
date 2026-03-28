import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AdminLayout } from "../layouts/AdminLayout";
import { BrandingEditorPage } from "../pages/BrandingEditorPage";
import { BannersAdminPage } from "../pages/BannersAdminPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { CouponsAdminPage } from "../pages/CouponsAdminPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { LoyaltyProgramAdminPage } from "../pages/LoyaltyProgramAdminPage";
import { MembershipPlansAdminPage } from "../pages/MembershipPlansAdminPage";
import { PaymentsAdminPage } from "../pages/PaymentsAdminPage";
import { PlansPage } from "../pages/PlansPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ReviewsAdminPage } from "../pages/ReviewsAdminPage";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { TenantDetailPage } from "../pages/TenantDetailPage";
import { TenantsPage } from "../pages/TenantsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/store/:tenantSlug" element={<StorefrontPage />} />
      <Route path="/store/:tenantSlug/product/:productId" element={<ProductDetailPage />} />
      <Route path="/store/:tenantSlug/distribuidores" element={<StorefrontDistributorsPage />} />

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
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
