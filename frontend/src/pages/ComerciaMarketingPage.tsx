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
  location: string;
  industry: string;
  sells: "productos" | "servicios" | "mixto";
  main_goal: "reconocimiento" | "leads" | "ventas" | "distribuidores" | "recompra";
  desired_conversion_channel: "whatsapp" | "formulario" | "landing" | "ecommerce" | "pos";
  urgency: "inmediata" | "alta" | "media" | "baja";
  message: string;
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
  location: "",
  industry: "",
  sells: "productos",
  main_goal: "ventas",
  desired_conversion_channel: "ecommerce",
  urgency: "media",
  message: "",
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
        location: form.location,
        industry: form.industry,
        sells: form.sells,
        main_goal: form.main_goal,
        desired_conversion_channel: form.desired_conversion_channel,
        active_social_networks: "",
        products_to_promote: 1,
        average_ticket_mxn: 1000,
        offer_clarity: "",
        urgency: form.urgency,
        followup_level: "medio",
        has_landing: false,
        has_ecommerce: false,
        needs_extra_landing: false,
        needs_extra_ecommerce: false,
        needs_commercial_tracking: true,
        wants_custom_proposal: true,
        client_notes: form.message,
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
          <h2>Solicita una sesion de marketing comercial</h2>
        </header>
        <form className="cp-simple-form" onSubmit={submit}>
          <label>
            Nombre de contacto
            <input required value={form.contact_name} onChange={(event) => setForm((prev) => ({ ...prev, contact_name: event.target.value }))} />
          </label>
          <label>
            Correo
            <input required type="email" value={form.contact_email} onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))} />
          </label>
          <label>
            Telefono
            <input required value={form.contact_phone} onChange={(event) => setForm((prev) => ({ ...prev, contact_phone: event.target.value }))} />
          </label>
          <label>
            Marca / empresa
            <input required value={form.company_brand} onChange={(event) => setForm((prev) => ({ ...prev, company_brand: event.target.value }))} />
          </label>
          <label>
            Ciudad / pais
            <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
          </label>
          <label>
            Industria
            <input value={form.industry} onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))} />
          </label>
          <label>
            Que vendes
            <select value={form.sells} onChange={(event) => setForm((prev) => ({ ...prev, sells: event.target.value as MarketingForm["sells"] }))}>
              <option value="productos">Productos</option>
              <option value="servicios">Servicios</option>
              <option value="mixto">Mixto</option>
            </select>
          </label>
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
          <label className="cp-field-full">
            Comentarios
            <textarea value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
          </label>
          <div className="cp-cta-row cp-field-full">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar marketing"}
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
