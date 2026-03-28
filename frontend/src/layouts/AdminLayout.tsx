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
  { labelKey: "nav.services", to: "/admin/services" },
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

const reinpiaItems = [
  { label: "RG Dashboard", to: "/reinpia/dashboard" },
  { label: "RG Tenants", to: "/reinpia/tenants" },
  { label: "RG Payments", to: "/reinpia/payments" },
  { label: "RG Operations", to: "/reinpia/operations" },
  { label: "RG Reports", to: "/reinpia/reports" },
  { label: "RG Rep Overview", to: "/reinpia/reports/overview" },
  { label: "RG Rep Growth", to: "/reinpia/reports/growth" },
  { label: "RG Rep Commissions", to: "/reinpia/reports/commissions" },
  { label: "RG Rep Leads", to: "/reinpia/reports/leads" },
  { label: "RG Rep Marketing", to: "/reinpia/reports/marketing-opportunities" },
  { label: "RG Agents", to: "/reinpia/commission-agents" },
  { label: "RG Alerts", to: "/reinpia/alerts" },
  { label: "RG Security", to: "/reinpia/security" },
  { label: "RG Sec Alerts", to: "/reinpia/security/alerts" },
  { label: "RG Sec Rules", to: "/reinpia/security/rules" },
  { label: "RG Blocked", to: "/reinpia/security/blocked" }
];

export function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>{t("app.title")}</h1>
        <p className="brand-subtitle">{t("app.subtitle")}</p>
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
                  {item.label}
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
