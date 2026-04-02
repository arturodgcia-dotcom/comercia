/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Home Pública
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";
import { useMp } from "../MpContext";
import {
  MP_CATEGORIES, MP_PROMOS, MP_PRODUCTS,
  getPromoProducts, getNewProducts, getBestsellers, formatMXN,
} from "../data";

/* ── Tarjeta de producto pequeña ── */
function ProductCard({ p }: { p: typeof MP_PRODUCTS[0] }) {
  const { addToCart, toggleWishlist, isWishlisted } = useMp();
  return (
    <div className="mp-product-card">
      {(p.isPromo || p.isNew || p.isBestseller) && (
        <div className="mp-product-badges">
          {p.isPromo && <span className="mp-badge mp-badge-promo">-{p.discountPct}%</span>}
          {p.isNew && <span className="mp-badge mp-badge-new">NUEVO</span>}
          {p.isBestseller && <span className="mp-badge mp-badge-best">⭐ TOP</span>}
        </div>
      )}
      <button
        className="mp-product-wish"
        type="button"
        onClick={() => toggleWishlist(p.id)}
        aria-label="Wishlist"
      >
        {isWishlisted(p.id) ? "❤️" : "🤍"}
      </button>
      <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-img-wrap">
        <div className="mp-product-img" style={{ background: p.bgColor }}>
          <span style={{ fontSize: "64px" }}>{p.icon}</span>
        </div>
      </Link>
      <div className="mp-product-body">
        <p className="mp-product-category">{p.categoryName}</p>
        <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
        <p className="mp-product-short">{p.shortDesc}</p>
        <div className="mp-product-rating">
          <span className="mp-stars">{"★".repeat(Math.round(p.rating))}</span>
          <span className="mp-rating-count">({p.reviewCount})</span>
        </div>
        <div className="mp-product-price-row">
          {p.isPromo && (
            <span className="mp-price-original">{formatMXN(p.pricePublic)}</span>
          )}
          <span className="mp-price-main">
            {formatMXN(p.isPromo ? p.pricePublic * (1 - p.discountPct / 100) : p.pricePublic)}
          </span>
        </div>
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
}

/* ── Sección de productos ── */
function ProductSection({ title, products, viewAllHref }: {
  title: string; products: typeof MP_PRODUCTS; viewAllHref: string;
}) {
  return (
    <section className="mp-section">
      <div className="mp-section-header">
        <h2 className="mp-section-title">{title}</h2>
        <Link to={viewAllHref} className="mp-section-link">Ver todos →</Link>
      </div>
      <div className="mp-product-grid">
        {products.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

/* ── Componente principal ── */
export function MpHome() {
  const promos = getPromoProducts();
  const nuevos = getNewProducts();
  const tops = getBestsellers();

  return (
    <div className="mp-home">

      {/* ── Hero banners ── */}
      <section className="mp-hero-grid">
        {/* Banner principal */}
        <div className="mp-hero-main" style={{ background: "linear-gradient(135deg, #0d2354 0%, #1152c5 100%)" }}>
          <div className="mp-hero-content">
            <p className="mp-hero-eyebrow">🏷️ SEMANA DE OFERTAS</p>
            <h1 className="mp-hero-heading">Hasta 40% OFF<br /><span>en Belleza y Bienestar</span></h1>
            <p className="mp-hero-sub">Productos profesionales a precios increíbles. Envío gratis en pedidos +$999.</p>
            <Link to="/demo/mercaplus/promos" className="mp-btn mp-btn-gold mp-btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Ver Ofertas ✨
            </Link>
          </div>
          <div className="mp-hero-visual">
            <span style={{ fontSize: "140px", filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.3))" }}>✨</span>
          </div>
        </div>

        {/* Banners secundarios */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {MP_PROMOS.slice(0, 2).map((promo) => (
            <div key={promo.id} className="mp-hero-side" style={{ background: promo.bg }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", opacity: 0.7, margin: "0 0 4px", color: promo.textColor }}>{promo.badge}</p>
                <p style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px", color: promo.textColor }}>{promo.title}</p>
                <p style={{ fontSize: "13px", margin: "0 0 12px", opacity: 0.8, color: promo.textColor }}>{promo.subtitle}</p>
                <Link to="/demo/mercaplus/promos" className="mp-btn mp-btn-outline-light mp-btn-sm">
                  {promo.cta}
                </Link>
              </div>
              <span style={{ fontSize: "68px" }}>{promo.icon}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deals strip ── */}
      <section className="mp-deals-strip">
        <div className="mp-deals-title">⚡ Ofertas del día</div>
        <div className="mp-deals-scroll">
          {promos.map((p) => (
            <Link key={p.id} to={`/demo/mercaplus/producto/${p.id}`} className="mp-deal-chip">
              <span style={{ fontSize: "28px" }}>{p.icon}</span>
              <span className="mp-deal-name">{p.name}</span>
              <span className="mp-deal-price">{formatMXN(p.pricePublic * (1 - p.discountPct / 100))}</span>
              <span className="mp-deal-save">-{p.discountPct}%</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="mp-section">
        <div className="mp-section-header">
          <h2 className="mp-section-title">Explorar categorías</h2>
          <Link to="/demo/mercaplus/categorias" className="mp-section-link">Ver todas →</Link>
        </div>
        <div className="mp-cat-tiles">
          {MP_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/demo/mercaplus/catalogo?cat=${cat.slug}`}
              className="mp-cat-tile"
            >
              <span className="mp-cat-tile-icon">{cat.icon}</span>
              <span className="mp-cat-tile-name">{cat.name}</span>
              <span className="mp-cat-tile-count">{cat.productCount} productos</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Productos en oferta ── */}
      <ProductSection title="🏷️ En oferta" products={promos} viewAllHref="/demo/mercaplus/promos" />

      {/* ── Banner Fidelización ── */}
      <section className="mp-loyalty-banner">
        <div className="mp-loyalty-content">
          <p className="mp-loyalty-eyebrow">⭐ PROGRAMA LEALTAD</p>
          <h2 className="mp-loyalty-title">Gana puntos con cada compra</h2>
          <p className="mp-loyalty-sub">
            Acumula puntos y canjéalos por descuentos. 1 punto por cada $10 pesos.
            Niveles: Bronce → Plata → Oro → Diamante.
          </p>
          <Link to="/demo/mercaplus/catalogo" className="mp-btn mp-btn-gold mp-btn-lg">
            Empezar a ganar puntos
          </Link>
        </div>
        <div className="mp-loyalty-icons">
          <span style={{ fontSize: "80px" }}>🥇</span>
        </div>
      </section>

      {/* ── Nuevos productos ── */}
      <ProductSection title="🆕 Novedades" products={nuevos} viewAllHref="/demo/mercaplus/catalogo?new=true" />

      {/* ── Más vendidos ── */}
      <ProductSection title="🔥 Más vendidos" products={tops} viewAllHref="/demo/mercaplus/catalogo?bestseller=true" />

      {/* ── Banner Canal Distribuidores ── */}
      <section style={{ margin: "0 0 32px", padding: "0 24px" }}>
        <div className="mp-dist-banner">
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#7a9ac8", margin: "0 0 6px" }}>
              🏭 Para empresas y revendedores
            </p>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>
              Canal Distribuidores — Hasta 40% OFF
            </h2>
            <p style={{ fontSize: "14px", color: "#93c5fd", margin: "0 0 20px" }}>
              Precios de mayoreo, envíos prioritarios y ejecutivo asignado.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link to="/demo/mercaplus/dist" className="mp-btn mp-btn-gold">
                Ver precios mayoreo
              </Link>
              <Link to="/demo/mercaplus/contacto" className="mp-btn mp-btn-outline-light">
                Hablar con ejecutivo
              </Link>
            </div>
          </div>
          <span style={{ fontSize: "100px", opacity: 0.3 }}>🏭</span>
        </div>
      </section>

      {/* ── IA Lía ── */}
      <section style={{ margin: "0 24px 40px" }}>
        <div style={{
          background: "linear-gradient(135deg, #f0f4ff, #e8f0fe)",
          borderRadius: "20px", padding: "28px 32px",
          display: "flex", alignItems: "center", gap: "24px",
          border: "1px solid #c7d7f8"
        }}>
          <span style={{ fontSize: "60px", flexShrink: 0 }}>🤖</span>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#1e6ef7", textTransform: "uppercase" }}>IA Comercial · Lía</p>
            <p style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "#0d2354" }}>
              ¿No sabes qué elegir? Pregúntale a Lía
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#5a7399" }}>
              Nuestra asistente de IA analiza tu perfil y recomienda los mejores productos para tu negocio.
            </p>
            <button className="mp-btn mp-btn-primary" type="button">
              ✨ Chatear con Lía — próximamente
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
