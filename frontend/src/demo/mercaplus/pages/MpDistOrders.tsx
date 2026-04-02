/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Historial de Pedidos Distribuidor
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { MP_ORDERS, MP_PRODUCTS, formatMXN } from "../data";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  entregado:   { label: "✅ Entregado",   color: "#166534", bg: "#dcfce7" },
  "en camino": { label: "🚚 En tránsito", color: "#1d4ed8", bg: "#dbeafe" },
  procesando:  { label: "⏳ Procesando",  color: "#92400e", bg: "#fef3c7" },
  cancelado:   { label: "❌ Cancelado",   color: "#991b1b", bg: "#fee2e2" },
};

export function MpDistOrders() {
  const [selected, setSelected] = useState<string | null>(null);
  const distOrders = MP_ORDERS.filter((o) => o.channel === "distribuidor");
  const selectedOrder = distOrders.find((o) => o.id === selected);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>📋 Historial de pedidos</h1>
      <p style={{ color: "var(--mp-muted)", marginBottom: "28px" }}>
        Todos tus pedidos mayoreo. Haz clic en uno para ver el detalle.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: "24px", alignItems: "start" }}>

        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {distOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--mp-muted)" }}>
              <p style={{ fontSize: "48px" }}>📦</p>
              <p>Sin pedidos aún. Haz tu primer pedido mayoreo.</p>
            </div>
          ) : (
            distOrders.map((order) => {
              const st = STATUS_MAP[order.status] ?? STATUS_MAP.procesando;
              return (
                <div
                  key={order.id}
                  className="mp-panel"
                  style={{
                    cursor: "pointer",
                    border: selected === order.id ? "2px solid var(--mp-accent)" : "2px solid transparent",
                    transition: "border-color 0.15s",
                  }}
                  onClick={() => setSelected(selected === order.id ? null : order.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0,
                      background: "var(--mp-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                    }}>
                      📦
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: "15px" }}>Pedido #{order.id}</span>
                        <span style={{ background: st.bg, color: st.color, fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                          {st.label}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--mp-muted)" }}>
                        {order.date} · {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "18px", color: "var(--mp-accent)" }}>{formatMXN(order.total)}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--mp-muted)" }}>
                        {order.tracking ?? "Sin tracking"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalle */}
        {selectedOrder && (
          <div className="mp-panel" style={{ position: "sticky", top: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Pedido #{selectedOrder.id}</h3>
              <button type="button" onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--mp-muted)" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              {(["date", "status", "tracking"] as const).map((key) => {
                const labels: Record<string, string> = { date: "Fecha", status: "Estado", tracking: "Tracking" };
                const value = key === "status"
                  ? (STATUS_MAP[selectedOrder.status]?.label ?? selectedOrder.status)
                  : (selectedOrder[key] ?? "—");
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mp-border)", fontSize: "13px" }}>
                    <span style={{ color: "var(--mp-muted)" }}>{labels[key]}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "14px" }}>Productos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {selectedOrder.items.map((item) => {
                const product = MP_PRODUCTS.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.productId} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "26px" }}>{product.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>{product.name}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>x{item.qty}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>{formatMXN(item.price * item.qty)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px", background: "var(--mp-accent-soft)", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 900 }}>
                <span>Total del pedido</span>
                <span style={{ color: "var(--mp-accent)" }}>{formatMXN(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.status === "en camino" && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#dbeafe", borderRadius: "10px" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#1d4ed8", fontSize: "13px" }}>🚚 Tu pedido está en camino</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#1e40af" }}>Entrega estimada: mañana entre 9am y 1pm</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
