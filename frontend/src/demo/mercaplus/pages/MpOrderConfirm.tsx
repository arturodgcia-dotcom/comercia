/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Confirmación de pedido
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";

const ORDER_ID = `MP-${Math.floor(100000 + Math.random() * 900000)}`;

export function MpOrderConfirm() {
  return (
    <div style={{ maxWidth: "600px", margin: "60px auto", padding: "24px", textAlign: "center" }}>
      <div className="mp-panel" style={{ padding: "48px 40px" }}>
        <div style={{ fontSize: "80px", marginBottom: "16px" }}>✅</div>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--mp-text)", margin: "0 0 8px" }}>
          ¡Pedido confirmado!
        </h1>
        <p style={{ color: "var(--mp-muted)", fontSize: "15px", margin: "0 0 24px" }}>
          Gracias por tu compra. Te enviamos la confirmación a tu correo.
        </p>

        <div style={{ background: "var(--mp-accent-soft)", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Número de pedido
          </p>
          <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "var(--mp-accent)", letterSpacing: "0.05em" }}>
            {ORDER_ID}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px", textAlign: "left" }}>
          {[
            { icon: "📦", title: "Estado del pedido", value: "En preparación" },
            { icon: "🚚", title: "Entrega estimada", value: "24 – 48 horas" },
            { icon: "💳", title: "Método de pago", value: "Tarjeta de crédito" },
            { icon: "📍", title: "Dirección", value: "Av. Insurgentes Sur 567, CDMX" },
          ].map(({ icon, title, value }) => (
            <div key={title} style={{ padding: "14px 16px", background: "#f8faff", borderRadius: "10px", border: "1px solid var(--mp-border)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "20px" }}>{icon}</p>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--mp-muted)", textTransform: "uppercase" }}>{title}</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", marginBottom: "28px" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#15803d" }}>⭐ +124 puntos de lealtad</p>
          <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
            Has ganado puntos con esta compra. Puedes canjearlos en tu próximo pedido.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/demo/mercaplus" className="mp-btn mp-btn-primary">
            Seguir comprando
          </Link>
          <Link to="/demo/mercaplus/catalogo" className="mp-btn mp-btn-outline">
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
