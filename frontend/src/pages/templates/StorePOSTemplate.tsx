import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
import "./TemplateFamily.css";

type PosItem = { id: number; name: string; price: number };

const POS_ITEMS: PosItem[] = [
  { id: 1, name: "Producto rápido A", price: 120 },
  { id: 2, name: "Producto rápido B", price: 280 },
  { id: 3, name: "Servicio express", price: 390 },
  { id: 4, name: "Membresía mensual", price: 890 },
];

export function StorePOSTemplate() {
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState<Record<number, number>>({});
  const brandInput = getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "pos"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);

  const addItem = (itemId: number) => {
    setTicket((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const total = useMemo(
    () =>
      POS_ITEMS.reduce((sum, item) => {
        const qty = ticket[item.id] ?? 0;
        return sum + qty * item.price;
      }, 0),
    [ticket]
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
            <p className="tf-muted">POS limpio y rápido con identidad de marca sincronizada con landing y ecommerce.</p>
          </div>
          <div className="tf-demo-banner">
            <strong>Demo</strong>
            <span>Vista de muestra</span>
            <span>No productivo</span>
          </div>
          <div className="tf-nav-actions">
            <Link className="button button-outline" to={`/internal/demo/tienda-publica?brand=${theme.key}`}>
              Ecommerce público
            </Link>
            <Link className="button button-outline" to={`/internal/demo/distribuidores?brand=${theme.key}`}>
              Distribuidores
            </Link>
          </div>
        </header>

        <section className="tf-pos-grid">
          <article className="tf-card">
            <p className="tf-eyebrow">Caja de venta</p>
            <h2>Operación POS de {theme.name}</h2>
            <p className="tf-muted">Login POS, carrito, cupones, puntos y resumen de compra en una vista de muestra.</p>
            <div className="tf-grid tf-grid-2">
              {POS_ITEMS.map((item) => (
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
              {POS_ITEMS.filter((item) => (ticket[item.id] ?? 0) > 0).map((item) => (
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
            <p className="tf-muted">Membresías, credenciales y puntos heredan los mismos tokens visuales.</p>
          </aside>
        </section>

        <footer className="tf-footer">
          <p>{theme.valueProp}</p>
          <div className="tf-footer-links">
            <Link to={`/comercia?brand=${theme.key}`}>Landing</Link>
            <Link to={`/internal/demo/tienda-publica?brand=${theme.key}`}>Tienda pública</Link>
            <Link to={`/internal/demo/distribuidores?brand=${theme.key}`}>Canal B2B</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
