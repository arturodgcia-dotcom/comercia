/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Vista de Categorías
   ═══════════════════════════════════════════════════════════ */

import { Link } from "react-router-dom";
import { MP_CATEGORIES, MP_PRODUCTS } from "../data";

export function MpCategories() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px" }}>Todas las categorías</h1>
      <p style={{ color: "var(--mp-muted)", marginBottom: "36px" }}>
        Explora nuestra línea completa de productos profesionales y de bienestar.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {MP_CATEGORIES.map((cat) => {
          const products = MP_PRODUCTS.filter((p) => p.category === cat.slug || (cat.id === "c8" && false));
          const topProducts = products.slice(0, 3);
          return (
            <Link
              key={cat.id}
              to={`/demo/mercaplus/catalogo?cat=${cat.slug}`}
              className="mp-panel"
              style={{ textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s", display: "block" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--mp-shadow-md)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "14px",
                  background: "var(--mp-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "30px", flexShrink: 0,
                }}>
                  {cat.icon}
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "17px" }}>{cat.name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>{cat.productCount} productos</p>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--mp-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                {cat.description}
              </p>
              {topProducts.length > 0 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {topProducts.map((p) => (
                    <div key={p.id} style={{
                      flex: 1, padding: "8px", background: p.bgColor, borderRadius: "8px",
                      textAlign: "center", fontSize: "22px",
                    }}>
                      {p.icon}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: 700, color: "var(--mp-accent)", display: "flex", alignItems: "center", gap: "4px" }}>
                Ver productos <span>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
