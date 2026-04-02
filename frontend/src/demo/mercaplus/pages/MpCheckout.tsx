/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Checkout
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMp } from "../MpContext";
import { formatMXN } from "../data";

type Step = "datos" | "envio" | "pago";

const PAYMENT_METHODS = [
  { id: "card", icon: "💳", label: "Tarjeta de crédito/débito", desc: "Visa, Mastercard, AmEx" },
  { id: "mp",   icon: "🔵", label: "MercadoPago",              desc: "Link de pago o QR" },
  { id: "transfer", icon: "📱", label: "Transferencia SPEI",   desc: "Pago inmediato 24/7" },
  { id: "cash", icon: "💵", label: "Pago en efectivo",         desc: "OXXO, 7-Eleven, Farmacias" },
];

export function MpCheckout() {
  const { cart, cartSubtotal, clearCart, user } = useMp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("datos");
  const [payMethod, setPayMethod] = useState("card");
  const [form, setForm] = useState({
    name: "name" in user ? user.name : "",
    email: "email" in user ? user.email : "",
    phone: "+52 55 1234 5678",
    street: "Av. Insurgentes Sur 567",
    city: "Ciudad de México",
    state: "CDMX",
    zip: "03100",
  });

  const shipping = cartSubtotal >= 999 ? 0 : 99;
  const total = cartSubtotal + shipping;

  const handleConfirm = () => {
    clearCart();
    navigate("/demo/mercaplus/confirmacion");
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "1px solid var(--mp-border)", borderRadius: "8px",
    fontSize: "14px", fontFamily: "inherit", outline: "none",
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <p style={{ fontSize: "48px" }}>🛒</p>
        <h2>No hay productos en el carrito</h2>
        <Link to="/demo/mercaplus/catalogo" className="mp-btn mp-btn-primary" style={{ display: "inline-block", marginTop: "16px" }}>
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>Finalizar compra</h1>

      {/* Stepper */}
      <div className="mp-stepper">
        {(["datos", "envio", "pago"] as Step[]).map((s, i) => (
          <div key={s} className={`mp-step${step === s ? " active" : step > s ? " done" : ""}`}>
            <div className="mp-step-num">{step > s ? "✓" : i + 1}</div>
            <span className="mp-step-label">{s === "datos" ? "Datos" : s === "envio" ? "Envío" : "Pago"}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start", marginTop: "28px" }}>

        {/* Formulario */}
        <div className="mp-panel">
          {step === "datos" && (
            <div>
              <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700 }}>📋 Datos de contacto</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { key: "name", label: "Nombre completo", type: "text" },
                  { key: "email", label: "Correo electrónico", type: "email" },
                  { key: "phone", label: "Teléfono", type: "tel" },
                ].map(({ key, label, type }) => (
                  <div key={key} style={{ gridColumn: key === "phone" ? "1/-1" : undefined }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--mp-muted)" }}>{label}</label>
                    <input
                      type={type}
                      style={inputStyle}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <button className="mp-btn mp-btn-primary" type="button" style={{ marginTop: "20px" }} onClick={() => setStep("envio")}>
                Continuar →
              </button>
            </div>
          )}

          {step === "envio" && (
            <div>
              <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700 }}>📦 Dirección de envío</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--mp-muted)" }}>Calle y número</label>
                  <input type="text" style={inputStyle} value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} />
                </div>
                {[
                  { key: "city", label: "Ciudad" },
                  { key: "state", label: "Estado" },
                  { key: "zip", label: "Código postal" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px", color: "var(--mp-muted)" }}>{label}</label>
                    <input type="text" style={inputStyle} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="mp-btn mp-btn-ghost" type="button" onClick={() => setStep("datos")}>← Atrás</button>
                <button className="mp-btn mp-btn-primary" type="button" onClick={() => setStep("pago")}>Continuar →</button>
              </div>
            </div>
          )}

          {step === "pago" && (
            <div>
              <h3 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 700 }}>💳 Método de pago</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 16px", border: `2px solid ${payMethod === m.id ? "var(--mp-accent)" : "var(--mp-border)"}`,
                    borderRadius: "10px", cursor: "pointer",
                    background: payMethod === m.id ? "var(--mp-accent-soft)" : "#fff",
                  }}>
                    <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} style={{ display: "none" }} />
                    <span style={{ fontSize: "28px" }}>{m.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700 }}>{m.label}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button className="mp-btn mp-btn-ghost" type="button" onClick={() => setStep("envio")}>← Atrás</button>
                <button className="mp-btn mp-btn-primary mp-btn-lg" type="button" style={{ flex: 1 }} onClick={handleConfirm}>
                  ✅ Confirmar y pagar {formatMXN(total)}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="mp-cart-summary">
          <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800 }}>Tu pedido</h3>
          {cart.map(({ product: p, qty, channel }) => {
            const price = channel === "dist" ? p.priceWholesale : (p.isPromo ? p.pricePublic * (1 - p.discountPct / 100) : p.pricePublic);
            return (
              <div key={p.id} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "28px" }}>{p.icon}</span>
                <div style={{ flex: 1, fontSize: "13px" }}>
                  <p style={{ margin: 0, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</p>
                  <p style={{ margin: 0, color: "var(--mp-muted)" }}>x{qty}</p>
                </div>
                <span style={{ fontWeight: 700 }}>{formatMXN(price * qty)}</span>
              </div>
            );
          })}
          <hr style={{ border: "none", borderTop: "1px solid var(--mp-border)", margin: "12px 0" }} />
          <div className="mp-summary-row">
            <span>Subtotal</span><span>{formatMXN(cartSubtotal)}</span>
          </div>
          <div className="mp-summary-row">
            <span>Envío</span>
            <span style={{ color: shipping === 0 ? "var(--mp-green)" : undefined }}>
              {shipping === 0 ? "GRATIS" : formatMXN(shipping)}
            </span>
          </div>
          <div className="mp-summary-row mp-summary-total">
            <span>Total</span><span>{formatMXN(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
