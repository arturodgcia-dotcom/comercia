import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandTemplateInput, buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
import { api } from "../../services/api";
import { Product } from "../../types/domain";
import "./TemplateFamily.css";

type StorePOSTemplateProps = {
  brandInputOverride?: BrandTemplateInput;
  tenantSlugOverride?: string;
  hideDemoBadge?: boolean;
  industrialMode?: boolean;
};

type PosItem = { id: number; name: string; sku: string; price: number };

const POS_ITEMS_INDUSTRIAL: PosItem[] = [
  { id: 101, name: "Balero industrial referencia rápida", sku: "SKF-6205-2RS", price: 185 },
  { id: 102, name: "Chumacera UCP205", sku: "ZSG-UCP205", price: 365 },
  { id: 103, name: "Banda Poly-V", sku: "FULO-PJ1220", price: 215 },
  { id: 104, name: "Acople elastomérico", sku: "ZSG-L150", price: 485 },
];

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function toPosItems(products: Product[]): PosItem[] {
  if (products.length === 0) return POS_ITEMS_INDUSTRIAL;
  return products.slice(0, 12).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price_public),
  }));
}

export function StorePOSTemplate({
  brandInputOverride,
  tenantSlugOverride,
  hideDemoBadge = false,
  industrialMode = false,
}: StorePOSTemplateProps = {}) {
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState<Record<number, number>>({});
  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("Cliente mostrador");
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [paymentProvider, setPaymentProvider] = useState("mercadopago");
  const [mpReady, setMpReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const brandInput = brandInputOverride ?? getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "pos"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);
  const landingHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/landing` : `/comercia?brand=${theme.key}`;
  const publicHref = tenantSlugOverride ? `/store/${tenantSlugOverride}` : `/internal/demo/tienda-publica?brand=${theme.key}`;
  const distributorsHref = tenantSlugOverride
    ? `/store/${tenantSlugOverride}/distribuidores`
    : `/internal/demo/distribuidores?brand=${theme.key}`;
  const isRuntimeMode = Boolean(hideDemoBadge || tenantSlugOverride);

  useEffect(() => {
    if (!tenantSlugOverride) return;
    setLoading(true);
    api
      .getStorefrontHomeData(tenantSlugOverride)
      .then((payload) => {
        const parsed = parseConfig(payload.storefront_config?.config_json);
        const channelSettings = (parsed?.channel_settings ?? {}) as Record<string, unknown>;
        setStoreProducts([...payload.featured_products, ...payload.recent_products]);
        setPaymentProvider(String(parsed?.payment_provider ?? channelSettings.payment_provider ?? "mercadopago").toLowerCase());
        setMpReady(Boolean(channelSettings.mercadopago_public_key || channelSettings.mercadopago_access_token));
      })
      .catch(() => {
        setStoreProducts([]);
      })
      .finally(() => setLoading(false));
  }, [tenantSlugOverride]);

  const baseItems = industrialMode || isRuntimeMode ? toPosItems(storeProducts) : POS_ITEMS_INDUSTRIAL;
  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return baseItems;
    return baseItems.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(value));
  }, [baseItems, query]);

  const addItem = (itemId: number) => {
    setTicket((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const ticketRows = useMemo(
    () =>
      baseItems
        .filter((item) => (ticket[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          qty: ticket[item.id] ?? 0,
          subtotal: (ticket[item.id] ?? 0) * item.price,
        })),
    [baseItems, ticket]
  );

  const total = useMemo(() => ticketRows.reduce((sum, row) => sum + row.subtotal, 0), [ticketRows]);

  return (
    <main className="pos-runtime-root" style={styleVars}>
      <section className="pos-runtime-shell">
        <header className="pos-runtime-header">
          <div>
            <p className="tf-badge">{theme.channelBadge}</p>
            <h1>{theme.name} · WebApp / POS operativo</h1>
            <p className="tf-muted">Mostrador, cotización rápida, búsqueda SKU y cobro local para operación industrial.</p>
          </div>
          {!hideDemoBadge ? (
            <div className="tf-demo-banner">
              <strong>Modo interno</strong>
              <span>Sincroniza con tenant para modo productivo</span>
            </div>
          ) : null}
          <div className="pos-runtime-nav">
            <Link className="button button-outline" to={publicHref}>
              Ecommerce público
            </Link>
            <Link className="button button-outline" to={distributorsHref}>
              Portal B2B
            </Link>
          </div>
        </header>

        <section className="pos-runtime-grid">
          <article className="pos-runtime-panel">
            <h2>Venta mostrador</h2>
            <p className="chip">Estado catálogo: {loading ? "Sincronizando..." : `${baseItems.length} referencias`}</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por SKU o producto"
            />
            <div className="pos-runtime-items">
              {filteredItems.map((item) => (
                <button key={item.id} type="button" className="pos-item" onClick={() => addItem(item.id)}>
                  <strong>{item.name}</strong>
                  <span>SKU: {item.sku}</span>
                  <span>MXN ${item.price.toLocaleString("es-MX")}</span>
                </button>
              ))}
            </div>
          </article>

          <aside className="pos-runtime-summary">
            <h2>Resumen de venta</h2>
            <label>
              Cliente
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <ul>
              {ticketRows.length === 0 ? <li>Sin productos en ticket.</li> : null}
              {ticketRows.map((row) => (
                <li key={row.id}>
                  {row.qty} x {row.name} · MXN ${row.subtotal.toLocaleString("es-MX")}
                </li>
              ))}
            </ul>
            <p className="pos-total">Total: MXN ${total.toLocaleString("es-MX")}</p>
            <p className={paymentProvider === "mercadopago" && !mpReady ? "chip chip-warning" : "chip"}>
              {paymentProvider === "mercadopago"
                ? mpReady
                  ? "Mercado Pago listo: Point / QR / Link"
                  : "Mercado Pago pendiente de credenciales"
                : `Cobro principal: ${paymentProvider}`}
            </p>
            <div className="pos-runtime-actions">
              <button className="button" type="button">
                Cobrar con QR
              </button>
              <button className="button button-outline" type="button">
                Generar link de pago
              </button>
              <button className="button button-outline" type="button" onClick={() => setTicket({})}>
                Limpiar ticket
              </button>
            </div>
            <p className="tf-muted">Accesos rápidos: inventario, clientes frecuentes, pedidos recurrentes y almacén.</p>
          </aside>
        </section>

        <footer className="pos-runtime-footer">
          <Link to={landingHref}>Landing</Link>
          <Link to={publicHref}>Catálogo público</Link>
          <Link to={distributorsHref}>Canal distribuidores</Link>
        </footer>
      </section>
    </main>
  );
}
