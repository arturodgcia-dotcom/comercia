/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Carrito de compras
   ═══════════════════════════════════════════════════════════ */

import { Link, useNavigate } from "react-router-dom";
import { useMp } from "../MpContext";
import { formatMXN } from "../data";

function getGiftMeta(productId: string) {
  const raw = localStorage.getItem("mpGiftMeta");
  if (!raw) return null;
  const all = JSON.parse(raw) as Record<string, { tipo: string; mensaje: string; destinatario: string; remitente: string }>;
  return all[productId] ?? null;
}

export function MpCart() {
  const { cart, changeQty, removeFromCart, cartSubtotal, cartCount, clearCart } = useMp();
  const navigate = useNavigate();

  const shipping = cartSubtotal >= 999 ? 0 : 99;
  const total = cartSubtotal + shipping;

  if (cart.length === 0) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "24px" }}>
        <p style={{ fontSize: "80px", marginBottom: "16px" }}>🛒</p>
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Tu carrito está vacío</h2>
        <p style={{ color: "var(--mp-muted)", marginBottom: "28px" }}>Explora nuestro catálogo y encuentra algo que te guste.</p>
        <Link to="/demo/mercaplus/catalogo" className="mp-btn mp-btn-primary mp-btn-lg">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>
          🛒 Carrito ({cartCount} {cartCount === 1 ? "ítem" : "ítems"})
        </h1>
        <button type="button" onClick={clearCart} className="mp-btn mp-btn-ghost" style={{ color: "var(--mp-red)", fontSize: "13px" }}>
          🗑️ Vaciar carrito
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

        {/* Ítems */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {cart.map(({ product: p, qty, channel }) => {
            const unitPrice = channel === "dist" ? p.priceWholesale : (p.isPromo ? p.pricePublic * (1 - p.discountPct / 100) : p.pricePublic);
            const giftMeta = getGiftMeta(p.id);
            return (
              <div key={p.id} className="mp-cart-item">
                <div className="mp-cart-item-img" style={{ background: p.bgColor }}>
                  <span style={{ fontSize: "48px" }}>{p.icon}</span>
                </div>
                <div className="mp-cart-item-info">
                  <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-cart-item-name">{p.name}</Link>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "var(--mp-muted)" }}>SKU: {p.sku}</p>
                  {giftMeta && (
                    <div style={{ marginTop: "6px", border: "1px solid var(--mp-border)", background: "#f8fbff", borderRadius: "8px", padding: "6px 8px", fontSize: "12px" }}>
                      <strong style={{ display: "block", marginBottom: "2px" }}>Producto para regalo · {giftMeta.tipo}</strong>
                      <span>Destinatario: {giftMeta.destinatario}</span><br />
                      <span>Mensaje: {giftMeta.mensaje}</span><br />
                      <span>Remitente: {giftMeta.remitente}</span>
                    </div>
                  )}
                  {channel === "dist" && (
                    <span style={{ fontSize: "11px", background: "var(--mp-navy)", color: "#93c5fd", borderRadius: "4px", padding: "2px 8px" }}>
                      Precio distribuidor
                    </span>
                  )}
                </div>
                <div className="mp-cart-item-qty">
                  <button type="button" onClick={() => changeQty(p.id, -1)} className="mp-qty-btn-sm">−</button>
                  <span style={{ fontWeight: 700, minWidth: "28px", textAlign: "center" }}>{qty}</span>
                  <button type="button" onClick={() => changeQty(p.id, 1)} className="mp-qty-btn-sm">+</button>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "17px", color: "var(--mp-accent)" }}>{formatMXN(unitPrice * qty)}</p>
                  <p style={{ margin: "2px 0 8px", fontSize: "12px", color: "var(--mp-muted)" }}>{formatMXN(unitPrice)} c/u</p>
                  <button type="button" onClick={() => removeFromCart(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mp-red)", fontSize: "18px" }}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen */}
        <div className="mp-cart-summary">
          <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800 }}>Resumen del pedido</h3>

          <div className="mp-summary-row">
            <span>Subtotal ({cartCount} ítems)</span>
            <span>{formatMXN(cartSubtotal)}</span>
          </div>
          <div className="mp-summary-row">
            <span>Envío</span>
            <span style={{ color: shipping === 0 ? "var(--mp-green)" : undefined }}>
              {shipping === 0 ? "GRATIS" : formatMXN(shipping)}
            </span>
          </div>
          {shipping > 0 && (
            <p style={{ fontSize: "12px", color: "var(--mp-muted)", margin: "4px 0 12px" }}>
              Faltan {formatMXN(999 - cartSubtotal)} para envío gratis
            </p>
          )}
          <div className="mp-summary-row mp-summary-total">
            <span>Total</span>
            <span>{formatMXN(total)}</span>
          </div>

          <button
            className="mp-btn mp-btn-primary mp-btn-lg"
            type="button"
            style={{ width: "100%", marginTop: "20px" }}
            onClick={() => navigate("/demo/mercaplus/checkout")}
          >
            Proceder al checkout →
          </button>

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--mp-muted)" }}>
              <span>🔒</span><span>Pago 100% seguro con SSL</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--mp-muted)" }}>
              <span>↩️</span><span>30 días de devolución</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--mp-muted)" }}>
              <span>📦</span><span>Envío en 24-48 hrs</span>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {["💳", "💵", "📱"].map((icon) => (
              <span key={icon} style={{ fontSize: "24px" }}>{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
