import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandTemplateInput, buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
import "./TemplateFamily.css";

type PosItem = { id: number; name: string; price: number };

const POS_ITEMS: PosItem[] = [
  { id: 1, name: "Producto rapido A", price: 120 },
  { id: 2, name: "Producto rapido B", price: 280 },
  { id: 3, name: "Servicio express", price: 390 },
  { id: 4, name: "Membresia mensual", price: 890 },
];

const POS_ITEMS_INDUSTRIAL: PosItem[] = [
  { id: 101, name: "Cotizacion rapida baleros", price: 1890 },
  { id: 102, name: "Venta mostrador chumaceras", price: 2450 },
  { id: 103, name: "Pedido recurrente cadenas", price: 3790 },
  { id: 104, name: "Kit mantenimiento industrial", price: 1290 },
];

type StorePOSTemplateProps = {
  brandInputOverride?: BrandTemplateInput;
  tenantSlugOverride?: string;
  hideDemoBadge?: boolean;
  industrialMode?: boolean;
};

export function StorePOSTemplate({
  brandInputOverride,
  tenantSlugOverride,
  hideDemoBadge = false,
  industrialMode = false,
}: StorePOSTemplateProps = {}) {
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState<Record<number, number>>({});
  const brandInput = brandInputOverride ?? getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "pos"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);
  const landingHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/landing` : `/comercia?brand=${theme.key}`;
  const publicHref = tenantSlugOverride
    ? `/store/${tenantSlugOverride}`
    : `/internal/demo/tienda-publica?brand=${theme.key}`;
  const distributorsHref = tenantSlugOverride
    ? `/store/${tenantSlugOverride}/distribuidores`
    : `/internal/demo/distribuidores?brand=${theme.key}`;
  const items = industrialMode ? POS_ITEMS_INDUSTRIAL : POS_ITEMS;
  const isRuntimeMode = Boolean(hideDemoBadge || tenantSlugOverride);

  const addItem = (itemId: number) => {
    setTicket((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = ticket[item.id] ?? 0;
        return sum + qty * item.price;
      }, 0),
    [items, ticket]
  );

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
            <p className="tf-muted">POS limpio y rapido con identidad de marca sincronizada con landing y ecommerce.</p>
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
            <Link className="button button-outline" to={distributorsHref}>
              Distribuidores
            </Link>
          </div>
        </header>

        <section className="tf-pos-grid">
          <article className="tf-card">
            <p className="tf-eyebrow">Caja de venta</p>
            <h2>Operacion POS de {theme.name}</h2>
            <p className="tf-muted">
              {isRuntimeMode
                ? "Login POS, carrito, cupones, puntos y resumen de compra para operacion diaria."
                : "Login POS, carrito, cupones, puntos y resumen de compra en una vista de muestra."}
            </p>
            <div className="tf-grid tf-grid-2">
              {items.map((item) => (
                <button key={item.id} type="button" className="button button-outline" onClick={() => addItem(item.id)}>
                  {item.name} · ${item.price.toLocaleString("es-MX")}
                </button>
              ))}
            </div>
          </article>

          <aside className="tf-card tf-pos-ticket">
            <p className="tf-eyebrow">Resumen de compra</p>
            <h3>Ticket actual</h3>
            <ul className="tf-list">
              {items
                .filter((item) => (ticket[item.id] ?? 0) > 0)
                .map((item) => (
                  <li key={item.id}>
                    {item.name} x {ticket[item.id]} · ${((ticket[item.id] ?? 0) * item.price).toLocaleString("es-MX")}
                  </li>
                ))}
            </ul>
            <p className="tf-price">Total: ${total.toLocaleString("es-MX")}</p>
            <div className="tf-hero-actions">
              <button type="button" className="button">
                Cobrar
              </button>
              <button type="button" className="button button-outline" onClick={() => setTicket({})}>
                Limpiar ticket
              </button>
            </div>
            <p className="tf-muted">Membresias, credenciales y puntos heredan los mismos tokens visuales.</p>
          </aside>
        </section>

        <footer className="tf-footer">
          <p>{theme.valueProp}</p>
          <div className="tf-footer-links">
            <Link to={landingHref}>Landing</Link>
            <Link to={publicHref}>Tienda publica</Link>
            <Link to={distributorsHref}>Canal B2B</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

