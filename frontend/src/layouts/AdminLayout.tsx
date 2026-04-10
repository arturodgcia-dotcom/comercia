import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { api } from "../services/api";
import { Tenant } from "../types/domain";

type AppMode = "global" | "brand";
type NavItem = { label: string; to: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const ADMIN_ROLES = ["reinpia_admin", "tenant_admin", "tenant_staff"];
const STORAGE_MODE_KEY = "comercia_admin_mode";
const STORAGE_BRAND_KEY = "comercia_admin_brand_id";

function canView(userRole: string | undefined, roles?: string[]) {
  if (!roles || roles.length === 0) return true;
  return roles.includes(userRole ?? "");
}

function resolveModeFromPath(pathname: string): AppMode | null {
  if (pathname.startsWith("/reinpia")) return "global";
  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/tenants")
  ) {
    return "brand";
  }
  return null;
}

function humanizePath(part: string): string {
  const normalized = decodeURIComponent(part).replace(/-/g, " ");
  if (/^\d+$/.test(normalized)) return `#${normalized}`;
  return normalized;
}

export function AdminLayout() {
  const { logout, user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = user?.role;
  const isSuperAdmin = userRole === "reinpia_admin";
  const canAccessAdmin = ADMIN_ROLES.includes(userRole ?? "");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = sessionStorage.getItem(STORAGE_MODE_KEY);
    return saved === "global" || saved === "brand" ? saved : "brand";
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      setMode("brand");
      setSelectedBrandId(user?.tenant_id ?? null);
      return;
    }
    if (!token) return;
    api
      .getTenants(token)
      .then((rows) => {
        setTenants(rows);
        const saved = Number(sessionStorage.getItem(STORAGE_BRAND_KEY) ?? "");
        const fallback = Number.isFinite(saved) && rows.some((item) => item.id === saved) ? saved : rows[0]?.id ?? null;
        setSelectedBrandId((current) => current ?? fallback);
      })
      .catch(() => {
        setTenants([]);
      });
  }, [isSuperAdmin, token, user?.tenant_id]);

  useEffect(() => {
    const inferred = resolveModeFromPath(location.pathname);
    if (!inferred) return;
    if (isSuperAdmin) {
      setMode(inferred);
      sessionStorage.setItem(STORAGE_MODE_KEY, inferred);
    }
  }, [isSuperAdmin, location.pathname]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    sessionStorage.setItem(STORAGE_MODE_KEY, mode);
  }, [isSuperAdmin, mode]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedBrandId) return;
    sessionStorage.setItem(STORAGE_BRAND_KEY, String(selectedBrandId));
  }, [isSuperAdmin, selectedBrandId]);

  const activeBrand = useMemo(() => tenants.find((item) => item.id === selectedBrandId) ?? null, [tenants, selectedBrandId]);
  const brandId = isSuperAdmin ? (selectedBrandId ?? 0) : (user?.tenant_id ?? 0);

  const modeTitle = mode === "global" ? "Administración General de ComerCia" : "Panel de Operación de Marca";
  const modeHint = mode === "global" ? "Modo actual: Global ComerCia" : "Modo actual: Operación de Marca";
  const brandHint = activeBrand
    ? `Marca activa: ${activeBrand.name}`
    : brandId
      ? `Marca activa: Tenant #${brandId}`
      : "Marca activa: sin seleccionar";

  const globalSections: NavSection[] = [
    {
      title: "INICIO GLOBAL",
      roles: ["reinpia_admin"],
      items: [{ label: "Dashboard global", to: "/reinpia/dashboard" }],
    },
    {
      title: "COMERCIAL GLOBAL",
      roles: ["reinpia_admin"],
      items: [
        { label: "Landing principal ComerCia", to: "/comercia" },
        { label: "Planes comerciales", to: "/plans" },
        { label: "Lía / asistente comercial", to: "/comercia" },
        { label: "Leads", to: "/reinpia/reports/leads" },
        { label: "Diagnósticos", to: "/reinpia/diagnosticos" },
        { label: "Contactos", to: "/reinpia/commercial-inbox" },
        { label: "Prospectos MKT", to: "/reinpia/marketing/prospectos" },
        { label: "Clientes comerciales", to: "/reinpia/clientes-comerciales" },
        { label: "Marketing global", to: "/reinpia/reports/marketing-opportunities" },
        { label: "Comisionistas", to: "/reinpia/commission-agents" },
        { label: "Alertas", to: "/reinpia/alerts" },
      ],
    },
    {
      title: "MARCAS Y ACTIVACIÓN",
      roles: ["reinpia_admin"],
      items: [
        { label: "Nueva marca", to: "/reinpia/brands/new" },
        { label: "Marcas", to: "/reinpia/tenants" },
        { label: "Workflow de activación", to: "/reinpia/tenants" },
        { label: "Global pagos", to: "/reinpia/payments" },
        { label: "Global operación", to: "/reinpia/operations" },
      ],
    },
    {
      title: "OPERACIÓN GLOBAL",
      roles: ["reinpia_admin"],
      items: [
        { label: "Servicios logísticos", to: "/reinpia/logistics-services" },
        { label: "Operación global", to: "/reinpia/operations" },
        { label: "Citas globales", to: "/reinpia/operations" },
        { label: "Recurrencia global", to: "/reinpia/operations" },
      ],
    },
    {
      title: "FINANZAS Y COBROS",
      roles: ["reinpia_admin"],
      items: [
        { label: "Global pagos", to: "/reinpia/payments" },
        { label: "Comisiones", to: "/reinpia/reports/commissions" },
        { label: "Monedas y tipos de cambio", to: "/reinpia/currency" },
        { label: "Facturación servicios adicionales", to: "/reinpia/logistics-services" },
      ],
    },
    {
      title: "CONFIGURACIÓN GENERAL",
      roles: ["reinpia_admin"],
      items: [
        { label: "Branding base", to: "/reinpia/brands/new" },
        { label: "Idiomas", to: "/reinpia/language" },
        { label: "Automatización", to: "/admin/automation" },
        { label: "Usuarios internos", to: "/reinpia/users" },
        { label: "Roles y permisos", to: "/reinpia/security/rules" },
        { label: "Políticas y legales", to: "/legal/privacidad" },
        { label: "Integraciones globales", to: "/admin/settings/payments/stripe" },
      ],
    },
    {
      title: "REPORTES GLOBALES",
      roles: ["reinpia_admin"],
      items: [
        { label: "Reportes", to: "/reinpia/reports" },
        { label: "Crecimiento", to: "/reinpia/reports/growth" },
        { label: "Ventas globales", to: "/reinpia/payments" },
        { label: "Marketing global", to: "/reinpia/reports/marketing-opportunities" },
        { label: "Fidelización global", to: "/reinpia/reports/overview" },
        { label: "Distribuidores global", to: "/reinpia/operations" },
        { label: "Operación global", to: "/reinpia/operations" },
      ],
    },
  ];

  const brandSections: NavSection[] = [
    {
      title: "INICIO DE MARCA",
      roles: ADMIN_ROLES,
      items: [{ label: "Dashboard marca", to: "/" }],
    },
    {
      title: "COMERCIAL",
      roles: ADMIN_ROLES,
      items: [
        { label: "Landing de la marca", to: "/admin/channels/landing", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Ecommerce público", to: "/admin/channels/public", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Ecommerce distribuidores", to: "/admin/channels/distributors", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Diagnóstico inteligente", to: "/admin/diagnostico-inteligente", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Banners", to: "/admin/banners", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Cupones", to: "/admin/coupons", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Promociones", to: "/admin/banners", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Retroalimentación", to: "/admin/feedback" },      ],
    },
    {
      title: "CATÁLOGO",
      roles: ADMIN_ROLES,
      items: [
        { label: "Productos", to: "/products" },
        { label: "Servicios", to: "/admin/services" },
        { label: "Categorías", to: "/categories" },
        { label: "Precios", to: "/admin/payments", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Carga masiva", to: "/admin/catalog/bulk-upload" },
        { label: "Stock", to: "/admin/inventory" },
        { label: "Sincronización Stripe", to: "/admin/settings/payments/stripe", roles: ["tenant_admin", "reinpia_admin"] },
      ],
    },
    {
      title: "CLIENTES",
      roles: ADMIN_ROLES,
      items: [
        { label: "Público", to: "/pos/customers" },
        { label: "Distribuidores", to: "/admin/distributors" },
        { label: "Membresías", to: "/admin/memberships", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Credenciales", to: "/admin/loyalty", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Historial / solicitudes", to: "/admin/distributor-applications" },
      ],
    },
    {
      title: "OPERACIÓN",
      roles: ADMIN_ROLES,
      items: [
        { label: "Logística", to: "/admin/logistics" },
        { label: "Almacenes", to: "/admin/logistics" },
        { label: "Citas", to: "/admin/appointments" },
        { label: "Recurrencia", to: "/admin/recurring-orders" },
        { label: "Pedidos / entregas", to: "/admin/logistics" },
      ],
    },
    {
      title: "POS / WEBAPP",
      roles: ADMIN_ROLES,
      items: [
        { label: "POS / WebApp", to: "/admin/channels/pos", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Puntos de venta", to: "/pos/locations" },
        { label: "Caja POS", to: "/pos" },
        { label: "Empleados", to: "/pos/locations" },
        { label: "Ventas POS", to: "/pos/sales" },
      ],
    },
    {
      title: "CONFIGURACIÓN DE MARCA",
      roles: ADMIN_ROLES,
      items: [
        { label: "Branding", to: "/admin/branding", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Usuarios", to: "/admin/users", roles: ["tenant_admin", "reinpia_admin", "tenant_staff"] },
        { label: "Pagos online (Stripe)", to: "/admin/settings/payments/stripe", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Pagos POS (Mercado Pago)", to: "/admin/settings/payments/mercadopago", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Moneda de operación", to: "/admin/currency", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Idioma de la tienda", to: "/admin/language", roles: ["tenant_admin", "reinpia_admin", "tenant_staff"] },
        { label: "Automatización de marca", to: "/admin/automation", roles: ["tenant_admin", "reinpia_admin"] },
      ],
    },
    {
      title: "REPORTES DE MARCA",
      roles: ADMIN_ROLES,
      items: [
        { label: "Ventas", to: "/admin/reports/sales", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Marketing", to: "/admin/reports/marketing", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Fidelización", to: "/admin/reports/loyalty", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Distribuidores", to: "/admin/reports/distributors", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "Operación", to: "/admin/reports/logistics", roles: ["tenant_admin", "reinpia_admin"] },
        { label: "POS", to: "/pos/sales" },
      ],
    },
  ];

  const visibleSections = mode === "global" && isSuperAdmin ? globalSections : brandSections;
  const homePath = mode === "global" && isSuperAdmin ? "/reinpia/dashboard" : "/";

  const pathParts = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const path = `/${pathParts.slice(0, index + 1).join("/")}`;
    return {
      label: humanizePath(part),
      path,
    };
  });

  const onChangeMode = (nextMode: AppMode) => {
    setMode(nextMode);
    if (nextMode === "global") {
      navigate("/reinpia/dashboard");
      return;
    }
    navigate("/");
  };

  const onChangeBrand = (nextBrandId: number) => {
    setSelectedBrandId(nextBrandId);
    if (mode === "brand") {
      navigate(`/tenants/${nextBrandId}/branding`);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>ComerCia</h1>
        <p className="brand-subtitle">{modeTitle}</p>
        <p className="sidebar-user">{user?.full_name}</p>
        <p className="sidebar-role">{user?.role}</p>

        <div className="context-panel">
          <p className="context-badge">{modeHint}</p>
          <p className="context-brand">{brandHint}</p>
          {isSuperAdmin ? (
            <>
              <label className="context-label" htmlFor="admin-mode-select">Contexto</label>
              <select id="admin-mode-select" value={mode} onChange={(e) => onChangeMode(e.target.value as AppMode)}>
                <option value="global">Global ComerCia</option>
                <option value="brand">Marca activa</option>
              </select>
              <label className="context-label" htmlFor="brand-select">Marca activa</label>
              <select
                id="brand-select"
                value={selectedBrandId ?? ""}
                onChange={(e) => onChangeBrand(Number(e.target.value))}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>

        <LanguageSelector />
        <p className="muted" style={{ color: "#b8cae9", fontSize: "12px", margin: "8px 0 12px" }}>
          Idioma: cambia todo el panel al idioma seleccionado.
        </p>

        <nav className="nav-sections">
          {visibleSections
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

          {!canAccessAdmin ? (
            <section>
              <p className="nav-section-title">Acceso limitado</p>
              <NavLink to="/comercia" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Landing ComerCia
              </NavLink>
            </section>
          ) : null}
        </nav>
        <button className="button button-outline" onClick={logout} type="button">
          Cerrar sesión
        </button>
      </aside>
      <main className="content">
        <div className="content-topbar">
          <button className="button button-outline" type="button" onClick={() => navigate(-1)}>
            Volver
          </button>
          <div className="breadcrumbs">
            <NavLink to={homePath} className="crumb-link">inicio</NavLink>
            {breadcrumbs.map((crumb) => (
              <NavLink key={crumb.path} to={crumb.path} className="crumb-link">
                / {crumb.label}
              </NavLink>
            ))}
          </div>
          <div className="context-top-indicator">
            <span>{mode === "global" ? "Administración General de ComerCia" : "Panel de Operación de Marca"}</span>
            <span>{brandHint}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}


