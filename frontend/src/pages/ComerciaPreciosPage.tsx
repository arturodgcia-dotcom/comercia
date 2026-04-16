import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { api } from "../services/api";
import { CommercialAddon, CommercialPlan } from "../types/domain";
import "./ComerciaLandingPage.css";

const FALLBACK_PLANS: CommercialPlan[] = [
  {
    id: "fixed_subscription_basic",
    code: "basic_fixed",
    display_name: "Basico sin comision",
    name: "Basico sin comision",
    tier: "basic",
    billing_model: "fixed_subscription",
    commission_enabled: false,
    commission_percentage: "0.00",
    monthly_price_mxn: "3500.00",
    total_price_mxn: "4060.00",
    stripe_price_id: "",
    support: "48h por correo",
    limits: { products_max: 50, users_max: 2, branches_max: 1, ia_tokens_total: 200 },
    price_without_tax_mxn: "3500.00",
    tax_rate: "0.16",
    tax_amount_mxn: "560.00",
    price_with_tax_mxn: "4060.00",
  },
  {
    id: "commission_subscription_basic",
    code: "basic_commission",
    display_name: "Basico con comision",
    name: "Basico con comision",
    tier: "basic",
    billing_model: "commission_based",
    commission_enabled: true,
    commission_percentage: "5.00",
    monthly_price_mxn: "2290.00",
    total_price_mxn: "2656.40",
    stripe_price_id: "",
    support: "48h por correo",
    limits: { products_max: 50, users_max: 2, branches_max: 1, ia_tokens_total: 200 },
    price_without_tax_mxn: "2290.00",
    tax_rate: "0.16",
    tax_amount_mxn: "366.40",
    price_with_tax_mxn: "2656.40",
  },
  {
    id: "commission_subscription_growth",
    code: "growth_commission",
    display_name: "Growth con comision",
    name: "Growth con comision",
    tier: "growth",
    billing_model: "commission_based",
    commission_enabled: true,
    commission_percentage: "4.50",
    monthly_price_mxn: "4290.00",
    total_price_mxn: "4976.40",
    stripe_price_id: "",
    support: "Prioritario 24h",
    limits: { products_max: 300, users_max: 5, branches_max: 3, ia_tokens_total: 1050 },
    price_without_tax_mxn: "4290.00",
    tax_rate: "0.16",
    tax_amount_mxn: "686.40",
    price_with_tax_mxn: "4976.40",
  },
  {
    id: "commission_subscription_premium",
    code: "premium_commission",
    display_name: "Premium con comision",
    name: "Premium con comision",
    tier: "premium",
    billing_model: "commission_based",
    commission_enabled: true,
    commission_percentage: "4.00",
    monthly_price_mxn: "7290.00",
    total_price_mxn: "8456.40",
    stripe_price_id: "",
    support: "Premium 24/7",
    limits: { products_max: 1000, users_max: 10, branches_max: 10, ia_tokens_total: 5000 },
    price_without_tax_mxn: "7290.00",
    tax_rate: "0.16",
    tax_amount_mxn: "1166.40",
    price_with_tax_mxn: "8456.40",
  },
  {
    id: "fixed_subscription_growth",
    code: "growth_fixed",
    display_name: "Growth sin comision",
    name: "Growth sin comision",
    tier: "growth",
    billing_model: "fixed_subscription",
    commission_enabled: false,
    commission_percentage: "0.00",
    monthly_price_mxn: "5990.00",
    total_price_mxn: "6948.40",
    stripe_price_id: "",
    support: "Prioritario 24h",
    limits: { products_max: 300, users_max: 5, branches_max: 3, ia_tokens_total: 1050 },
    price_without_tax_mxn: "5990.00",
    tax_rate: "0.16",
    tax_amount_mxn: "958.40",
    price_with_tax_mxn: "6948.40",
  },
  {
    id: "fixed_subscription_premium",
    code: "premium_fixed",
    display_name: "Premium sin comision",
    name: "Premium sin comision",
    tier: "premium",
    billing_model: "fixed_subscription",
    commission_enabled: false,
    commission_percentage: "0.00",
    monthly_price_mxn: "9990.00",
    total_price_mxn: "11588.40",
    stripe_price_id: "",
    support: "Premium 24/7",
    limits: { products_max: 1000, users_max: 10, branches_max: 10, ia_tokens_total: 5000 },
    price_without_tax_mxn: "9990.00",
    tax_rate: "0.16",
    tax_amount_mxn: "1598.40",
    price_with_tax_mxn: "11588.40",
  },
];

