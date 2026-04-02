/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — FAQ
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Link } from "react-router-dom";
import { MP_FAQ as MP_FAQ_RAW } from "../data";

// Adapt raw FAQ (q/a) to component shape (id/question/answer/category)
const MP_FAQ = MP_FAQ_RAW.map((item, i) => ({
  id: `faq-${i}`,
  question: item.q,
  answer: item.a,
  category: i < 2 ? "pedidos" : i < 4 ? "pagos" : i < 5 ? "distribuidores" : i < 6 ? "cuenta" : "envios",
}));

const FAQ_CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "pedidos", label: "📦 Pedidos" },
  { id: "pagos", label: "💳 Pagos" },
  { id: "envios", label: "🚚 Envíos" },
  { id: "distribuidores", label: "🏭 Distribuidores" },
  { id: "cuenta", label: "👤 Cuenta" },
];

export function MpFAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = MP_FAQ.filter((item) => {
    const matchCat = filterCat === "all" || item.category === filterCat;
    const matchQ = query === "" || item.question.toLowerCase().includes(query.toLowerCase()) || item.answer.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 8px" }}>Preguntas frecuentes</h1>
        <p style={{ color: "var(--mp-muted)", fontSize: "16px" }}>
          Encuentra respuestas rápidas a las dudas más comunes.
        </p>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar en las preguntas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%", padding: "12px 14px 12px 44px",
            border: "1px solid var(--mp-border)", borderRadius: "10px",
            fontSize: "15px", fontFamily: "inherit", outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Categorías */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilterCat(c.id)}
            style={{
              padding: "7px 14px", borderRadius: "20px", fontSize: "13px",
              border: filterCat === c.id ? "2px solid var(--mp-accent)" : "2px solid var(--mp-border)",
              background: filterCat === c.id ? "var(--mp-accent-soft)" : "#fff",
              color: filterCat === c.id ? "var(--mp-accent)" : "var(--mp-text)",
              fontWeight: filterCat === c.id ? 700 : 400, cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Acordeón */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--mp-muted)" }}>
          <p style={{ fontSize: "48px" }}>🤷</p>
          <p>No encontramos resultados. <button type="button" onClick={() => { setQuery(""); setFilterCat("all"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mp-accent)", fontWeight: 700 }}>Limpiar filtros</button></p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                border: `1px solid ${open === item.id ? "var(--mp-accent)" : "var(--mp-border)"}`,
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff",
                transition: "border-color 0.15s",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(open === item.id ? null : item.id)}
                style={{
                  width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", gap: "12px",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "15px", lineHeight: 1.4 }}>{item.question}</span>
                <span style={{
                  fontSize: "20px", flexShrink: 0, transition: "transform 0.2s",
                  transform: open === item.id ? "rotate(45deg)" : "none",
                }}>+</span>
              </button>
              {open === item.id && (
                <div style={{ padding: "0 20px 20px", fontSize: "14px", color: "var(--mp-muted)", lineHeight: 1.7 }}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: "48px", textAlign: "center", padding: "32px", background: "var(--mp-accent-soft)", borderRadius: "16px" }}>
        <p style={{ fontWeight: 800, fontSize: "18px", margin: "0 0 8px" }}>¿No encontraste lo que buscabas?</p>
        <p style={{ color: "var(--mp-muted)", margin: "0 0 20px", fontSize: "14px" }}>
          Nuestro equipo está disponible para resolver cualquier duda.
        </p>
        <Link to="/demo/mercaplus/contacto" className="mp-btn mp-btn-primary">
          Contactar soporte →
        </Link>
      </div>
    </div>
  );
}
