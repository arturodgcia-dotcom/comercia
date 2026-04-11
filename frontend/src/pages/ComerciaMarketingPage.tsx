import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { api } from "../services/api";
import "./ComerciaLandingPage.css";

type MarketingForm = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_brand: string;
  city: string;
  country: string;
  industry: string;
  sells: "productos" | "servicios" | "mixto";
  sells_detail: string;
  main_goal: "reconocimiento" | "leads" | "ventas" | "distribuidores" | "recompra";
  desired_conversion_channel: "whatsapp" | "formulario" | "landing" | "ecommerce" | "pos";
  active_social_networks: string;
  products_to_promote: number;
  average_ticket_mxn: number;
  offer_clarity: "alta" | "media" | "baja";
  offer_summary: string;
  urgency: "inmediata" | "alta" | "media" | "baja";
  followup_level: "alto" | "medio" | "bajo";
  has_landing: boolean;
  has_ecommerce: boolean;
  needs_extra_landing: boolean;
  needs_extra_ecommerce: boolean;
  needs_commercial_tracking: boolean;
  wants_custom_proposal: boolean;
  client_notes: string;
};

const BENEFICIOS = [
  "Estrategia digital orientada a conversion y resultado comercial.",
  "Ejecucion de contenido para canales con enfoque en captacion.",
  "Seguimiento comercial para no perder oportunidades de venta.",
  "Integracion con tu operacion actual sin frenar el negocio.",
];

const DEFAULT_FORM: MarketingForm = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  company_brand: "",
  city: "",
  country: "Mexico",
  industry: "",
  sells: "productos",
  sells_detail: "",
  main_goal: "ventas",
  desired_conversion_channel: "ecommerce",
  active_social_networks: "",
  products_to_promote: 20,
  average_ticket_mxn: 1000,
  offer_clarity: "media",
  offer_summary: "",
  urgency: "media",
  followup_level: "medio",
  has_landing: false,
  has_ecommerce: false,
  needs_extra_landing: false,
  needs_extra_ecommerce: false,
  needs_commercial_tracking: true,
  wants_custom_proposal: true,
  client_notes: "",
};

