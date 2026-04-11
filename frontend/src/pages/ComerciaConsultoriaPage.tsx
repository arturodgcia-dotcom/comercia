import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { api } from "../services/api";
import "./ComerciaLandingPage.css";

type ConsultoriaForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  focus: "diagnostico_comercial" | "revision_operacion" | "automatizacion" | "consultoria_general";
  message: string;
};

const PILARES = [
  {
    titulo: "Diagnostico comercial",
    detalle: "Evaluamos embudo, canales y estructura de conversion para priorizar mejoras.",
  },
  {
    titulo: "Revision de operacion",
    detalle: "Revisamos procesos, capacidad y cuellos de botella que frenan crecimiento.",
  },
  {
    titulo: "Automatizacion",
    detalle: "Definimos automatizaciones viables para seguimiento, venta y postventa.",
  },
  {
    titulo: "Consultoria estrategica",
    detalle: "Ruta de implementacion por etapas con foco en resultado comercial.",
  },
];

const DEFAULT_FORM: ConsultoriaForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  focus: "diagnostico_comercial",
  message: "",
};

export function ComerciaConsultoriaPage() {
  const [form, setForm] = useState<ConsultoriaForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await api.createComerciaCustomerContactLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        contact_reason: "consultoria",
        message: `[${form.focus}] ${form.message}`,
        channel: "consultoria",
        status: "nuevo",
      });
      setSuccess("Tu solicitud de consultoria fue registrada. Te contactaremos para la revision.");
      setForm(DEFAULT_FORM);
    } catch {
      setError("No fue posible registrar la solicitud en este momento. Intenta nuevamente.");
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
          <h1>Consultoria y revision comercial</h1>
          <p className="cp-brand-context">Diagnostico, optimizacion operativa y automatizacion comercial guiada.</p>
        </div>
        <div className="cp-nav-actions">
          <LanguageSelector />
          <Link className="button button-outline" to="/comercia">Inicio</Link>
          <Link className="button button-outline" to="/comercia/precios">Precios</Link>
          <Link className="button button-outline" to="/comercia/marketing">Marketing</Link>
        </div>
      </nav>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Consultoria</p>
          <h2>Te ayudamos a mejorar resultado comercial y operacion</h2>
          <p>
            Esta subpagina esta enfocada en diagnostico comercial, revision de operacion, automatizacion y
            acompanamiento consultivo.
          </p>
        </header>
        <div className="cp-simple-grid">
          {PILARES.map((item) => (
            <article key={item.titulo} className="cp-simple-card">
              <h3>{item.titulo}</h3>
              <p>{item.detalle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Solicitud de contacto</p>
          <h2>Agenda una revision con nuestro equipo</h2>
        </header>
        <form className="cp-simple-form" onSubmit={submit}>
          <label>
            Nombre
            <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label>
            Correo
            <input required type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          </label>
          <label>
            Telefono
            <input required value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Empresa
            <input value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} />
          </label>
          <label>
            Enfoque principal
            <select value={form.focus} onChange={(event) => setForm((prev) => ({ ...prev, focus: event.target.value as ConsultoriaForm["focus"] }))}>
              <option value="diagnostico_comercial">Diagnostico comercial</option>
              <option value="revision_operacion">Revision de operacion</option>
              <option value="automatizacion">Automatizacion</option>
              <option value="consultoria_general">Consultoria general</option>
            </select>
          </label>
          <label className="cp-field-full">
            Comentarios
            <textarea value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
          </label>
          <div className="cp-cta-row cp-field-full">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar consultoria"}
            </button>
            <Link className="button button-outline" to="/comercia/precios">Ver precios</Link>
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="cp-success">{success}</p> : null}
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-grid">
          <div>
            <h3>ComerCia Consultoria</h3>
            <p>Acompanamiento comercial para convertir estrategia en ejecucion medible.</p>
          </div>
          <div>
            <h4>Navegacion</h4>
            <Link to="/comercia">Inicio</Link>
            <Link to="/comercia/precios">Precios</Link>
            <Link to="/comercia/marketing">Marketing</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
