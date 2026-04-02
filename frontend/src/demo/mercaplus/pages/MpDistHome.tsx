/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Home Canal Distribuidores
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_BRAND, getDistProducts, formatMXN } from "../data";

const BENEFITS = [
  { icon: "💰", title: "Precios de mayoreo", desc: "Hasta 45% por debajo del precio público con descuentos escalonados por volumen." },
  { icon: "🚛", title: "Envío prioritario", desc: "Despacho garantizado en 24 hrs para pedidos confirmados antes de las 2 PM." },
  { icon: "📊", title: "Portal de reportes", desc: "Historial de compras, facturas, estado de envíos y métricas en tiempo real." },
  { icon: "🤝", title: "Ejecutivo asignado", desc: "Un ejecutivo de cuenta dedicado para cotizaciones, soporte y crecimiento." },
  { icon: "🏷️", title: "Marca propia", desc: "White-label y empaque personalizado disponible para pedidos mayores a $10,000." },
  { icon: "📋", title: "Crédito comercial", desc: "Líneas de crédito a 30/60 días para distribuidores calificados con historial." },
];

const TIERS = [
  { name: "Bronce", icon: "🥉", minPurchase: "$0", discount: "25%", benefits: ["Precios mayoreo base", "Acceso al catálogo", "Soporte por email"] },
  { name: "Plata", icon: "🥈", minPurchase: "$15,000/mes", discount: "35%", benefits: ["Todo lo de Bronce", "Envío prioritario", "Ejecutivo asignado", "Crédito a 15 días"] },
  { name: "Oro", icon: "🥇", minPurchase: "$40,000/mes", discount: "45%", benefits: ["Todo lo de Plata", "White-label disponible", "Crédito a 30 días", "Gerente de cuenta dedicado"] },
];

export function MpDistHome() {
  const { user, login, setChannel } = useMp();
  const distProducts = getDistProducts().slice(0, 6);
  const isDist = user.type === "dist";

  const handleAccessRequest = () => {
    setChannel("dist");
    login({ type: "dist", name: "Carlos Díaz", company: "Distribuidora Del Norte S.A.", email: "carlos@distnorte.mx", tier: "oro" });
  };

  return (
    <div className="mp-dist-shell">

      {/* ── Hero ── */}
      <section className="mp-dist-hero">
        <div className="mp-dist-hero-content">
          <p className="mp-dist-hero-eyebrow">🏭 Canal exclusivo para empresas y revendedores</p>
          <h1 className="mp-dist-hero-title">
            Compra al mayoreo con los mejores márgenes del mercado
          </h1>
          <p className="mp-dist-hero-sub">
            Accede a precios de distribuidor, envíos prioritarios y soporte dedicado para hacer crecer tu negocio.
          </p>
          <div className="mp-dist-hero-actions">
            {isDist ? (
              <>
                <Link to="/demo/mercaplus/dist/dashboard" className="mp-btn mp-btn-gold mp-btn-lg">
                  📊 Ir a mi portal
                </Link>
                <Link to="/demo/mercaplus/dist/catalogo" className="mp-btn mp-btn-outline-light mp-btn-lg">
                  Ver catálogo mayoreo
                </Link>
              </>
            ) : (
              <>
                <button className="mp-btn mp-btn-gold mp-btn-lg" type="button" onClick={handleAccessRequest}>
                  Solicitar acceso de distribuidor
                </button>
                <Link to="/demo/mercaplus/dist/catalogo" className="mp-btn mp-btn-outline-light mp-btn-lg">
                  Ver catálogo mayoreo
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mp-dist-stats">
          {[
            { value: "+500", label: "Distribuidores activos" },
            { value: "hasta 45%", label: "Descuento sobre PVP" },
            { value: "24 hrs", label: "Tiempo de despacho" },
            { value: "$0", label: "Comisión de apertura" },
          ].map((s) => (
            <div key={s.label} className="mp-dist-stat">
              <p className="mp-dist-stat-val">{s.value}</p>
              <p className="mp-dist-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Body ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 60px" }}>

        {/* Beneficios */}
        <section style={{ marginTop: "48px" }}>
          <h2 className="mp-section-title" style={{ marginBottom: "24px" }}>
            ¿Por qué distribuidores eligen {MP_BRAND.name}?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {BENEFITS.map((b) => (
              <div key={b.title} className="mp-panel" style={{ display: "flex", gap: "16px" }}>
                <span style={{ fontSize: "32px", flexShrink: 0 }}>{b.icon}</span>
                <div>
                  <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "15px" }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--mp-muted)", lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Niveles de membresía */}
        <section style={{ marginTop: "56px" }}>
          <h2 className="mp-section-title" style={{ marginBottom: "8px" }}>Niveles de membresía</h2>
          <p style={{ color: "var(--mp-muted)", marginBottom: "28px" }}>Mayores compras = mayores descuentos y beneficios exclusivos.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {TIERS.map((t) => (
              <div key={t.name} className="mp-panel" style={{ borderTop: `4px solid ${t.name === "Oro" ? "var(--mp-gold)" : t.name === "Plata" ? "#94a3b8" : "#cd7f32"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "32px" }}>{t.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: "20px" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>Desde {t.minPurchase}</p>
                  </div>
                </div>
                <p style={{ fontSize: "28px", fontWeight: 900, color: "var(--mp-accent)", margin: "0 0 16px" }}>
                  {t.discount} <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--mp-muted)" }}>de descuento</span>
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {t.benefits.map((b) => (
                    <li key={b} style={{ fontSize: "14px", display: "flex", gap: "8px" }}>
                      <span style={{ color: "var(--mp-green)", fontWeight: 700 }}>✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Productos destacados */}
        <section style={{ marginTop: "56px" }}>
          <div className="mp-section-header">
            <h2 className="mp-section-title">Productos destacados — Precios mayoreo</h2>
            <Link to="/demo/mercaplus/dist/catalogo" className="mp-section-link">Ver catálogo completo →</Link>
          </div>
          <div className="mp-product-grid">
            {distProducts.map((p) => (
              <div key={p.id} className="mp-product-card">
                <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-img-wrap">
                  <div className="mp-product-img" style={{ background: p.bgColor }}>
                    <span style={{ fontSize: "64px" }}>{p.icon}</span>
                  </div>
                </Link>
                <div className="mp-product-body">
                  <p className="mp-product-category">{p.categoryName}</p>
                  <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
                  <div style={{ margin: "8px 0" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--mp-muted)" }}>PVP: <s>{formatMXN(p.pricePublic)}</s></p>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--mp-accent)" }}>
                      {formatMXN(p.priceWholesale)} <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--mp-green)" }}>mayoreo</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{ marginTop: "56px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--mp-navy), var(--mp-blue))",
            borderRadius: "20px", padding: "48px", textAlign: "center", color: "#fff",
          }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 12px" }}>¿Listo para comenzar?</h2>
            <p style={{ opacity: 0.8, fontSize: "16px", margin: "0 0 28px", maxWidth: "460px", marginInline: "auto" }}>
              Regístrate hoy y un ejecutivo de cuenta te contactará en menos de 24 horas.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="mp-btn mp-btn-gold mp-btn-lg" type="button" onClick={handleAccessRequest}>
                Solicitar acceso como distribuidor
              </button>
              <Link to="/demo/mercaplus/contacto" className="mp-btn mp-btn-outline-light mp-btn-lg">
                Hablar con ejecutivo →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
