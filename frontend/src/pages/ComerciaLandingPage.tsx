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
  {
    nombre: "Logistica comercial",
    descripcion: "Operacion de recoleccion y entrega con visibilidad por marca y sucursal.",
    puntos: [
      "Solicitudes de recoleccion y entregas",
      "Seguimiento operativo por evento",
      "Control por sucursal",
      "Operacion propia o asistida",
    ],
  },
  {
    nombre: "Jornada laboral",
    descripcion: "Organiza equipos, turnos e incidencias para mejorar ejecucion diaria.",
    puntos: [
      "Gestion de empleados",
      "Control de asistencia",
      "Turnos y cobertura operativa",
      "Incidencias y reportes",
    ],
  },
  {
    nombre: "NFC para operacion",
    descripcion: "Infraestructura NFC para identificacion, tarjetas y control comercial.",
    puntos: [
      "Software por sucursal",
      "Grabado y programacion NFC",
      "Control de tarjetas",
      "Impresion y equipos compatibles",
    ],
  },
];

const RESPUESTAS_RAPIDAS = [
  {
    pregunta: "Que hace ComerCia por una marca que quiere vender en linea?",
    respuesta: "Centraliza landing, ecommerce, distribuidores y POS para convertir mas y operar con menos friccion.",
  },
  {
    pregunta: "ComerCia solo vende software?",
    respuesta: "No. Tambien integra servicios complementarios de logistica, jornada laboral y NFC segun tu etapa comercial.",
  },
  {
    pregunta: "Puede activarse por fases?",
    respuesta: "Si. Puedes iniciar con plan base y escalar con add-ons y consultoria comercial segun crecimiento.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: RESPUESTAS_RAPIDAS.map((item) => ({
    "@type": "Question",
    name: item.pregunta,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.respuesta,
    },
  })),
};

const SERVICES_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: SERVICIOS_EXTRA.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: item.nombre,
      description: item.descripcion,
    },
  })),
};

export function ComerciaLandingPage() {
  const navigate = useNavigate();
  const openLia = () => {
    window.dispatchEvent(new Event("lia:open"));
  };

  return (
    <main className="comercia-premium cp-animate-up">
      <CookieConsentBanner />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICES_JSON_LD) }} />

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
          <h2>Vende en linea, opera mejor y escala tus canales comerciales en una sola plataforma.</h2>
          <p>
            ComerCia te ayuda a activar ecommerce, distribuidores y automatizacion comercial para crecer con estructura y
            control real.
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
          <h2>Que resuelve ComerCia para crecimiento comercial</h2>
          <p>
            ComerCia conecta venta, operacion y seguimiento para que tu negocio no dependa de herramientas aisladas.
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
        <article className="cp-simple-card">
          <h3>Resultado esperado</h3>
          <ul className="cp-seo-list">
            <li>Vender en linea con embudo comercial claro.</li>
            <li>Operar mejor con procesos, seguimiento y reportes.</li>
            <li>Crecer con canales comerciales y distribuidores activos.</li>
            <li>Conectar automatizacion comercial para acelerar conversion.</li>
          </ul>
        </article>
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
          <p className="cp-kicker">Servicios complementarios</p>
          <h2>ComerCia tambien ofrece logistica, jornada laboral y NFC</h2>
          <p>
            Ademas del software comercial base, puedes integrar servicios complementarios para ampliar capacidad sin frenar
            la operacion.
          </p>
        </header>
        <div className="cp-service-stack">
          {SERVICIOS_EXTRA.map((servicio) => (
            <article key={servicio.nombre} className="cp-service-card">
              <h3>{servicio.nombre}</h3>
              <p>{servicio.descripcion}</p>
              <ul className="cp-seo-list">
                {servicio.puntos.map((punto) => (
                  <li key={`${servicio.nombre}-${punto}`}>{punto}</li>
                ))}
              </ul>
              <div className="cp-cta-row">
                <Link className="button button-outline" to="/comercia/precios">Ver opciones y precios</Link>
                <Link className="button button-outline" to="/comercia/consultoria">Solicitar consulta</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">Preguntas frecuentes</p>
          <h2>Respuestas rapidas para decision comercial</h2>
        </header>
        <div className="cp-simple-grid">
          {RESPUESTAS_RAPIDAS.map((item) => (
            <article key={item.pregunta} className="cp-simple-card">
              <h3>{item.pregunta}</h3>
              <p>{item.respuesta}</p>
            </article>
          ))}
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
