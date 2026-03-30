import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "react-i18next";

const navItems: Array<{ labelKey: string; to: string; roles?: string[] }> = [
  { labelKey: "nav.dashboard", to: "/" },
  { labelKey: "nav.tenants", to: "/tenants" },
  { labelKey: "nav.plans", to: "/plans" },
  { labelKey: "nav.payments", to: "/admin/payments" },
  { labelKey: "nav.loyalty", to: "/admin/loyalty" },
  { labelKey: "nav.memberships", to: "/admin/memberships" },
  { labelKey: "nav.coupons", to: "/admin/coupons" },
  { labelKey: "nav.banners", to: "/admin/banners" },
  { labelKey: "nav.reviews", to: "/admin/reviews" },
  { labelKey: "nav.feedback", to: "/admin/feedback" },
  { labelKey: "nav.services", to: "/admin/services" },
  { labelKey: "nav.bulkUpload", to: "/admin/catalog/bulk-upload" },
  { labelKey: "nav.inventory", to: "/admin/inventory" },
  { labelKey: "nav.appointments", to: "/admin/appointments" },
  { labelKey: "nav.distApps", to: "/admin/distributor-applications" },
  { labelKey: "nav.distributors", to: "/admin/distributors" },
  { labelKey: "nav.contracts", to: "/admin/contracts" },
  { labelKey: "nav.recurring", to: "/admin/recurring-orders" },
  { labelKey: "nav.logistics", to: "/admin/logistics" },
  { labelKey: "nav.categories", to: "/categories" },
  { labelKey: "nav.products", to: "/products" },
  { labelKey: "nav.currency", to: "/admin/currency" },
  { labelKey: "nav.reports", to: "/admin/reports", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportSales", to: "/admin/reports/sales", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportProducts", to: "/admin/reports/products", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportLoyalty", to: "/admin/reports/loyalty", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportDistributors", to: "/admin/reports/distributors", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportLogistics", to: "/admin/reports/logistics", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportServices", to: "/admin/reports/services", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.reportMarketing", to: "/admin/reports/marketing", roles: ["tenant_admin", "tenant_staff", "reinpia_admin"] },
  { labelKey: "nav.onboardingSales", to: "/onboarding/sales" },
  { labelKey: "nav.onboardingClient", to: "/onboarding/client" },
  { labelKey: "nav.pos", to: "/pos" },
  { labelKey: "nav.automation", to: "/admin/automation" }
];

const reinpiaItems: Array<{ labelKey: string; to: string }> = [
  { labelKey: "nav.globalDashboard", to: "/reinpia/dashboard" },
  { labelKey: "nav.newBrand", to: "/reinpia/brands/new" },
  { labelKey: "nav.globalBrands", to: "/reinpia/tenants" },
  { labelKey: "nav.globalPayments", to: "/reinpia/payments" },
  { labelKey: "nav.globalOperations", to: "/reinpia/operations" },
  { labelKey: "nav.globalReports", to: "/reinpia/reports" },
  { labelKey: "nav.globalGrowth", to: "/reinpia/reports/growth" },
  { labelKey: "nav.globalCommissions", to: "/reinpia/reports/commissions" },
  { labelKey: "nav.globalLeads", to: "/reinpia/reports/leads" },
  { labelKey: "nav.globalMarketing", to: "/reinpia/reports/marketing-opportunities" },
  { labelKey: "nav.globalAgents", to: "/reinpia/commission-agents" },
  { labelKey: "nav.globalAlerts", to: "/reinpia/alerts" },
  { labelKey: "nav.globalSecurity", to: "/reinpia/security" },
  { labelKey: "nav.globalSecurityAlerts", to: "/reinpia/security/alerts" },
  { labelKey: "nav.globalSecurityRules", to: "/reinpia/security/rules" },
  { labelKey: "nav.globalBlocked", to: "/reinpia/security/blocked" }
];

export function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const platformSubtitle =
    user?.role === "reinpia_admin"
      ? "Plataforma madre: gestión global de marcas"
      : "Panel de marca cliente";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>{t("app.title")}</h1>
        <p className="brand-subtitle">{platformSubtitle}</p>
        <p className="sidebar-user">{user?.full_name}</p>
        <p className="sidebar-role">{user?.role}</p>
        <LanguageSelector />
        <nav>
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.role ?? ""))
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end={item.to === "/"}
            >
              {t(item.labelKey)}
            </NavLink>
            ))}
          {user?.role === "reinpia_admin"
            ? reinpiaItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  {t(item.labelKey)}
                </NavLink>
              ))
            : null}
        </nav>
        <button className="button button-outline" onClick={logout} type="button">
          {t("common.logout")}
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
