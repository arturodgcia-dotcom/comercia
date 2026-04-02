import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "react-i18next";

type NavItem = { label: string; to: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const ADMIN_ROLES = ["reinpia_admin", "tenant_admin", "tenant_staff"];

function canView(userRole: string | undefined, roles?: string[]) {
  if (!roles || roles.length === 0) return true;
  return roles.includes(userRole ?? "");
}

export function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = user?.role;
  const tenantId = user?.tenant_id ?? 0;

  const platformSubtitle =
    userRole === "reinpia_admin"
      ? t("nav.globalPanel")
      : ADMIN_ROLES.includes(userRole ?? "")
        ? t("nav.brandPanel")
        : t("nav.commercialAccess");

  const brandSections: NavSection[] = [
    {
      title: t("nav.sectionStart"),
      roles: ADMIN_ROLES,
      items: [{ label: t("nav.dashboard"), to: "/" }],
    },
    {
      title: t("nav.sectionCommercial"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.landing"), to: userRole === "reinpia_admin" ? "/reinpia/brands/new" : tenantId ? `/tenants/${tenantId}/branding` : "/tenants" },
        { label: t("nav.publicEcommerce"), to: "/admin/reports/sales" },
        { label: t("nav.distributorsEcommerce"), to: "/admin/reports/distributors" },
        { label: t("nav.banners"), to: "/admin/banners", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.coupons"), to: "/admin/coupons", roles: ["tenant_admin", "reinpia_admin"] },
      ],
    },
    {
      title: t("nav.sectionCatalog"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.products"), to: "/products" },
        { label: t("nav.bulkUpload"), to: "/admin/catalog/bulk-upload" },
        { label: t("nav.categories"), to: "/categories" },
        { label: t("nav.prices"), to: "/admin/payments", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.stock"), to: "/admin/inventory" },
      ],
    },
    {
      title: t("nav.sectionClients"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.publicClients"), to: "/pos/customers", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.distributors"), to: "/admin/distributors" },
        { label: t("nav.memberships"), to: "/admin/memberships", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.feedback"), to: "/admin/feedback" },
      ],
    },
    {
      title: t("nav.sectionOperation"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.logistics"), to: "/admin/logistics" },
        { label: t("nav.services"), to: "/admin/services" },
        { label: t("nav.appointments"), to: "/admin/appointments" },
        { label: t("nav.recurring"), to: "/admin/recurring-orders" },
      ],
    },
    {
      title: t("nav.sectionPOS"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.posSales"), to: "/pos/locations" },
        { label: t("nav.employees"), to: "/pos/locations", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.credentials"), to: "/admin/loyalty", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.posSales"), to: "/pos/sales" },
        { label: t("nav.posRegister"), to: "/pos" },
      ],
    },
    {
      title: t("nav.sectionReports"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.salesReport"), to: "/admin/reports/sales" },
        { label: t("nav.marketingReport"), to: "/admin/reports/marketing" },
        { label: t("nav.loyaltyReport"), to: "/admin/reports/loyalty", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.distributorsReport"), to: "/admin/reports/distributors" },
        { label: t("nav.operationReport"), to: "/admin/reports/logistics" },
      ],
    },
    {
      title: t("nav.sectionSettings"),
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.branding"), to: tenantId ? `/tenants/${tenantId}/branding` : "/tenants", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.users"), to: "/tenants", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.paymentsStripe"), to: "/admin/settings/payments/stripe", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.paymentsMercadoPago"), to: "/admin/settings/payments/mercadopago", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.currency"), to: "/admin/currency", roles: ["tenant_admin", "reinpia_admin"] },
        { label: t("nav.language"), to: "/" },
        { label: t("nav.automation"), to: "/admin/automation", roles: ["tenant_admin", "reinpia_admin"] },
      ],
    },
  ];

  const reinpiaSections: NavSection[] = [
    {
      title: t("nav.sectionReinpiaGlobal"),
      roles: ["reinpia_admin"],
      items: [
        { label: t("nav.globalDashboard"), to: "/reinpia/dashboard" },
        { label: t("nav.newBrand"), to: "/reinpia/brands/new" },
        { label: t("nav.globalBrands"), to: "/reinpia/tenants" },
        { label: t("nav.globalPayments"), to: "/reinpia/payments" },
        { label: t("nav.globalOperations"), to: "/reinpia/operations" },
        { label: t("nav.logisticsServices"), to: "/reinpia/logistics-services" },
      ],
    },
    {
      title: t("nav.sectionCommercialGlobal"),
      roles: ["reinpia_admin"],
      items: [
        { label: t("nav.globalReports"), to: "/reinpia/reports" },
        { label: t("nav.globalGrowth"), to: "/reinpia/reports/growth" },
        { label: t("nav.globalCommissions"), to: "/reinpia/reports/commissions" },
        { label: t("nav.globalLeads"), to: "/reinpia/reports/leads" },
        { label: t("nav.globalMarketing"), to: "/reinpia/reports/marketing-opportunities" },
        { label: t("nav.globalAgents"), to: "/reinpia/commission-agents" },
        { label: t("nav.commercialInbox"), to: "/reinpia/commercial-inbox" },
        { label: t("nav.globalAlerts"), to: "/reinpia/alerts" },
      ],
    },
    {
      title: t("nav.sectionSecurity"),
      roles: ["reinpia_admin"],
      items: [
        { label: t("nav.globalSecurity"), to: "/reinpia/security" },
        { label: t("nav.globalSecurityAlerts"), to: "/reinpia/security/alerts" },
        { label: t("nav.globalSecurityRules"), to: "/reinpia/security/rules" },
        { label: t("nav.globalBlocked"), to: "/reinpia/security/blocked" },
      ],
    },
  ];

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = `/${pathParts.slice(0, index + 1).join("/")}`;
    return {
      label: decodeURIComponent(part).replace(/-/g, " "),
      path,
    };
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>{t("app.title")}</h1>
        <p className="brand-subtitle">{platformSubtitle}</p>
        <p className="sidebar-user">{user?.full_name}</p>
        <p className="sidebar-role">{user?.role}</p>
        <LanguageSelector />
        <p className="muted" style={{ color: "#b8cae9", fontSize: "12px", margin: "8px 0 12px" }}>
          {t("nav.languageHint")}
        </p>
        <nav className="nav-sections">
          {brandSections
            .filter((section) => canView(userRole, section.roles))
            .map((section) => (
              <section key={section.title}>
                <p className="nav-section-title">{section.title}</p>
                {section.items
                  .filter((item) => canView(userRole, item.roles))
                  .map((item) => (
                    <NavLink
                      key={item.to + item.label}
                      to={item.to}
                      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                      end={item.to === "/"}
                    >
                      {item.label}
                    </NavLink>
                  ))}
              </section>
            ))}

          {reinpiaSections
            .filter((section) => canView(userRole, section.roles))
            .map((section) => (
              <section key={section.title}>
                <p className="nav-section-title">{section.title}</p>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </section>
            ))}

          {!ADMIN_ROLES.includes(userRole ?? "") ? (
            <section>
              <p className="nav-section-title">{t("nav.limitedAccess")}</p>
              <NavLink to="/comercia" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                {t("nav.landingComercia")}
              </NavLink>
            </section>
          ) : null}
        </nav>
        <button className="button button-outline" onClick={logout} type="button">
          {t("common.logout")}
        </button>
      </aside>
      <main className="content">
        <div className="content-topbar">
          <button className="button button-outline" type="button" onClick={() => navigate(-1)}>
            {t("nav.back")}
          </button>
          <div className="breadcrumbs">
            <NavLink to="/" className="crumb-link">{t("nav.home")}</NavLink>
            {breadcrumbs.map((crumb) => (
              <NavLink key={crumb.path} to={crumb.path} className="crumb-link">
                / {crumb.label}
              </NavLink>
            ))}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