const FALLBACK_ADDONS: CommercialAddon[] = [
  { id: "extra_user", code: "extra_user", display_name: "Usuario extra", name: "Usuario extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "199.00", total_price_mxn: "230.84", stripe_price_id: "", price_without_tax_mxn: "199.00", tax_rate: "0.16", tax_amount_mxn: "31.84", price_with_tax_mxn: "230.84" },
  { id: "extra_ai_agent", code: "extra_ai_agent", display_name: "Agente IA extra", name: "Agente IA extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "490.00", total_price_mxn: "568.40", stripe_price_id: "", price_without_tax_mxn: "490.00", tax_rate: "0.16", tax_amount_mxn: "78.40", price_with_tax_mxn: "568.40" },
  { id: "extra_brand", code: "extra_brand", display_name: "Marca extra", name: "Marca extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "990.00", total_price_mxn: "1148.40", stripe_price_id: "", price_without_tax_mxn: "990.00", tax_rate: "0.16", tax_amount_mxn: "158.40", price_with_tax_mxn: "1148.40" },
  { id: "extra_100_products", code: "extra_100_products", display_name: "100 productos extra", name: "100 productos extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "490.00", total_price_mxn: "568.40", stripe_price_id: "", price_without_tax_mxn: "490.00", tax_rate: "0.16", tax_amount_mxn: "78.40", price_with_tax_mxn: "568.40" },
  { id: "extra_branch", code: "extra_branch", display_name: "Sucursal extra", name: "Sucursal extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "790.00", total_price_mxn: "916.40", stripe_price_id: "", price_without_tax_mxn: "790.00", tax_rate: "0.16", tax_amount_mxn: "126.40", price_with_tax_mxn: "916.40" },
  { id: "extra_500_tokens", code: "extra_500_ai_credits", display_name: "500 creditos IA extra", name: "500 creditos IA extra", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "490.00", total_price_mxn: "568.40", stripe_price_id: "", price_without_tax_mxn: "490.00", tax_rate: "0.16", tax_amount_mxn: "78.40", price_with_tax_mxn: "568.40" },
  { id: "premium_support", code: "premium_support", display_name: "Soporte premium", name: "Soporte premium", billing_model: "addon", commission_enabled: false, commission_percentage: "0.00", monthly_price_mxn: "990.00", total_price_mxn: "1148.40", stripe_price_id: "", price_without_tax_mxn: "990.00", tax_rate: "0.16", tax_amount_mxn: "158.40", price_with_tax_mxn: "1148.40" },
];

const EXTRAS_SERVICIO = [
  {
    titulo: "Logistica Basica",
    precio: "$579 MXN mensuales IVA incluido",
    detalle: "Seguimiento operativo base para entregas y control inicial.",
  },
  {
    titulo: "Logistica Pro",
    precio: "$1,159 MXN mensuales IVA incluido",
    detalle: "Mayor control de eventos logistico-comerciales y trazabilidad ampliada.",
  },
  {
    titulo: "Logistica Enterprise",
    precio: "$2,319 MXN mensuales IVA incluido",
    detalle: "Operacion avanzada para equipos con mayor volumen y multiples rutas.",
  },
  {
    titulo: "Implementacion Logistica",
    precio: "$1,740 MXN pago unico IVA incluido",
    detalle: "Configuracion inicial y puesta en marcha del flujo logistico.",
  },
];

const JORNADA_OFERTAS = [
  {
    titulo: "Jornada Base",
    precio: "$695 MXN mensuales IVA incluido",
    detalle: "Agenda comercial y control basico de jornada de trabajo.",
  },
  {
    titulo: "Jornada Pro",
    precio: "$1,391 MXN mensuales IVA incluido",
    detalle: "Seguimiento operativo por equipo con mayor control de cumplimiento.",
  },
  {
    titulo: "Jornada Enterprise",
    precio: "$2,319 MXN mensuales IVA incluido",
    detalle: "Operacion avanzada de jornada para estructuras multi-sucursal.",
  },
  {
    titulo: "Implementacion Jornada",
    precio: "$2,900 MXN pago unico IVA incluido",
    detalle: "Configuracion inicial de turnos, equipo y flujo operativo.",
  },
];

const NFC_SOFTWARE = [
  {
    titulo: "NFC Operativo",
    precio: "$463 MXN mensuales IVA incluido por sucursal",
    detalle: "Software base para identificacion y operaciones NFC por sucursal.",
  },
  {
    titulo: "NFC Corporativo",
    precio: "$695 MXN mensuales IVA incluido por sucursal",
    detalle: "Control corporativo NFC para marcas con mayor complejidad operativa.",
  },
];

const NFC_EQUIPOS = [
  {
    titulo: "Grabador / lector NFC",
    precio: "$990 MXN IVA incluido",
    detalle: "Equipo para grabado y lectura de tarjetas NFC en operacion.",
  },
  {
    titulo: "Impresora de tarjetas con instalacion incluida",
    precio: "$81,200 MXN IVA incluido",
    detalle: "Equipo profesional para impresion de tarjetas con puesta en marcha.",
  },
];

const NFC_PAQUETES_TARJETAS = [
  {
    segmento: "Empleados",
    paquetes: [
      { nombre: "Paquete 50 tarjetas", precio: "$1,740 MXN IVA incluido" },
      { nombre: "Paquete 100 tarjetas", precio: "$2,900 MXN IVA incluido" },
      { nombre: "Paquete 250 tarjetas", precio: "$6,380 MXN IVA incluido" },
    ],
  },
  {
    segmento: "Empleados de distribuidores",
    paquetes: [
      { nombre: "Paquete 50 tarjetas", precio: "$2,030 MXN IVA incluido" },
      { nombre: "Paquete 100 tarjetas", precio: "$3,480 MXN IVA incluido" },
      { nombre: "Paquete 250 tarjetas", precio: "$7,540 MXN IVA incluido" },
    ],
  },
  {
    segmento: "Clientes / membresias",
    paquetes: [
      { nombre: "Paquete 100 tarjetas", precio: "$4,060 MXN IVA incluido" },
      { nombre: "Paquete 250 tarjetas", precio: "$8,120 MXN IVA incluido" },
      { nombre: "Paquete 500 tarjetas", precio: "$14,500 MXN IVA incluido" },
    ],
  },
];

const NAV_QUICK_ACCESS = [
  {
    to: "/comercia",
    title: "Inicio",
    detail: "Vista general",
  },
  {
    to: "/comercia/marketing",
    title: "Marketing",
    detail: "Captacion y conversion",
  },
  {
    to: "/comercia/consultoria",
    title: "Consultoria",
    detail: "Revision comercial guiada",
  },
];

function formatMoney(value: string) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
}

function limitValue(plan: CommercialPlan, key: string) {
  const value = (plan.limits?.[key] as string | number | undefined) ?? "-";
  return typeof value === "number" ? value : String(value);
}

function tierRank(plan: CommercialPlan) {
  if (plan.tier === "basic") return 1;
  if (plan.tier === "growth") return 2;
  if (plan.tier === "premium") return 3;
  return 99;
}

function formatCommission(percentage: string | number | null | undefined) {
  const value = Number(percentage ?? 0);
  if (!Number.isFinite(value)) return "0%";
  const text = Number.isInteger(value) ? `${value}` : value.toFixed(1);
  return `+ ${text}%`;
}

export function ComerciaPreciosPage() {
  const [plans, setPlans] = useState<CommercialPlan[]>(FALLBACK_PLANS);
  const [addons, setAddons] = useState<CommercialAddon[]>(FALLBACK_ADDONS);
  const [loadingCode, setLoadingCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pricingTab, setPricingTab] = useState<"all" | "fixed" | "commission">("all");

  useEffect(() => {
    api
      .getComerciaCommercialPlanCatalog()
      .then((catalog) => {
        if (catalog.plans?.length) setPlans(catalog.plans);
        if (catalog.addons?.length) setAddons(catalog.addons);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = (params.get("checkout") || "").trim().toLowerCase();
    if (checkoutState === "success") {
      setStatus(
        "Pago confirmado. Estamos provisionando tu cliente y acceso inicial. Revisa tu correo para continuar con onboarding."
      );
      setError("");
      return;
    }
    if (checkoutState === "cancel") {
      setStatus("");
      setError("Checkout cancelado. Puedes retomar la compra cuando quieras.");
    }
  }, []);

  const fixedPlans = useMemo(
    () => plans.filter((item) => item.code.includes("fixed")).sort((a, b) => tierRank(a) - tierRank(b)),
    [plans]
  );
  const commissionPlans = useMemo(
    () => plans.filter((item) => item.code.includes("commission")).sort((a, b) => tierRank(a) - tierRank(b)),
    [plans]
  );

  const startCheckout = async (itemCode: string) => {
    try {
      setLoadingCode(itemCode);
      setError("");
      setStatus("");
      const origin = window.location.origin;
      const response = await api.createComerciaCommercialCheckoutSession({
        item_code: itemCode,
        add_on_code: itemCode.startsWith("extra_") || itemCode === "premium_support" ? itemCode : undefined,
        resource_origin: "comercial_publico",
        ui_origin: "dashboard_global",
        success_url: `${origin}/comercia/precios?checkout=success&item=${encodeURIComponent(itemCode)}`,
        cancel_url: `${origin}/comercia/precios?checkout=cancel&item=${encodeURIComponent(itemCode)}`,
      });
      window.location.assign(response.checkout_url);
    } catch {
      setError("No fue posible iniciar el checkout en este momento. Intenta nuevamente.");
    } finally {
      setLoadingCode("");
    }
  };

  return (
    <main className="comercia-premium cp-animate-up">
      <CookieConsentBanner />
      <nav className="cp-nav">
        <div>
          <p className="cp-kicker">ComerCia by REINPIA</p>
          <h1>Precios y add-ons comerciales</h1>
          <p className="cp-brand-context">Selecciona plan base, expande capacidad y escala por etapas.</p>
        </div>
        <div className="cp-nav-actions">
          <div className="cp-nav-locale">
            <LanguageSelector />
          </div>
          <div className="cp-nav-dock">
            <p className="cp-nav-dock-label">Explora secciones</p>
            <div className="cp-nav-dock-grid">
              {NAV_QUICK_ACCESS.map((item) => (
                <Link key={item.to} className="cp-nav-card" to={item.to}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="cp-section">
        <header className="cp-section-head cp-pricing-head">
          <div className="cp-pricing-badge">Oferta comercial oficial</div>
          <p className="cp-kicker">Planes base ComerCia</p>
          <h2>Elige entre esquema fijo o esquema con comision</h2>
          <p>Todos los precios son finales con IVA incluido. Activa en minutos con checkout Stripe test.</p>
          <div className="cp-pricing-tabs" role="tablist" aria-label="Tipo de planes">
            <button
              type="button"
              className={`cp-pricing-tab ${pricingTab === "all" ? "is-active" : ""}`}
              onClick={() => setPricingTab("all")}
            >
              Ver todos
            </button>
            <button
              type="button"
              className={`cp-pricing-tab ${pricingTab === "fixed" ? "is-active" : ""}`}
              onClick={() => setPricingTab("fixed")}
            >
              Sin comision
            </button>
            <button
              type="button"
              className={`cp-pricing-tab ${pricingTab === "commission" ? "is-active" : ""}`}
              onClick={() => setPricingTab("commission")}
            >
              Con comision
            </button>
          </div>
          {status ? <p className="cp-success">{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </header>

        {(pricingTab === "all" || pricingTab === "fixed") && (
          <article className="cp-plan-group">
            <div className="cp-plan-group-head">
              <h3>Sin comision</h3>
              <p>Ideal para costos predecibles mensuales.</p>
            </div>
            <div className="cp-plans-grid">
              {fixedPlans.map((plan) => (
                <article key={plan.id} className={`cp-plan-card ${plan.tier === "growth" ? "is-highlight" : ""}`}>
                  <div className="cp-plan-card-top">
                    <p className="cp-plan-name">{plan.display_name || plan.name}</p>
                    <span className="cp-plan-tag">Sin comision</span>
                  </div>
                  <p className="cp-plan-price">${formatMoney(plan.price_with_tax_mxn)} MXN</p>
                  <p className="cp-plan-price-note">IVA incluido por mes</p>
                  <ul>
                    <li><strong>Productos:</strong> {limitValue(plan, "products_max")}</li>
                    <li><strong>Usuarios:</strong> {limitValue(plan, "users_max")}</li>
                    <li><strong>Sucursales:</strong> {limitValue(plan, "branches_max")}</li>
                    <li><strong>Creditos IA:</strong> {limitValue(plan, "ia_tokens_total")}</li>
                    <li><strong>Soporte:</strong> {plan.support}</li>
                  </ul>
                  <button className="button" type="button" disabled={Boolean(loadingCode)} onClick={() => void startCheckout(plan.code)}>
                    {loadingCode === plan.code ? "Iniciando checkout..." : "Elegir este plan"}
                  </button>
                </article>
              ))}
            </div>
          </article>
        )}

        {(pricingTab === "all" || pricingTab === "commission") && (
          <article className="cp-plan-group">
            <div className="cp-plan-group-head">
              <h3>Con comision</h3>
              <p>Menor cuota base y porcentaje por venta completada.</p>
            </div>
            <div className="cp-plans-grid">
              {commissionPlans.map((plan) => (
                <article key={plan.id} className={`cp-plan-card cp-plan-card-commission ${plan.tier === "growth" ? "is-highlight" : ""}`}>
                  <div className="cp-plan-card-top">
                    <p className="cp-plan-name">{plan.display_name || plan.name}</p>
                    <span className="cp-plan-tag cp-plan-tag-commission">{formatCommission(plan.commission_percentage)} por venta</span>
                  </div>
                  <p className="cp-plan-price">${formatMoney(plan.price_with_tax_mxn)} MXN</p>
                  <p className="cp-plan-price-note">IVA incluido por mes</p>
                  <ul>
                    <li><strong>Productos:</strong> {limitValue(plan, "products_max")}</li>
                    <li><strong>Usuarios:</strong> {limitValue(plan, "users_max")}</li>
                    <li><strong>Sucursales:</strong> {limitValue(plan, "branches_max")}</li>
                    <li><strong>Creditos IA:</strong> {limitValue(plan, "ia_tokens_total")}</li>
                    <li><strong>Soporte:</strong> {plan.support}</li>
                  </ul>
                  <button className="button" type="button" disabled={Boolean(loadingCode)} onClick={() => void startCheckout(plan.code)}>
                    {loadingCode === plan.code ? "Iniciando checkout..." : "Elegir este plan"}
                  </button>
                </article>
              ))}
            </div>
          </article>
        )}
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Add-ons</p>
          <h2>Expande capacidad sin rehacer toda tu operacion</h2>
          <p>Compra capacidad adicional en un clic cuando estes cerca de limite.</p>
        </header>
        <div className="cp-addons-grid">
          {addons.map((addon) => (
            <article key={addon.id} className="cp-addon-card">
              <strong>{addon.display_name || addon.name}</strong>
              <span>${formatMoney(addon.price_with_tax_mxn)} MXN IVA incluido</span>
              <button
                type="button"
                className="button button-outline"
                disabled={Boolean(loadingCode)}
                onClick={() => void startCheckout(addon.code)}
              >
                {loadingCode === addon.code ? "Iniciando checkout..." : "Comprar add-on"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Add-ons comerciales</p>
          <h2>Servicios avanzados para ampliar capacidad operativa</h2>
          <p>Precios finales con IVA incluido para activacion comercial por bloque.</p>
        </header>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Logistica</p>
          <h2>Planes de logistica para crecer con control de entrega</h2>
        </header>
        <div className="cp-simple-grid">
          {EXTRAS_SERVICIO.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p><strong>{item.precio}</strong></p>
              <p>{item.detalle}</p>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Consultar implementacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Hablar con un asesor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Jornada laboral</p>
          <h2>Control de agenda y cumplimiento para equipos comerciales</h2>
        </header>
        <div className="cp-simple-grid">
          {JORNADA_OFERTAS.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p><strong>{item.precio}</strong></p>
              <p>{item.detalle}</p>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Consultar implementacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Hablar con un asesor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">NFC software</p>
          <h2>Activacion NFC por sucursal para operacion comercial</h2>
        </header>
        <div className="cp-simple-grid">
          {NFC_SOFTWARE.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p><strong>{item.precio}</strong></p>
              <p>{item.detalle}</p>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Consultar implementacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Hablar con un asesor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Equipos NFC</p>
          <h2>Venta de hardware para operacion y personalizacion de tarjetas</h2>
        </header>
        <div className="cp-simple-grid">
          {NFC_EQUIPOS.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p><strong>{item.precio}</strong></p>
              <p>{item.detalle}</p>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Consultar implementacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Hablar con un asesor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Paquetes de tarjetas NFC</p>
          <h2>Paquetes por tipo de operacion</h2>
        </header>
        <div className="cp-simple-grid">
          {NFC_PAQUETES_TARJETAS.map((bloque) => (
            <article key={bloque.segmento} className="cp-simple-card">
              <h3>{bloque.segmento}</h3>
              <ul className="marketing-list">
                {bloque.paquetes.map((paquete) => (
                  <li key={`${bloque.segmento}-${paquete.nombre}`}>
                    {paquete.nombre}: <strong>{paquete.precio}</strong>
                  </li>
                ))}
              </ul>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Consultar implementacion</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Hablar con un asesor</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-grid">
          <div>
            <h3>ComerCia</h3>
            <p>Precios claros, add-ons escalables y activacion comercial guiada.</p>
          </div>
          <div>
            <h4>Navegacion</h4>
            <Link to="/comercia">Inicio</Link>
            <Link to="/comercia/marketing">Marketing</Link>
            <Link to="/comercia/consultoria">Consultoria</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link to="/legal/privacidad">Politica de privacidad</Link>
            <Link to="/legal/cookies">Politica de cookies</Link>
            <Link to="/legal/proteccion-datos">Proteccion de datos</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
