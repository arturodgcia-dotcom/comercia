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
      ? "Panel global de ComerCia"
      : ADMIN_ROLES.includes(userRole ?? "")
        ? "Panel de marca"
        : "Acceso comercial";

  const brandSections: NavSection[] = [
    {
      title: "Inicio",
      roles: ADMIN_ROLES,
      items: [{ label: "Dashboard", to: "/" }],
    },
    {
      title: "Comercial",
      roles: ADMIN_ROLES,
      items: [
        { label: "Landing", to: userRole === "reinpia_admin" ? "/reinpia/brands/new" : tenantId ? `/tenants/${tenantId}/branding` : "/tenants" },
        { label: "Ecommerce publico", to: "/products" },
        { label: "Ecommerce distribuidores", to: "/admin/distributors" },
        { label: t("nav.banners"), to: "/admin/banners" },
        { label: t("nav.coupons"), to: "/admin/coupons" },
      ],
    },
    {
      title: "Catalogo",
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.products"), to: "/products" },
        { label: t("nav.bulkUpload"), to: "/admin/catalog/bulk-upload" },
        { label: t("nav.categories"), to: "/categories" },
        { label: "Precios", to: "/admin/payments" },
        { label: "Stock", to: "/admin/inventory" },
      ],
    },
    {
      title: "Clientes",
      roles: ADMIN_ROLES,
      items: [
        { label: "Publico", to: "/pos/customers" },
        { label: t("nav.distributors"), to: "/admin/distributors" },
        { label: t("nav.memberships"), to: "/admin/memberships" },
        { label: "Retroalimentacion", to: "/admin/feedback" },
      ],
    },
    {
      title: "Operacion",
      roles: ADMIN_ROLES,
      items: [
        { label: t("nav.logistics"), to: "/admin/logistics" },
        { label: "Almacenes", to: "/admin/inventory" },
        { label: t("nav.services"), to: "/admin/services" },
        { label: t("nav.appointments"), to: "/admin/appointments" },
        { label: t("nav.recurring"), to: "/admin/recurring-orders" },
      ],
    },
    {
      title: "POS",
      roles: ADMIN_ROLES,
      items: [
        { label: "Puntos de venta", to: "/pos/locations" },
        { label: "Empleados", to: "/admin/distributors" },
        { label: "Credenciales", to: "/admin/loyalty" },
        { label: "Ventas POS", to: "/pos/sales" },
        { label: "Caja POS", to: "/pos" },
      ],
    },
    {
      title: "Reportes",
      roles: ADMIN_ROLES,
      items: [
        { label: "Ventas", to: "/admin/reports/sales" },
        { label: "Marketing", to: "/admin/reports/marketing" },
        { label: "Fidelizacion", to: "/admin/reports/loyalty" },
        { label: "Distribuidores", to: "/admin/reports/distributors" },
        { label: "Operacion", to: "/admin/reports/logistics" },
      ],
    },
    {
      title: "Configuracion",
      roles: ADMIN_ROLES,
      items: [
        { label: "Branding", to: tenantId ? `/tenants/${tenantId}/branding` : "/tenants" },
        { label: "Usuarios", to: "/tenants" },
        { label: "Pagos online (Stripe)", to: "/admin/settings/payments/stripe" },
        { label: "Pagos POS (Mercado Pago)", to: "/admin/settings/payments/mercadopago" },
        { label: t("nav.currency"), to: "/admin/currency" },
        { label: "Idioma", to: "/" },
        { label: "Automatizacion", to: "/admin/automation" },
      ],
    },
  ];

  const reinpiaSections: NavSection[] = [
    {
      title: "ComerCia global",
      roles: ["reinpia_admin"],
      items: [
        { label: t("nav.globalDashboard"), to: "/reinpia/dashboard" },
        { label: t("nav.newBrand"), to: "/reinpia/brands/new" },
        { label: t("nav.globalBrands"), to: "/reinpia/tenants" },
        { label: t("nav.globalPayments"), to: "/reinpia/payments" },
        { label: t("nav.globalOperations"), to: "/reinpia/operations" },
        { label: "Servicios logisticos", to: "/reinpia/logistics-services" },
      ],
    },
    {
      title: "Comercial global",
      roles: ["reinpia_admin"],
      items: [
        { label: t("nav.globalReports"), to: "/reinpia/reports" },
        { label: t("nav.globalGrowth"), to: "/reinpia/reports/growth" },
        { label: t("nav.globalCommissions"), to: "/reinpia/reports/commissions" },
        { label: t("nav.globalLeads"), to: "/reinpia/reports/leads" },
        { label: t("nav.globalMarketing"), to: "/reinpia/reports/marketing-opportunities" },
        { label: t("nav.globalAgents"), to: "/reinpia/commission-agents" },
        { label: t("nav.globalAlerts"), to: "/reinpia/alerts" },
      ],
    },
    {
      title: "Seguridad",
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
              <p className="nav-section-title">Acceso limitado</p>
              <NavLink to="/comercia" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>Landing ComerCia</NavLink>
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
            Volver
          </button>
          <div className="breadcrumbs">
            <NavLink to="/" className="crumb-link">inicio</NavLink>
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
