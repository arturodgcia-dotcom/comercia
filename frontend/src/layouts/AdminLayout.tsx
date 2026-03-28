import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "react-i18next";

const navItems = [
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
  { label: "RG Agents", to: "/reinpia/commission-agents" },
  { label: "RG Alerts", to: "/reinpia/alerts" }
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
          {navItems.map((item) => (
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