export function ComerciaMarketingPage() {
  const [form, setForm] = useState<MarketingForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await api.createComerciaMarketingProspect({
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        company_brand: form.company_brand,
        location: `${form.city.trim()}${form.city.trim() && form.country.trim() ? ", " : ""}${form.country.trim()}`.trim() || null,
        industry: form.industry,
        sells: form.sells,
        main_goal: form.main_goal,
        desired_conversion_channel: form.desired_conversion_channel,
        active_social_networks: form.active_social_networks,
        products_to_promote: Math.max(1, Number(form.products_to_promote || 1)),
        average_ticket_mxn: Math.max(0, Number(form.average_ticket_mxn || 0)),
        offer_clarity: form.offer_clarity,
        urgency: form.urgency,
        followup_level: form.followup_level,
        has_landing: form.has_landing,
        has_ecommerce: form.has_ecommerce,
        needs_extra_landing: form.needs_extra_landing,
        needs_extra_ecommerce: form.needs_extra_ecommerce,
        needs_commercial_tracking: form.needs_commercial_tracking,
        wants_custom_proposal: form.wants_custom_proposal,
        client_notes: [
          form.sells_detail ? `Que vende: ${form.sells_detail}` : "",
          form.offer_summary ? `Oferta clara: ${form.offer_summary}` : "",
          form.client_notes ? `Notas: ${form.client_notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        channel: "landing_marketing",
      });
      setSuccess("Tu solicitud de marketing fue registrada. Te contactaremos para el siguiente paso.");
      setForm(DEFAULT_FORM);
    } catch {
      setError("No fue posible enviar tu solicitud en este momento. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="comercia-premium cp-animate-up">
      <CookieConsentBanner />
      <nav className="cp-nav">
        <div>
          <p className="cp-kicker">ComerCia by REINPIA</p>
          <h1>Marketing comercial para crecer con orden</h1>
          <p className="cp-brand-context">Servicio enfocado en captacion, conversion y seguimiento comercial.</p>
        </div>
        <div className="cp-nav-actions">
          <LanguageSelector />
          <Link className="button button-outline" to="/comercia">Inicio</Link>
          <Link className="button button-outline" to="/comercia/precios">Precios</Link>
          <Link className="button button-outline" to="/comercia/consultoria">Consultoria</Link>
        </div>
      </nav>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Servicio de marketing</p>
          <h2>Alineamos demanda, conversion y seguimiento comercial</h2>
          <p>
            Esta pagina concentra el servicio de mercadotecnia digital con enfoque comercial. Sin metodologia sensible ni
            precotizacion publica.
          </p>
        </header>
        <div className="cp-simple-grid">
          {BENEFICIOS.map((item) => (
            <article key={item} className="cp-simple-card">
              <h3>Beneficio</h3>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Formulario</p>
          <h2>Solicita una revision comercial de marketing</h2>
          <p>Comparte la informacion principal de tu negocio y nuestro equipo preparara una revision comercial inicial.</p>
        </header>
        <form className="cp-simple-form" onSubmit={submit}>
          <article className="cp-form-block cp-field-full">
            <h3>Contacto principal</h3>
            <div className="cp-form-grid">
              <label>
                Nombre del contacto
                <input required value={form.contact_name} onChange={(event) => setForm((prev) => ({ ...prev, contact_name: event.target.value }))} />
              </label>
              <label>
                Correo
                <input required type="email" value={form.contact_email} onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))} />
              </label>
              <label>
                Telefono / WhatsApp
                <input required value={form.contact_phone} onChange={(event) => setForm((prev) => ({ ...prev, contact_phone: event.target.value }))} />
              </label>
              <label>
                Marca / empresa
                <input required value={form.company_brand} onChange={(event) => setForm((prev) => ({ ...prev, company_brand: event.target.value }))} />
              </label>
            </div>
          </article>

          <article className="cp-form-block cp-field-full">
            <h3>Negocio y oferta</h3>
            <div className="cp-form-grid">
              <label>
                Ciudad
                <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              </label>
              <label>
                Pais
                <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
              </label>
              <label>
                Industria
                <input value={form.industry} onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))} />
              </label>
              <label>
                Que vendes (tipo)
                <select value={form.sells} onChange={(event) => setForm((prev) => ({ ...prev, sells: event.target.value as MarketingForm["sells"] }))}>
                  <option value="productos">Productos</option>
                  <option value="servicios">Servicios</option>
                  <option value="mixto">Mixto</option>
                </select>
              </label>
              <label className="cp-field-full">
                Que vendes (detalle)
                <textarea
                  value={form.sells_detail}
                  onChange={(event) => setForm((prev) => ({ ...prev, sells_detail: event.target.value }))}
                  placeholder="Describe productos o servicios principales."
                />
              </label>
              <label>
                Cantidad de productos a impulsar
                <input
                  type="number"
                  min={1}
                  max={20000}
                  value={form.products_to_promote}
                  onChange={(event) => setForm((prev) => ({ ...prev, products_to_promote: Number(event.target.value || 1) }))}
                />
              </label>
              <label>
                Ticket promedio (MXN)
                <input
                  type="number"
                  min={0}
                  value={form.average_ticket_mxn}
                  onChange={(event) => setForm((prev) => ({ ...prev, average_ticket_mxn: Number(event.target.value || 0) }))}
                />
              </label>
              <label>
                Oferta clara (nivel)
                <select value={form.offer_clarity} onChange={(event) => setForm((prev) => ({ ...prev, offer_clarity: event.target.value as MarketingForm["offer_clarity"] }))}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label>
                Redes activas
                <input
                  value={form.active_social_networks}
                  onChange={(event) => setForm((prev) => ({ ...prev, active_social_networks: event.target.value }))}
                  placeholder="Instagram, Facebook, TikTok, WhatsApp..."
                />
              </label>
              <label className="cp-field-full">
                Oferta o propuesta actual
                <textarea
                  value={form.offer_summary}
                  onChange={(event) => setForm((prev) => ({ ...prev, offer_summary: event.target.value }))}
                  placeholder="Describe tu oferta principal y diferenciadores."
                />
              </label>
            </div>
          </article>

          <article className="cp-form-block cp-field-full">
            <h3>Objetivo y conversion</h3>
            <div className="cp-form-grid">
              <label>
                Objetivo principal
                <select value={form.main_goal} onChange={(event) => setForm((prev) => ({ ...prev, main_goal: event.target.value as MarketingForm["main_goal"] }))}>
                  <option value="reconocimiento">Reconocimiento</option>
                  <option value="leads">Leads</option>
                  <option value="ventas">Ventas</option>
                  <option value="distribuidores">Distribuidores</option>
                  <option value="recompra">Recompra</option>
                </select>
              </label>
              <label>
                Canal de conversion deseado
                <select
                  value={form.desired_conversion_channel}
                  onChange={(event) => setForm((prev) => ({ ...prev, desired_conversion_channel: event.target.value as MarketingForm["desired_conversion_channel"] }))}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="formulario">Formulario</option>
                  <option value="landing">Landing</option>
                  <option value="ecommerce">Ecommerce</option>
                  <option value="pos">POS</option>
                </select>
              </label>
              <label>
                Urgencia
                <select value={form.urgency} onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value as MarketingForm["urgency"] }))}>
                  <option value="inmediata">Inmediata</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label>
                Nivel de seguimiento
                <select
                  value={form.followup_level}
                  onChange={(event) => setForm((prev) => ({ ...prev, followup_level: event.target.value as MarketingForm["followup_level"] }))}
                >
                  <option value="alto">Alto</option>
                  <option value="medio">Medio</option>
                  <option value="bajo">Bajo</option>
                </select>
              </label>
            </div>
          </article>

          <article className="cp-form-block cp-field-full">
            <h3>Estado digital y necesidades</h3>
            <div className="cp-form-grid">
              <label className="checkbox">
                <input type="checkbox" checked={form.has_landing} onChange={(event) => setForm((prev) => ({ ...prev, has_landing: event.target.checked }))} />
                Tiene landing
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.has_ecommerce} onChange={(event) => setForm((prev) => ({ ...prev, has_ecommerce: event.target.checked }))} />
                Tiene ecommerce
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.needs_extra_landing} onChange={(event) => setForm((prev) => ({ ...prev, needs_extra_landing: event.target.checked }))} />
                Necesita landing adicional
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.needs_extra_ecommerce} onChange={(event) => setForm((prev) => ({ ...prev, needs_extra_ecommerce: event.target.checked }))} />
                Necesita ecommerce adicional
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.needs_commercial_tracking}
                  onChange={(event) => setForm((prev) => ({ ...prev, needs_commercial_tracking: event.target.checked }))}
                />
                Necesita seguimiento comercial
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.wants_custom_proposal}
                  onChange={(event) => setForm((prev) => ({ ...prev, wants_custom_proposal: event.target.checked }))}
                />
                Quiere propuesta personalizada
              </label>
              <label className="cp-field-full">
                Comentarios / notas del cliente
                <textarea value={form.client_notes} onChange={(event) => setForm((prev) => ({ ...prev, client_notes: event.target.value }))} />
              </label>
            </div>
          </article>

          <div className="cp-cta-row cp-field-full">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar revision comercial"}
            </button>
            <Link className="button button-outline" to="/comercia/consultoria">Prefiero consultoria</Link>
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="cp-success">{success}</p> : null}
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-grid">
          <div>
            <h3>ComerCia Marketing</h3>
            <p>Captacion, conversion y seguimiento comercial para crecer con enfoque.</p>
          </div>
          <div>
            <h4>Navegacion</h4>
            <Link to="/comercia">Inicio</Link>
            <Link to="/comercia/precios">Precios</Link>
            <Link to="/comercia/consultoria">Consultoria</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
