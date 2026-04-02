/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Dashboard Distribuidor
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_ORDERS, formatMXN } from "../data";

const STATS = [
  { icon: "💰", label: "Compras este mes", value: "$47,820", trend: "+12%", up: true },
  { icon: "📦", label: "Pedidos activos", value: "3", trend: "2 en tránsito", up: null },
  { icon: "⭐", label: "Puntos de fidelidad", value: "4,782", trend: "+320 este mes", up: true },
  { icon: "📉", label: "Ahorro acumulado", value: "$21,500", trend: "vs. precio público", up: true },
];

const QUICK_LINKS = [
  { icon: "📦", label: "Hacer nuevo pedido", href: "/demo/mercaplus/dist/catalogo" },
  { icon: "📋", label: "Historial de pedidos", href: "/demo/mercaplus/dist/pedidos" },
  { icon: "💬", label: "Contactar ejecutivo", href: "/demo/mercaplus/contacto" },
  { icon: "📊", label: "Ver catálogo precios", href: "/demo/mercaplus/dist/catalogo" },
];

export function MpDistDashboard() {
  const { user } = useMp();
  const distUser = user.type === "dist" ? user : null;
  const recentOrders = MP_ORDERS.filter((o) => o.channel === "distribuidor").slice(0, 3);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

      {/* Bienvenida */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Portal Distribuidor
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: 900, margin: "0 0 6px" }}>
            Hola, {distUser?.name ?? "Distribuidor"} 👋
          </h1>
          <p style={{ margin: 0, color: "var(--mp-muted)" }}>
            {distUser?.company} · Nivel{" "}
            <span style={{
              background: distUser?.tier === "oro" ? "var(--mp-gold-soft)" : "#f1f5f9",
              color: distUser?.tier === "oro" ? "#92400e" : "var(--mp-navy)",
              fontWeight: 700, borderRadius: "6px", padding: "2px 8px", fontSize: "13px",
            }}>
              {distUser?.tier === "oro" ? "🥇 Oro" : distUser?.tier === "plata" ? "🥈 Plata" : "🥉 Bronce"}
            </span>
          </p>
        </div>
        <Link to="/demo/mercaplus/dist/catalogo" className="mp-btn mp-btn-primary mp-btn-lg">
          + Nuevo pedido
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {STATS.map((s) => (
          <div key={s.label} className="mp-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "28px" }}>{s.icon}</span>
              {s.up !== null && (
                <span style={{ fontSize: "12px", fontWeight: 700, color: s.up ? "var(--mp-green)" : "var(--mp-red)" }}>
                  {s.up ? "↑" : "↓"} {s.trend}
                </span>
              )}
            </div>
            <p style={{ margin: "10px 0 2px", fontSize: "26px", fontWeight: 900, color: "var(--mp-accent)" }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--mp-muted)" }}>{s.label}</p>
            {s.up === null && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mp-muted)" }}>{s.trend}</p>}
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" }}>

        {/* Pedidos recientes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Pedidos recientes</h2>
            <Link to="/demo/mercaplus/dist/pedidos" className="mp-section-link">Ver todos →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentOrders.map((order) => (
              <div key={order.id} className="mp-panel" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0,
                  background: "var(--mp-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
                }}>
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px" }}>Pedido #{order.id}</p>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                    {order.date} · {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                  </p>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: order.status === "entregado" ? "#166534" : order.status === "en camino" ? "#1d4ed8" : "#92400e",
                    background: order.status === "entregado" ? "#dcfce7" : order.status === "en camino" ? "#dbeafe" : "#fef3c7",
                    padding: "2px 8px", borderRadius: "4px",
                  }}>
                    {order.status === "entregado" ? "✅ Entregado" : order.status === "en camino" ? "🚚 En tránsito" : "⏳ Procesando"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "var(--mp-accent)", fontSize: "16px" }}>{formatMXN(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Accesos rápidos */}
          <div className="mp-panel">
            <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800 }}>Accesos rápidos</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {QUICK_LINKS.map((l) => (
                <Link key={l.label} to={l.href} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "8px", background: "var(--mp-bg)",
                  textDecoration: "none", fontSize: "14px", fontWeight: 600,
                  transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mp-accent-soft)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--mp-bg)")}
                >
                  <span style={{ fontSize: "20px" }}>{l.icon}</span> {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Ejecutivo asignado */}
          <div className="mp-panel" style={{ background: "linear-gradient(135deg, var(--mp-navy), var(--mp-blue))", color: "#fff" }}>
            <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#93c5fd" }}>
              Tu ejecutivo
            </p>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "40px" }}>👨‍💼</span>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 800 }}>Roberto Méndez</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#93c5fd" }}>Ejecutivo de cuenta</p>
              </div>
            </div>
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#93c5fd" }}>📞 +52 55 8000 5678</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#93c5fd" }}>✉️ roberto@mercaplus.demo</p>
            </div>
            <Link to="/demo/mercaplus/contacto" className="mp-btn mp-btn-gold mp-btn-sm" style={{ marginTop: "16px", display: "inline-block" }}>
              Contactar ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
