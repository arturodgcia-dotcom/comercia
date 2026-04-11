import { Link, useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { LiaSalesAssistant } from "../components/marketing/LiaSalesAssistant";
import "./ComerciaLandingPage.css";

const PROBLEMAS = [
  "Canales de venta desconectados entre ecommerce, POS y distribuidores.",
  "Baja conversion por falta de estructura comercial y seguimiento.",
  "Escalamiento lento por depender de herramientas separadas.",
];

const SEGMENTOS = [
  {
    nombre: "Retail y comercio",
    detalle: "Catalogo, promociones, POS y ecommerce en una sola operacion.",
  },
  {
    nombre: "Servicios y consultorias",
    detalle: "Landing de conversion, agenda comercial y seguimiento de prospectos.",
  },
  {
    nombre: "Distribucion y mayoreo",
    detalle: "Canal B2B con reglas comerciales, volumen y control de margen.",
  },
];

const PLANES_RESUMEN = [
  { nombre: "Basico", texto: "Activa tu operacion digital y valida mercado rapido." },
  { nombre: "Growth", texto: "Escala ventas con automatizacion y mayor capacidad." },
  { nombre: "Premium", texto: "Control empresarial para equipos, marcas y canales." },
];

const SERVICIOS_EXTRA = [
  "Logistica para recoleccion, entrega y control operativo.",
  "Jornada laboral y agenda para equipos de servicio.",
  "NFC software, venta de equipos y paquetes de tarjetas.",
];

export function ComerciaLandingPage() {
  const navigate = useNavigate();
  const openLia = () => {
    window.dispatchEvent(new Event("lia:open"));
  };

  return (
    <main className="comercia-premium cp-animate-up">
      <CookieConsentBanner />

      <nav className="cp-nav">
        <div>
          <p className="cp-kicker">ComerCia by REINPIA</p>
          <h1>Plataforma comercial para vender mas sin saturar tu operacion</h1>
          <p className="cp-brand-context">
            Landing, ecommerce, distribuidores, POS y automatizacion comercial en una arquitectura clara.
          </p>
        </div>
        <div className="cp-nav-actions">
          <LanguageSelector />
          <Link className="button button-outline" to="/comercia/precios">Precios</Link>
          <Link className="button button-outline" to="/comercia/marketing">Marketing</Link>
          <Link className="button button-outline" to="/comercia/consultoria">Consultoria</Link>
        </div>
      </nav>

      <section className="cp-hero">
        <article className="cp-hero-copy">
          <p className="cp-eyebrow">Plataforma SaaS comercial</p>
          <h2>Convierte tu marca en una operacion digital ordenada, escalable y rentable.</h2>
          <p>
            ComerCia integra captacion, venta y operacion para que tu equipo ejecute con foco comercial y sin herramientas
            dispersas.
          </p>
          <div className="cp-cta-row">
            <Link className="button" to="/comercia/precios">Ver planes y add-ons</Link>
            <Link className="button button-outline" to="/comercia/consultoria">Solicitar revision comercial</Link>
            <button className="button button-outline" type="button" onClick={openLia}>Hablar con Lia</button>
          </div>
        </article>
        <article className="cp-main-mock cp-mock-card">
          <p>Resumen ejecutivo</p>
          <h3>Que resuelve ComerCia</h3>
          <ul>
            <li>Centraliza canales de venta y datos comerciales.</li>
            <li>Mejora conversion con estructura digital orientada a resultados.</li>
            <li>Escala por etapas con planes y add-ons por capacidad.</li>
          </ul>
        </article>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Propuesta de valor</p>
          <h2>Lo esencial, sin ruido operativo</h2>
          <p>
            Esta landing principal concentra la vision ejecutiva. El detalle de precios, marketing y consultoria vive en
            subpaginas especializadas para mantener una experiencia clara.
          </p>
        </header>
        <div className="cp-simple-grid">
          {PROBLEMAS.map((item) => (
            <article key={item} className="cp-simple-card">
              <h3>Problema resuelto</h3>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Industrias</p>
          <h2>Tipos de negocio que atendemos</h2>
        </header>
        <div className="cp-simple-grid">
          {SEGMENTOS.map((segmento) => (
            <article key={segmento.nombre} className="cp-simple-card">
              <h3>{segmento.nombre}</h3>
              <p>{segmento.detalle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Resumen de planes</p>
          <h2>Elige la ruta comercial que mejor se adapta a tu etapa</h2>
        </header>
        <div className="cp-simple-grid">
          {PLANES_RESUMEN.map((plan) => (
            <article key={plan.nombre} className="cp-simple-card">
              <h3>{plan.nombre}</h3>
              <p>{plan.texto}</p>
            </article>
          ))}
        </div>
        <div className="cp-cta-row">
          <Link className="button" to="/comercia/precios">Ir a precios completos</Link>
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Servicios extra</p>
          <h2>Capacidad adicional para operacion y crecimiento</h2>
        </header>
        <div className="cp-simple-grid">
          {SERVICIOS_EXTRA.map((servicio) => (
            <article key={servicio} className="cp-simple-card">
              <h3>Add-on comercial</h3>
              <p>{servicio}</p>
            </article>
          ))}
        </div>
        <div className="cp-cta-row">
          <Link className="button button-outline" to="/comercia/precios">Ver add-ons y servicios</Link>
        </div>
      </section>

      <section className="cp-section cp-final-cta">
        <p className="cp-kicker">Siguiente paso</p>
        <h2>Explora el contenido comercial por objetivo</h2>
        <div className="cp-cta-row">
          <Link className="button" to="/comercia/precios">Precios</Link>
          <Link className="button button-outline" to="/comercia/marketing">Marketing</Link>
          <Link className="button button-outline" to="/comercia/consultoria">Consultoria</Link>
        </div>
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-grid">
          <div>
            <h3>ComerCia</h3>
            <p>Plataforma comercial para crecimiento digital, operacion y escalamiento multicanal.</p>
          </div>
          <div>
            <h4>Navegacion</h4>
            <Link to="/comercia">Inicio</Link>
            <Link to="/comercia/precios">Precios</Link>
            <Link to="/comercia/marketing">Marketing</Link>
            <Link to="/comercia/consultoria">Consultoria</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link to="/legal/privacidad">Politica de privacidad</Link>
            <Link to="/legal/cookies">Politica de cookies</Link>
            <Link to="/legal/proteccion-datos">Proteccion de datos</Link>
          </div>
        </div>
      </footer>

      <LiaSalesAssistant
        referralCode=""
        onOpenDiagnostic={() => navigate("/comercia/consultoria")}
        onOpenContact={() => navigate("/comercia/consultoria")}
        onOpenPackages={() => navigate("/comercia/precios")}
      />
    </main>
  );
}
