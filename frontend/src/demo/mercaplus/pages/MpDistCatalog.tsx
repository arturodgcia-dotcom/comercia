/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Catálogo Distribuidores con tabla de precios
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_PRODUCTS, MP_CATEGORIES, getDistProducts, formatMXN } from "../data";

type ViewMode = "grid" | "table";

export function MpDistCatalog() {
  const { addToCart } = useMp();
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "saving">("saving");

  const filtered = useMemo(() => {
    let list = getDistProducts();
    if (cat !== "all") list = list.filter((p) => p.category === cat);

    switch (sortBy) {
      case "price-asc":  return [...list].sort((a, b) => a.priceWholesale - b.priceWholesale);
      case "price-desc": return [...list].sort((a, b) => b.priceWholesale - a.priceWholesale);
      case "saving":     return [...list].sort((a, b) => (b.pricePublic - b.priceWholesale) - (a.pricePublic - a.priceWholesale));
      default:           return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [cat, sortBy]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 900, margin: "0 0 6px" }}>📦 Catálogo Mayoreo</h1>
        <p style={{ color: "var(--mp-muted)", margin: 0 }}>
          Precios exclusivos para distribuidores registrados. Mínimo de compra aplica según nivel.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
        {/* Filtro categoría */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          <button type="button" className={`mp-filter-chip${cat === "all" ? " active" : ""}`} onClick={() => setCat("all")}>
            Todos ({getDistProducts().length})
          </button>
          {MP_CATEGORIES.filter((c) => c.id !== "c8").map((c) => (
            <button key={c.id} type="button" className={`mp-filter-chip${cat === c.slug ? " active" : ""}`} onClick={() => setCat(c.slug)}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Sort + view */}
        <div style={{ display: "flex", gap: "8px" }}>
          <select className="mp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="saving">Mayor ahorro</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
          <button type="button" onClick={() => setView("grid")} style={{ padding: "8px 12px", border: "1px solid var(--mp-border)", borderRadius: "8px", background: view === "grid" ? "var(--mp-accent)" : "#fff", color: view === "grid" ? "#fff" : "var(--mp-text)", cursor: "pointer" }}>
            ⊞
          </button>
          <button type="button" onClick={() => setView("table")} style={{ padding: "8px 12px", border: "1px solid var(--mp-border)", borderRadius: "8px", background: view === "table" ? "var(--mp-accent)" : "#fff", color: view === "table" ? "#fff" : "var(--mp-text)", cursor: "pointer" }}>
            ≡
          </button>
        </div>
      </div>

      {/* Conteo */}
      <p style={{ fontSize: "13px", color: "var(--mp-muted)", marginBottom: "20px" }}>
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""} disponibles
      </p>

      {/* Vista Grid */}
      {view === "grid" && (
        <div className="mp-product-grid">
          {filtered.map((p) => {
            const saving = ((p.pricePublic - p.priceWholesale) / p.pricePublic * 100).toFixed(0);
            return (
              <div key={p.id} className="mp-product-card">
                <div className="mp-product-badges">
                  <span className="mp-badge mp-badge-promo">-{saving}%</span>
                </div>
                <Link to={`/demo/mercaplus/dist/producto/${p.id}`} className="mp-product-img-wrap">
                  <div className="mp-product-img" style={{ background: p.bgColor }}>
                    <span style={{ fontSize: "64px" }}>{p.icon}</span>
                  </div>
                </Link>
                <div className="mp-product-body">
                  <p className="mp-product-category">{p.categoryName} · {p.sku}</p>
                  <Link to={`/demo/mercaplus/dist/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
                  <div style={{ margin: "8px 0 12px" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--mp-muted)" }}>
                      PVP: <s>{formatMXN(p.pricePublic)}</s>
                    </p>
                    <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "var(--mp-accent)" }}>
                      {formatMXN(p.priceWholesale)}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mp-green)", fontWeight: 600 }}>
                      Ahorras {formatMXN(p.pricePublic - p.priceWholesale)}
                    </p>
                  </div>
                  <button className="mp-btn mp-btn-primary mp-btn-sm" type="button" style={{ width: "100%" }} onClick={() => addToCart(p, "dist")}>
                    Agregar a pedido
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Tabla */}
      {view === "table" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--mp-shadow)" }}>
            <thead>
              <tr style={{ background: "var(--mp-navy)", color: "#fff" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Producto</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>SKU</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px" }}>Precio público</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px" }}>Precio mayoreo</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px" }}>Ahorro</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px" }}>Stock</th>
                <th style={{ padding: "12px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const savePct = ((p.pricePublic - p.priceWholesale) / p.pricePublic * 100).toFixed(0);
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid var(--mp-border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "28px" }}>{p.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--mp-muted)", fontFamily: "monospace" }}>{p.sku}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "var(--mp-muted)" }}>
                      <s>{formatMXN(p.pricePublic)}</s>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, fontSize: "16px", color: "var(--mp-accent)" }}>
                      {formatMXN(p.priceWholesale)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ background: "#dcfce7", color: "#166534", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", fontWeight: 700 }}>
                        -{savePct}%
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", color: "var(--mp-muted)" }}>
                      {p.stock} {p.unit}s
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <button className="mp-btn mp-btn-primary mp-btn-sm" type="button" onClick={() => addToCart(p, "dist")}>
                        Pedir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
