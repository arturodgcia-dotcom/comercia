/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Página de Promociones
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_PRODUCTS, MP_PROMOS, formatMXN, getPromoProducts } from "../data";

export function MpPromos() {
  const { addToCart } = useMp();
  const promoProducts = getPromoProducts();
  const newProducts = MP_PRODUCTS.filter((p) => p.isNew && p.isPublic);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--mp-accent)", letterSpacing: "0.1em", margin: "0 0 8px" }}>
          OFERTAS ESPECIALES
        </p>
        <h1 style={{ fontSize: "36px", fontWeight: 900, margin: "0 0 12px" }}>
          🏷️ Semana de Descuentos
        </h1>
        <p style={{ fontSize: "16px", color: "var(--mp-muted)", maxWidth: "500px", margin: "0 auto" }}>
          Aprovecha los mejores precios del año en productos profesionales seleccionados.
        </p>
      </div>

      {/* Banners promocionales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "48px" }}>
        {MP_PROMOS.map((promo) => (
          <Link
            key={promo.id}
            to={`/demo/mercaplus/catalogo?promo=${promo.id}`}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: promo.bg, borderRadius: "16px", padding: "24px 28px",
              textDecoration: "none", minHeight: "140px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, background: promo.textColor, color: "#0d2354", padding: "2px 8px", borderRadius: "4px" }}>
                {promo.badge}
              </span>
              <p style={{ margin: "8px 0 4px", fontSize: "20px", fontWeight: 900, color: promo.textColor }}>{promo.title}</p>
              <p style={{ margin: "0 0 14px", fontSize: "14px", color: promo.textColor, opacity: 0.8 }}>{promo.subtitle}</p>
              <span style={{ fontSize: "13px", fontWeight: 700, color: promo.textColor, border: `1px solid ${promo.textColor}`, borderRadius: "6px", padding: "5px 12px" }}>
                {promo.cta}
              </span>
            </div>
            <span style={{ fontSize: "70px", flexShrink: 0, marginLeft: "16px" }}>{promo.icon}</span>
          </Link>
        ))}
      </div>

      {/* Contador regresivo fake */}
      <div style={{
        background: "var(--mp-navy)", borderRadius: "16px", padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "16px", marginBottom: "48px",
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#7a9ac8", fontWeight: 600, textTransform: "uppercase" }}>⚡ OFERTA FLASH</p>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#fff" }}>¡Termina en:</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {[{ val: "04", label: "Horas" }, { val: "23", label: "Minutos" }, { val: "47", label: "Segundos" }].map(({ val, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ background: "#fff", color: "var(--mp-navy)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900 }}>
                {val}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#7a9ac8" }}>{label}</p>
            </div>
          ))}
        </div>
        <Link to="/demo/mercaplus/catalogo?promo=true" className="mp-btn mp-btn-gold mp-btn-lg">
          Ver todas las ofertas
        </Link>
      </div>

      {/* Productos en oferta */}
      <section>
        <div className="mp-section-header">
          <h2 className="mp-section-title">🏷️ Productos con descuento</h2>
          <Link to="/demo/mercaplus/catalogo?promo=true" className="mp-section-link">Ver todos →</Link>
        </div>
        <div className="mp-product-grid">
          {promoProducts.map((p) => {
            const salePrice = p.pricePublic * (1 - p.discountPct / 100);
            return (
              <div key={p.id} className="mp-product-card">
                <div className="mp-product-badges">
                  <span className="mp-badge mp-badge-promo">-{p.discountPct}%</span>
                </div>
                <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-img-wrap">
                  <div className="mp-product-img" style={{ background: p.bgColor }}>
                    <span style={{ fontSize: "64px" }}>{p.icon}</span>
                  </div>
                </Link>
                <div className="mp-product-body">
                  <p className="mp-product-category">{p.categoryName}</p>
                  <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
                  <div className="mp-product-rating">
                    <span className="mp-stars">{"★".repeat(Math.round(p.rating))}</span>
                    <span className="mp-rating-count">({p.reviewCount})</span>
                  </div>
                  <div className="mp-product-price-row">
                    <span className="mp-price-original">{formatMXN(p.pricePublic)}</span>
                    <span className="mp-price-main">{formatMXN(salePrice)}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--mp-green)", margin: "4px 0 0", fontWeight: 600 }}>
                    Ahorras {formatMXN(p.pricePublic - salePrice)}
                  </p>
                  <button
                    className="mp-btn mp-btn-primary mp-btn-sm"
                    type="button"
                    style={{ width: "100%", marginTop: "10px" }}
                    onClick={() => addToCart(p)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Novedades */}
      {newProducts.length > 0 && (
        <section style={{ marginTop: "48px" }}>
          <div className="mp-section-header">
            <h2 className="mp-section-title">🆕 Novedades destacadas</h2>
          </div>
          <div className="mp-product-grid">
            {newProducts.map((p) => (
              <div key={p.id} className="mp-product-card">
                <div className="mp-product-badges">
                  <span className="mp-badge mp-badge-new">NUEVO</span>
                </div>
                <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-img-wrap">
                  <div className="mp-product-img" style={{ background: p.bgColor }}>
                    <span style={{ fontSize: "64px" }}>{p.icon}</span>
                  </div>
                </Link>
                <div className="mp-product-body">
                  <p className="mp-product-category">{p.categoryName}</p>
                  <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
                  <span className="mp-price-main">{formatMXN(p.pricePublic)}</span>
                  <button className="mp-btn mp-btn-primary mp-btn-sm" type="button" style={{ width: "100%", marginTop: "10px" }} onClick={() => addToCart(p)}>
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
