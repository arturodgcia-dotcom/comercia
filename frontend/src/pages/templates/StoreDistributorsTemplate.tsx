import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandTemplateInput, buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
import "./TemplateFamily.css";

const DISTRIBUTOR_PLANS = [
  { tier: "Comercio Base", min: "5 unidades", discount: "18%", delivery: "48h" },
  { tier: "Mayorista Activo", min: "20 unidades", discount: "28%", delivery: "24h" },
  { tier: "Socio Elite", min: "60 unidades", discount: "35%", delivery: "Prioritaria" },
];

const B2B_FEATURES = [
  "Dashboard comercial con historial de recompra",
  "Pricing por volumen y reglas por categoria",
  "Listas frecuentes y pedidos recurrentes",
  "Membresia comercial con beneficios escalonados",
  "Seguimiento de pedidos y estado de cuenta",
];

type StoreDistributorsTemplateProps = {
  brandInputOverride?: BrandTemplateInput;
  tenantSlugOverride?: string;
  hideDemoBadge?: boolean;
};

export function StoreDistributorsTemplate({
  brandInputOverride,
  tenantSlugOverride,
  hideDemoBadge = false,
}: StoreDistributorsTemplateProps = {}) {
  const [searchParams] = useSearchParams();
  const [orderCount, setOrderCount] = useState(0);
  const brandInput = brandInputOverride ?? getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "distributor_store"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);
  const landingHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/landing` : `/comercia?brand=${theme.key}`;
  const publicHref = tenantSlugOverride
    ? `/store/${tenantSlugOverride}`
    : `/internal/demo/tienda-publica?brand=${theme.key}`;
  const webappHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/webapp-preview` : `/internal/demo/pos?brand=${theme.key}`;

  return (
    <main className="tf-root" style={styleVars}>
      <section className="tf-shell">
        <header className="tf-header">
          <div>
            <p className="tf-badge">{theme.channelBadge}</p>
            <h1 className="tf-logo">
              {theme.logoText}
              <span>{theme.logoAccent ? ` ${theme.logoAccent}` : ""}</span>
            </h1>
            <p className="tf-muted">Variante B2B para {theme.name}. Base visual compartida con landing, ecommerce y POS.</p>
          </div>
          {!hideDemoBadge ? (
            <div className="tf-demo-banner">
              <strong>Demo</strong>
              <span>Vista de muestra</span>
              <span>No productivo</span>
            </div>
          ) : null}
          <div className="tf-nav-actions">
            <Link className="button button-outline" to={publicHref}>
              Ecommerce publico
            </Link>
            <Link className="button button-outline" to={webappHref}>
              POS
            </Link>
            <button type="button" className="button" onClick={() => setOrderCount((value) => value + 1)}>
              Pedidos ({orderCount})
            </button>
          </div>
        </header>

        <section className="tf-hero tf-hero-b2b">
          <article>
            <p className="tf-eyebrow">Canal comercial para distribuidores y comercios</p>
            <h2>{theme.headline}</h2>
            <p>
              Esta variante mantiene identidad de marca, pero prioriza volumen, recompra y seguimiento comercial para aliados
              B2B.
            </p>
            <div className="tf-hero-actions">
              <button type="button" className="button">
                {theme.ctaPrimary}
              </button>
              <button type="button" className="button button-outline">
                {theme.ctaSecondary}
              </button>
            </div>
          </article>
          <aside className="tf-hero-card">
            <p className="tf-eyebrow">Bloques clave B2B</p>
            <ul className="tf-list">
              {B2B_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="tf-grid tf-grid-3">
          {DISTRIBUTOR_PLANS.map((plan) => (
            <article className="tf-card" key={plan.tier}>
              <p className="tf-eyebrow">{plan.tier}</p>
              <h3>{plan.discount} de descuento</h3>
              <p className="tf-muted">Minimo por pedido: {plan.min}</p>
              <p className="tf-muted">Entrega: {plan.delivery}</p>
              <button type="button" className="button button-outline" onClick={() => setOrderCount((value) => value + 1)}>
                Solicitar cotizacion
              </button>
            </article>
          ))}
        </section>

        <section className="tf-card tf-section-highlight">
          <h3>Panel comercial multimarcas</h3>
          <p>
            Pricing de volumen, recompra rapida, historial de pedidos y estado de membresia comercial con el mismo ADN visual
            de la marca.
          </p>
          <div className="tf-row-between">
            <span className="tf-muted">Marca activa: {theme.name}</span>
            <span className="tf-muted">Tono: {theme.tone}</span>
          </div>
        </section>

        <footer className="tf-footer">
          <p>{theme.leadQuestion}</p>
          <div className="tf-footer-links">
            <Link to={landingHref}>Landing de marca</Link>
            <Link to={publicHref}>Ecommerce publico</Link>
            <Link to={webappHref}>POS WebApp</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

