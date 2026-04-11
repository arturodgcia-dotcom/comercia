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
    titulo: "Logistica",
    detalle: "Recoleccion, entrega y control operativo para escalar sin friccion.",
  },
  {
    titulo: "Jornada laboral",
    detalle: "Agenda, seguimiento de citas y control por equipo.",
  },
  {
    titulo: "NFC software",
    detalle: "Activacion de modulo NFC para credenciales y operacion comercial.",
  },
  {
    titulo: "Equipos NFC",
    detalle: "Venta de equipos para grabado y operacion en sucursal.",
  },
  {
    titulo: "Paquetes de tarjetas",
    detalle: "Tarjetas NFC para membresias, identificacion o flujos de fidelizacion.",
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

export function ComerciaPreciosPage() {
  const [plans, setPlans] = useState<CommercialPlan[]>(FALLBACK_PLANS);
  const [addons, setAddons] = useState<CommercialAddon[]>(FALLBACK_ADDONS);
  const [loadingCode, setLoadingCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api
      .getComerciaCommercialPlanCatalog()
      .then((catalog) => {
        if (catalog.plans?.length) setPlans(catalog.plans);
        if (catalog.addons?.length) setAddons(catalog.addons);
      })
      .catch(() => null);
  }, []);

  const fixedPlans = useMemo(() => plans.filter((item) => item.code.includes("fixed")), [plans]);
  const commissionPlans = useMemo(() => plans.filter((item) => item.code.includes("commission")), [plans]);

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
          <LanguageSelector />
          <Link className="button button-outline" to="/comercia">Inicio</Link>
          <Link className="button button-outline" to="/comercia/marketing">Marketing</Link>
          <Link className="button button-outline" to="/comercia/consultoria">Consultoria</Link>
        </div>
      </nav>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Planes base</p>
          <h2>Modelos sin comision y con comision</h2>
          <p>Precios mensuales con IVA incluido y activacion por Stripe test.</p>
          {status ? <p className="cp-success">{status}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </header>

        <article className="cp-plan-group">
          <h3>Sin comision</h3>
          <div className="cp-plans-grid">
            {fixedPlans.map((plan) => (
              <article key={plan.id} className="cp-plan-card">
                <p className="cp-plan-name">{plan.display_name || plan.name}</p>
                <p className="cp-plan-price">${formatMoney(plan.price_with_tax_mxn)} MXN IVA incluido</p>
                <ul>
                  <li>Productos: {limitValue(plan, "products_max")}</li>
                  <li>Usuarios: {limitValue(plan, "users_max")}</li>
                  <li>Sucursales: {limitValue(plan, "branches_max")}</li>
                  <li>Creditos IA: {limitValue(plan, "ia_tokens_total")}</li>
                  <li>Soporte: {plan.support}</li>
                </ul>
                <button className="button" type="button" disabled={Boolean(loadingCode)} onClick={() => void startCheckout(plan.code)}>
                  {loadingCode === plan.code ? "Iniciando checkout..." : "Comprar plan"}
                </button>
              </article>
            ))}
          </div>
        </article>

        <article className="cp-plan-group">
          <h3>Con comision</h3>
          <div className="cp-plans-grid">
            {commissionPlans.map((plan) => (
              <article key={plan.id} className="cp-plan-card">
                <p className="cp-plan-name">{plan.display_name || plan.name}</p>
                <p className="cp-plan-price">
                  ${formatMoney(plan.price_with_tax_mxn)} MXN IVA incluido + {plan.commission_percentage}% por venta
                </p>
                <ul>
                  <li>Productos: {limitValue(plan, "products_max")}</li>
                  <li>Usuarios: {limitValue(plan, "users_max")}</li>
                  <li>Sucursales: {limitValue(plan, "branches_max")}</li>
                  <li>Creditos IA: {limitValue(plan, "ia_tokens_total")}</li>
                  <li>Soporte: {plan.support}</li>
                </ul>
                <button className="button" type="button" disabled={Boolean(loadingCode)} onClick={() => void startCheckout(plan.code)}>
                  {loadingCode === plan.code ? "Iniciando checkout..." : "Comprar plan"}
                </button>
              </article>
            ))}
          </div>
        </article>
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
          <p className="cp-kicker">Servicios adicionales</p>
          <h2>Logistica, jornada y NFC para operacion avanzada</h2>
          <p>Estos servicios se contratan con activacion comercial asistida.</p>
        </header>
        <div className="cp-simple-grid">
          {EXTRAS_SERVICIO.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p>{item.detalle}</p>
              <Link className="button button-outline" to="/comercia/consultoria">Solicitar activacion</Link>
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
