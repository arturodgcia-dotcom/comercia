/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Catálogo con filtros laterales
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_PRODUCTS, MP_CATEGORIES, formatMXN } from "../data";

type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "new";

export function MpCatalog() {
  const [params] = useSearchParams();
  const { addToCart, toggleWishlist, isWishlisted } = useMp();

  const initialCat = params.get("cat") || "all";
  const initialQ = params.get("q") || "";

  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [showPromo, setShowPromo] = useState(params.has("promo") || false);
  const [showNew, setShowNew] = useState(params.has("new") || false);
  const [showBest, setShowBest] = useState(params.has("bestseller") || false);
  const [query] = useState(initialQ);

  const filtered = useMemo(() => {
    let list = MP_PRODUCTS.filter((p) => p.isPublic);

    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.shortDesc.toLowerCase().includes(query.toLowerCase()));
    if (showPromo) list = list.filter((p) => p.isPromo);
    if (showNew) list = list.filter((p) => p.isNew);
    if (showBest) list = list.filter((p) => p.isBestseller);
    list = list.filter((p) => p.pricePublic <= maxPrice);

    switch (sort) {
      case "price-asc":  return [...list].sort((a, b) => a.pricePublic - b.pricePublic);
      case "price-desc": return [...list].sort((a, b) => b.pricePublic - a.pricePublic);
      case "rating":     return [...list].sort((a, b) => b.rating - a.rating);
      case "new":        return [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      default:           return list;
    }
  }, [cat, sort, maxPrice, showPromo, showNew, showBest, query]);

  return (
    <div className="mp-catalog-shell">

      {/* ── Filtros laterales ── */}
      <aside className="mp-filter-panel">
        <p className="mp-filter-heading">🗂️ Categoría</p>
        <button
          type="button"
          className={`mp-filter-opt${cat === "all" ? " active" : ""}`}
          onClick={() => setCat("all")}
        >
          Todas ({MP_PRODUCTS.filter((p) => p.isPublic).length})
        </button>
        {MP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`mp-filter-opt${cat === c.slug ? " active" : ""}`}
            onClick={() => setCat(c.slug)}
          >
            {c.icon} {c.name} ({c.productCount})
          </button>
        ))}

        <p className="mp-filter-heading" style={{ marginTop: "20px" }}>💰 Precio máximo</p>
        <input
          type="range" min={200} max={5000} step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--mp-accent)" }}
        />
        <p style={{ fontSize: "13px", color: "var(--mp-muted)", marginTop: "4px" }}>Hasta {formatMXN(maxPrice)}</p>

        <p className="mp-filter-heading" style={{ marginTop: "20px" }}>🏷️ Filtros especiales</p>
        {[
          { label: "En oferta", value: showPromo, set: setShowPromo },
          { label: "Nuevos", value: showNew, set: setShowNew },
          { label: "Más vendidos", value: showBest, set: setShowBest },
        ].map(({ label, value, set }) => (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", padding: "6px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: "var(--mp-accent)" }} />
            {label}
          </label>
        ))}
      </aside>

      {/* ── Grid de productos ── */}
      <div className="mp-catalog-main">
        {/* Toolbar */}
        <div className="mp-catalog-toolbar">
          <p className="mp-catalog-count">
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
            {query && <span> para "<strong>{query}</strong>"</span>}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "13px", color: "var(--mp-muted)" }}>Ordenar:</label>
            <select
              className="mp-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="rating">Mejor calificación</option>
              <option value="new">Más nuevos</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--mp-muted)" }}>
            <p style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</p>
            <p style={{ fontSize: "18px", fontWeight: 700 }}>Sin resultados</p>
            <p>Intenta ajustar los filtros o buscar algo diferente.</p>
            <button type="button" className="mp-btn mp-btn-primary" style={{ marginTop: "20px" }} onClick={() => { setCat("all"); setShowPromo(false); setShowNew(false); setShowBest(false); }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="mp-product-grid">
            {filtered.map((p) => (
              <div key={p.id} className="mp-product-card">
                {(p.isPromo || p.isNew || p.isBestseller) && (
                  <div className="mp-product-badges">
                    {p.isPromo && <span className="mp-badge mp-badge-promo">-{p.discountPct}%</span>}
                    {p.isNew && <span className="mp-badge mp-badge-new">NUEVO</span>}
                    {p.isBestseller && <span className="mp-badge mp-badge-best">⭐ TOP</span>}
                  </div>
                )}
                <button className="mp-product-wish" type="button" onClick={() => toggleWishlist(p.id)}>
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
                    {p.isPromo && <span className="mp-price-original">{formatMXN(p.pricePublic)}</span>}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
