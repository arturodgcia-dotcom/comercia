/* ═══════════════════════════════════════════════════════════
   MERCAPLUS — Contacto
   ═══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { MP_BRAND } from "../data";

const CONTACT_OPTIONS = [
  { icon: "TEL", label: "Teléfono", value: MP_BRAND.phone, sub: "Lun–Vie 9am–7pm" },
  { icon: "EM", label: "Email", value: MP_BRAND.email, sub: "Respuesta en 24 hrs" },
  { icon: "WA", label: "WhatsApp", value: MP_BRAND.whatsapp, sub: "Lun–Sáb 8am–8pm" },
  { icon: "DIR", label: "Dirección", value: MP_BRAND.address, sub: "CDMX, México" },
];

type Reason = "general" | "dist" | "order" | "technical" | "billing";

export function MpContact() {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState<Reason>("general");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ maxWidth: "500px", margin: "80px auto", textAlign: "center", padding: "24px" }}>
        <div className="mp-panel" style={{ padding: "48px 32px" }}>
          <p style={{ fontSize: "72px", marginBottom: "16px" }}>📨</p>
          <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "8px" }}>¡Mensaje enviado!</h2>
          <p style={{ color: "var(--mp-muted)", marginBottom: "24px" }}>
            Nuestro equipo te responderá en menos de 24 horas hábiles.
          </p>
          <button className="mp-btn mp-btn-primary" type="button" onClick={() => setSent(false)}>
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1px solid var(--mp-border)", borderRadius: "8px",
    fontSize: "14px", fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 8px" }}>Contáctanos</h1>
        <p style={{ color: "var(--mp-muted)", fontSize: "16px" }}>
          Estamos aquí para ayudarte. Elige el canal que mejor te convenga.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px", alignItems: "start" }}>

        {/* Formulario */}
        <div className="mp-panel" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 20px" }}>Envíanos un mensaje</h2>

          {/* Motivo */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mp-muted)", marginBottom: "8px" }}>
              MOTIVO DE CONTACTO
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {([
                { id: "general", label: "💬 General" },
                { id: "dist", label: "🏭 Distribuidores" },
                { id: "order", label: "📦 Pedido" },
                { id: "technical", label: "🔧 Soporte técnico" },
                { id: "billing", label: "💰 Facturación" },
              ] as { id: Reason; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReason(opt.id)}
                  style={{
                    padding: "7px 14px", borderRadius: "20px", fontSize: "13px",
                    border: reason === opt.id ? "2px solid var(--mp-accent)" : "2px solid var(--mp-border)",
                    background: reason === opt.id ? "var(--mp-accent-soft)" : "#fff",
                    color: reason === opt.id ? "var(--mp-accent)" : "var(--mp-text)",
                    fontWeight: reason === opt.id ? 700 : 400, cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { key: "name", label: "Nombre completo *", type: "text", required: true, full: false },
                { key: "email", label: "Correo electrónico *", type: "email", required: true, full: false },
                { key: "phone", label: "Teléfono", type: "tel", required: false, full: false },
                { key: "company", label: "Empresa (opcional)", type: "text", required: false, full: false },
                { key: "message", label: "Mensaje *", type: "textarea", required: true, full: true },
              ].map(({ key, label, type, required, full }) => (
                <div key={key} style={{ gridColumn: full ? "1/-1" : undefined }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--mp-muted)", marginBottom: "4px" }}>
                    {label}
                  </label>
                  {type === "textarea" ? (
                    <textarea
                      style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      required={required}
                    />
                  ) : (
                    <input
                      type={type}
                      style={inputStyle}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      required={required}
                    />
                  )}
                </div>
              ))}
            </div>
            <button className="mp-btn mp-btn-primary mp-btn-lg" type="submit" style={{ marginTop: "20px", width: "100%" }}>
              Enviar mensaje →
            </button>
          </form>
        </div>

        {/* Info de contacto */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {CONTACT_OPTIONS.map((opt) => (
            <div key={opt.label} className="mp-panel" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "var(--mp-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "var(--mp-accent)", flexShrink: 0 }}>
                {opt.icon}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 700, color: "var(--mp-muted)", textTransform: "uppercase" }}>{opt.label}</p>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px" }}>{opt.value}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>{opt.sub}</p>
              </div>
            </div>
          ))}

          {/* Lía IA */}
          <div className="mp-panel" style={{ background: "linear-gradient(135deg, #f0f4ff, #e8f0fe)", border: "1px solid #c7d7f8" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, color: "var(--mp-accent)" }}>LÍA</span>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "15px" }}>Ejecutivo IA Lía</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--mp-muted)" }}>IA disponible 24/7</p>
              </div>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--mp-muted)" }}>
              Atención comercial inmediata, seguimiento de pedidos, soporte de membresías y canal distribuidores.
            </p>
            <button className="mp-btn mp-btn-primary mp-btn-sm" type="button">
              Hablar con un ejecutivo IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
