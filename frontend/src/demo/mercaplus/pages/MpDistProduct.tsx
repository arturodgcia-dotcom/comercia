import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMp } from "../MpContext";
import { formatMXN, getProductById } from "../data";

const MEMBER_DEMO = {
  nivel: "Oro",
  vigenteHasta: "15 de mayo de 2026",
  diasRestantes: 44,
  cuponActivo: "DIST-ORO-8",
  descuentoExtra: 8,
  puntosComerciales: 12600,
};

const VOLUME_TIERS = [
  { min: 1, max: 5, label: "Menudeo comercial", discount: 0 },
  { min: 6, max: 14, label: "Volumen medio", discount: 6 },
  { min: 15, max: 999, label: "Mayoreo premium", discount: 11 },
];

function calcTierDiscount(qty: number) {
  return VOLUME_TIERS.find((tier) => qty >= tier.min && qty <= tier.max) ?? VOLUME_TIERS[0];
}

export function MpDistProduct() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, toggleWishlist, isWishlisted } = useMp();
  const navigate = useNavigate();

  const product = getProductById(id || "");
  const [qty, setQty] = useState(6);
  const [frequency, setFrequency] = useState("mensual");
  const [showSuccess, setShowSuccess] = useState("");

  const tier = useMemo(() => calcTierDiscount(qty), [qty]);
  const basePrice = product?.priceWholesale ?? 0;
  const tierPrice = basePrice * (1 - tier.discount / 100);
  const membershipPrice = tierPrice * (1 - MEMBER_DEMO.descuentoExtra / 100);
  const total = membershipPrice * qty;

  if (!product) {
    return (
      <div style={{ maxWidth: "1020px", margin: "40px auto", padding: "24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>Producto no disponible</h1>
        <p style={{ color: "var(--mp-muted)" }}>Este producto no está activo para el canal comercial.</p>
        <Link className="mp-btn mp-btn-primary" to="/demo/mercaplus/dist/catalogo" style={{ marginTop: "16px" }}>
          Volver al catálogo distribuidor
        </Link>
      </div>
    );
  }

  const handleAddOrder = () => {
    for (let i = 0; i < qty; i++) addToCart(product, "dist");
    navigate("/demo/mercaplus/carrito");
  };

  const handleSchedule = () => {
    setShowSuccess(`Recompra ${frequency} programada por ${qty} unidades`);
    setTimeout(() => setShowSuccess(""), 3200);
  };

  return (
    <div style={{ maxWidth: "1220px", margin: "0 auto", padding: "28px 24px 42px" }}>
      <div className="mp-breadcrumb">
        <Link to="/demo/mercaplus/dist">Inicio distribuidor</Link>
        <span>›</span>
        <Link to="/demo/mercaplus/dist/catalogo">Catálogo comercial</Link>
        <span>›</span>
        <span style={{ color: "var(--mp-text)" }}>{product.name}</span>
      </div>

      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "1.15fr 1fr", alignItems: "start" }}>
        <section className="mp-panel">
          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "115px 1fr" }}>
            <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
              {[product.icon, "📦", "🧾", "🚚"].map((icon, idx) => (
                <div
                  key={`${icon}-${idx}`}
                  style={{
                    border: "1px solid var(--mp-border)",
                    borderRadius: "12px",
                    height: "74px",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "28px",
                    background: idx === 0 ? product.bgColor : "#fff",
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  borderRadius: "16px",
                  minHeight: "340px",
                  background: product.bgColor,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "132px",
                }}
              >
                {product.icon}
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" className="mp-btn mp-btn-outline" onClick={() => toggleWishlist(product.id)}>
                  {isWishlisted(product.id) ? "En favoritos comerciales" : "Guardar favorito comercial"}
                </button>
                <button type="button" className="mp-btn mp-btn-ghost">Solicitar atención comercial</button>
              </div>
            </div>
          </div>
        </section>

        <section className="mp-panel" style={{ display: "grid", gap: "16px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)", fontWeight: 700 }}>
              {product.categoryName} · SKU {product.sku}
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: "30px", lineHeight: 1.15 }}>{product.name}</h1>
            <p style={{ margin: 0, color: "var(--mp-muted)", lineHeight: 1.6 }}>{product.longDesc}</p>
          </div>

          <div style={{ borderRadius: "14px", background: "#eef5ff", padding: "14px", border: "1px solid #ccdafe" }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--mp-accent)" }}>CONDICIONES COMERCIALES</p>
            <div style={{ display: "grid", gap: "6px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Precio menudeo comercial</span>
                <strong>{formatMXN(product.priceRetail)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Precio mayoreo base</span>
                <strong>{formatMXN(product.priceWholesale)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Mínimo para este producto</span>
                <strong>6 unidades</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Disponibilidad comercial</span>
                <strong>{product.stock} {product.unit}s</strong>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid var(--mp-border)", borderRadius: "14px", padding: "14px" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700 }}>Volumen y ahorro por compra</p>
            {VOLUME_TIERS.map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span>{row.label} ({row.min}-{row.max === 999 ? "999+" : row.max} uds.)</span>
                <strong>{row.discount}% desc.</strong>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "126px 1fr", alignItems: "center" }}>
            <label style={{ fontSize: "13px", color: "var(--mp-muted)" }}>Cantidad</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--mp-border)", borderRadius: "10px", width: "fit-content" }}>
              <button type="button" style={{ border: "none", background: "none", padding: "10px 14px" }} onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <strong style={{ minWidth: "46px", textAlign: "center" }}>{qty}</strong>
              <button type="button" style={{ border: "none", background: "none", padding: "10px 14px" }} onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <label style={{ fontSize: "13px", color: "var(--mp-muted)" }}>Recompra rápida</label>
            <select className="mp-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div style={{ borderTop: "1px solid var(--mp-border)", paddingTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--mp-muted)", marginBottom: "4px" }}>
              <span>Precio con volumen ({tier.discount}%)</span>
              <strong style={{ color: "var(--mp-text)" }}>{formatMXN(tierPrice)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--mp-muted)", marginBottom: "4px" }}>
              <span>Beneficio membresía {MEMBER_DEMO.nivel} ({MEMBER_DEMO.descuentoExtra}%)</span>
              <strong style={{ color: "#166534" }}>-{formatMXN(tierPrice - membershipPrice)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: 900 }}>
              <span>Total</span>
              <span style={{ color: "var(--mp-accent)" }}>{formatMXN(total)}</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <button type="button" className="mp-btn mp-btn-primary mp-btn-lg" onClick={handleAddOrder}>
              Agregar al pedido
            </button>
            <button type="button" className="mp-btn mp-btn-outline" onClick={handleSchedule}>
              Programar recompra {frequency}
            </button>
          </div>
          {showSuccess && (
            <p style={{ margin: 0, fontSize: "13px", color: "#166534", background: "#dcfce7", borderRadius: "8px", padding: "8px 10px" }}>
              {showSuccess}
            </p>
          )}
        </section>
      </div>

      <section style={{ marginTop: "20px" }} className="mp-panel">
        <h2 style={{ marginTop: 0, marginBottom: "12px", fontSize: "20px" }}>Estado comercial del distribuidor</h2>
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ background: "#f8fafc", border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Membresía</p>
            <strong>{MEMBER_DEMO.nivel} · Vigente</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: MEMBER_DEMO.diasRestantes <= 45 ? "#b45309" : "var(--mp-muted)" }}>
              Vence el {MEMBER_DEMO.vigenteHasta}
            </p>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Cupón activo</p>
            <strong>{MEMBER_DEMO.cuponActivo}</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#166534" }}>Aplica {MEMBER_DEMO.descuentoExtra}% adicional</p>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Historial de compra</p>
            <strong>Última compra hace 9 días</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--mp-muted)" }}>Ticket promedio {formatMXN(12840)}</p>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Condiciones especiales</p>
            <strong>Crédito 21 días · Flete bonificado</strong>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--mp-muted)" }}>Puntos comerciales: {MEMBER_DEMO.puntosComerciales}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
