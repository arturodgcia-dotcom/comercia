import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { api } from "../services/api";
import { BrandAdminSettings, Tenant } from "../types/domain";

type AppMode = "global" | "brand";
type NavItem = { label: string; to: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[]; roles?: string[] };

const ADMIN_ROLES = ["reinpia_admin", "super_admin", "tenant_admin", "tenant_staff", "contador", "soporte"];
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
    pathname.startsWith("/products")
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

function addonStatusLabel(status: string | undefined): string {
  const normalized = (status ?? "deshabilitado").toLowerCase();
  if (normalized === "activo") return "Disponible";
  if (normalized === "configurando") return "Requiere activacion";
  if (normalized === "suspendido") return "Suspendido";
  return "No contratado";
}

function isAddonContracted(status: string | undefined): boolean {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "activo" || normalized === "configurando" || normalized === "suspendido";
}

export function AdminLayout() {
  const { logout, user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = user?.role;
  const isSuperAdmin = userRole === "reinpia_admin" || userRole === "super_admin";
  const isGlobalOperator = isSuperAdmin || userRole === "contador";
  const canAccessAdmin = ADMIN_ROLES.includes(userRole ?? "");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = sessionStorage.getItem(STORAGE_MODE_KEY);
    return saved === "global" || saved === "brand" ? saved : "brand";
  });
  const globalHomePath = isSuperAdmin ? "/reinpia/dashboard" : "/reinpia/payments";

  useEffect(() => {
    if (!isGlobalOperator) {
      setMode("brand");
      setSelectedBrandId(user?.tenant_id ?? null);
      return;
    }
    if (userRole === "contador") {
      setMode("global");
      setSelectedBrandId(null);
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
  }, [isGlobalOperator, token, user?.tenant_id, userRole]);

  useEffect(() => {
    const inferred = resolveModeFromPath(location.pathname);
    if (!inferred) return;
    if (isGlobalOperator) {
      setMode(inferred);
      sessionStorage.setItem(STORAGE_MODE_KEY, inferred);
    }
  }, [isGlobalOperator, location.pathname]);

  useEffect(() => {
    if (userRole === "contador" && location.pathname.startsWith("/reinpia/dashboard")) {
      navigate("/reinpia/payments", { replace: true });
    }
  }, [location.pathname, navigate, userRole]);

  useEffect(() => {
    if (!token) return;
    const targetTenantId = isSuperAdmin ? selectedBrandId : user?.tenant_id;
    if (!targetTenantId) return;
    api.getBrandAdminSettings(token, targetTenantId).then(setBrandSettings).catch(() => setBrandSettings(null));
  }, [token, isSuperAdmin, selectedBrandId, user?.tenant_id]);

  useEffect(() => {
    if (!isGlobalOperator) return;
    sessionStorage.setItem(STORAGE_MODE_KEY, mode);
  }, [isGlobalOperator, mode]);

  useEffect(() => {
    if (!isSuperAdmin || !selectedBrandId) return;
    sessionStorage.setItem(STORAGE_BRAND_KEY, String(selectedBrandId));
  }, [isSuperAdmin, selectedBrandId]);

  const activeBrand = useMemo(() => tenants.find((item) => item.id === selectedBrandId) ?? null, [tenants, selectedBrandId]);
  const brandId = isSuperAdmin ? (selectedBrandId ?? 0) : (user?.tenant_id ?? 0);
  const logisticsLabel = `Logistica (${addonStatusLabel(brandSettings?.addon_logistics_status)})`;
  const workdayLabel = `Jornada laboral (${addonStatusLabel(brandSettings?.addon_workday_status)})`;
  const nfcLabel = `NFC / grabado / impresion (${addonStatusLabel(brandSettings?.addon_nfc_status)})`;

  const modeTitle = mode === "global" ? "Administración General de ComerCia" : "Panel de Operación de Marca";
  const modeHint = mode === "global" ? "Modo actual: Global ComerCia" : "Modo actual: Operación de Marca";
  const brandHint = activeBrand
    ? `Marca activa: ${activeBrand.name}`
    : brandId
      ? `Marca activa: Tenant #${brandId}`
      : "Marca activa: sin seleccionar";

  const globalSections: NavSection[] = [
    {
      title: "INICIO",
      roles: ["reinpia_admin", "super_admin", "contador"],
      items: [
        { label: "Dashboard global", to: "/reinpia/dashboard", roles: ["reinpia_admin", "super_admin"] },
        { label: "Resumen de clientes activos", to: "/reinpia/clientes-comerciales?view=resumen" },
        { label: "Alertas criticas", to: "/reinpia/alerts?severity=critical" },
        { label: "Consumo global IA", to: "/reinpia/clientes-comerciales?tab=tokens-ia" },
        { label: "Estado de soporte", to: "/reinpia/commercial-inbox" },
      ],
    },
    {
      title: "CREACIÓN",
      roles: ["reinpia_admin", "super_admin"],
      items: [
        { label: "Clientes principales", to: "/reinpia/clientes-comerciales?domain=creacion" },
        { label: "Nueva cuenta cliente", to: "/reinpia/clientes-comerciales?domain=creacion&action=new" },
        { label: "Marcas", to: "/reinpia/tenants?domain=creacion" },
        { label: "Nueva marca", to: "/reinpia/brands/new" },
        { label: "Wizard de configuración", to: "/reinpia/tenants?domain=wizard" },
        { label: "Activos iniciales", to: "/reinpia/tenants?domain=wizard&step=assets" },
        { label: "Branding inicial", to: "/reinpia/tenants?domain=wizard&step=branding" },
        { label: "Setup inicial de canales", to: "/reinpia/tenants?domain=wizard&step=channels" },
      ],
    },
    {
      title: "ADMINISTRACIÓN",
      roles: ["reinpia_admin", "super_admin"],
      items: [
        { label: "Clientes comerciales", to: "/reinpia/clientes-comerciales" },
        { label: "Marcas activas", to: "/reinpia/tenants?status=active" },
        { label: "Canales creados", to: "/reinpia/canales-creados" },
        { label: "Landing creadas", to: "/reinpia/canales-creados?channel=landing" },
        { label: "Ecommerce publicos creados", to: "/reinpia/canales-creados?channel=public" },
        { label: "Ecommerce distribuidores creados", to: "/reinpia/canales-creados?channel=distributors" },
        { label: "WebApps / POS creadas", to: "/reinpia/canales-creados?channel=pos" },
        { label: "Estados de publicación", to: "/reinpia/canales-creados?view=status" },
        { label: "Paises habilitados", to: "/reinpia/tenants?tab=countries" },
        { label: "Configuración internacional", to: "/reinpia/currency" },
      ],
    },
    {
      title: "FINANZAS Y CONTROL",
      roles: ["reinpia_admin", "super_admin", "contador"],
      items: [
        { label: "Pagos", to: "/reinpia/payments" },
        { label: "Suscripciones", to: "/reinpia/clientes-comerciales?tab=subscriptions" },
        { label: "Planes activos", to: "/reinpia/clientes-comerciales?tab=planes-addons" },
        { label: "Add-ons contratados", to: "/reinpia/clientes-comerciales?tab=addons" },
        { label: "Comisiones", to: "/reinpia/reports/commissions" },
        { label: "Facturación / contador", to: "/reinpia/payments?tab=accounting" },
        { label: "Limites por cliente", to: "/reinpia/clientes-comerciales?tab=limits" },
        { label: "Tokens IA", to: "/reinpia/clientes-comerciales?tab=tokens-ia" },
        { label: "Consumo IA", to: "/reinpia/clientes-comerciales?tab=ia-usage" },
        { label: "Bloqueos / desbloqueos llave IA", to: "/reinpia/clientes-comerciales?tab=ia-keys" },
      ],
    },
    {
      title: "OPERACIÓN INTERNA",
      roles: ["reinpia_admin", "super_admin"],
      items: [
        { label: "Alertas / Centinela", to: "/reinpia/alerts" },
        { label: "Seguridad", to: "/reinpia/security" },
        { label: "Soporte", to: "/reinpia/commercial-inbox" },
        { label: "Tickets", to: "/reinpia/commercial-inbox?tab=tickets" },
        { label: "Usuarios internos", to: "/reinpia/users" },
        { label: "Roles", to: "/reinpia/users?tab=roles" },
        { label: "Configuración global", to: "/reinpia/language" },
        { label: "Integraciones", to: "/reinpia/operations?tab=integrations" },
        { label: "Logs / auditoria", to: "/reinpia/operations?tab=auditoria" },
      ],
    },
  ];

  const brandSections: NavSection[] = useMemo(() => {
    const addonItems: NavItem[] = [{ label: "Expandir capacidad", to: "/" }];
    if (isAddonContracted(brandSettings?.addon_logistics_status)) {
      addonItems.push({ label: logisticsLabel, to: "/admin/logistics" });
    }
    if (isAddonContracted(brandSettings?.addon_workday_status)) {
      addonItems.push({ label: workdayLabel, to: "/admin/appointments" });
    }
    if (isAddonContracted(brandSettings?.addon_nfc_status)) {
      addonItems.push({
        label: nfcLabel,
        to: "/admin/addons/nfc",
        roles: ["tenant_admin", "reinpia_admin", "super_admin", "tenant_staff"],
      });
    }

    return [
      {
        title: "RESUMEN",
        roles: ADMIN_ROLES,
        items: [
          { label: "Resumen de marca", to: "/" },
          { label: "Plan activo y soporte", to: "/plans" },
        ],
      },
      {
        title: "MARCAS",
        roles: ADMIN_ROLES,
        items: [
          { label: "Ficha de marca activa", to: "/admin/branding", roles: ["tenant_admin", "reinpia_admin"] },
        ],
      },
      {
        title: "CANALES",
        roles: ADMIN_ROLES,
        items: [
          { label: "Landing", to: "/admin/channels/landing", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Ecommerce público", to: "/admin/channels/public", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Ecommerce distribuidores", to: "/admin/channels/distributors", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "WebApp / POS", to: "/admin/channels/pos", roles: ["tenant_admin", "reinpia_admin"] },
        ],
      },
      {
        title: "OPERACIÓN",
        roles: ADMIN_ROLES,
        items: [
          { label: "Productos", to: "/products" },
          { label: "Categorías", to: "/categories" },
          { label: "Banners y promociones", to: "/admin/banners", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Cupones", to: "/admin/coupons", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Distribuidores", to: "/admin/distributors" },
          { label: "Ventas POS", to: "/pos/sales" },
          { label: "Fidelización", to: "/admin/loyalty", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Configuración local", to: "/admin/currency", roles: ["tenant_admin", "reinpia_admin"] },
        ],
      },
      {
        title: "CONSUMO Y LÍMITES",
        roles: ADMIN_ROLES,
        items: [
          { label: "Consumo del plan", to: "/plans" },
          { label: "Usuarios", to: "/admin/users", roles: ["tenant_admin", "reinpia_admin", "tenant_staff"] },
          { label: "Carga masiva y stock", to: "/admin/catalog/bulk-upload" },
        ],
      },
      {
        title: "SOPORTE",
        roles: ADMIN_ROLES,
        items: [
          { label: "Soporte del plan", to: "/admin/contracts", roles: ["tenant_admin", "reinpia_admin"] },
          { label: "Diagnóstico inteligente", to: "/admin/diagnostico-inteligente", roles: ["tenant_admin", "reinpia_admin"] },
        ],
      },
      {
        title: "ADD-ONS",
        roles: ADMIN_ROLES,
        items: [{ label: "Expandir capacidad", to: "/plans" }, ...addonItems.filter((item) => item.label !== "Expandir capacidad")],
      },
      {
        title: "ALERTAS",
        roles: ADMIN_ROLES,
        items: [
          { label: "Alertas operativas", to: "/admin/automation", roles: ["tenant_admin", "reinpia_admin"] },
        ],
      },
    ];
  }, [brandSettings?.addon_logistics_status, brandSettings?.addon_nfc_status, brandSettings?.addon_workday_status, logisticsLabel, nfcLabel, workdayLabel]);

  const visibleSections = mode === "global" && isGlobalOperator ? globalSections : brandSections;
  const homePath = mode === "global" && isGlobalOperator ? globalHomePath : "/";

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
      navigate(globalHomePath);
      return;
    }
    navigate("/");
  };

  const onChangeBrand = (nextBrandId: number) => {
    setSelectedBrandId(nextBrandId);
    if (mode === "brand") {
      navigate("/");
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


