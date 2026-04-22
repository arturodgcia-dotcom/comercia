import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { StorefrontHomePayload } from "../types/domain";

type LandingSection = { title?: string; body?: string };
type LandingDraft = {
  hero_title?: string;
  hero_subtitle?: string;
  cta_primary?: string;
  cta_secondary?: string;
  sections?: LandingSection[];
  faq_items?: string[];
  quick_answer_blocks?: string[];
};

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

const INDUSTRIAL_CATEGORIES = [
  "Baleros",
  "Chumaceras",
  "Cadenas",
  "Catarinas",
  "Bandas",
  "Acoples",
  "Retenes",
  "Lubricantes",
  "Refacciones industriales",
];

const INDUSTRIAL_FAQ = [
  "Que marcas industriales maneja TODOINDUSTRIALMX?",
  "Realizan envios en Mexico y Latinoamerica?",
  "Pueden cotizar por aplicacion o por numero de parte?",
  "Aceptan Mercado Pago para anticipo y pedido especial?",
];

const QUICK_ANSWERS = [
  "Si, cotizamos por aplicacion, por marca y por SKU tecnico.",
  "Si, tenemos cobertura para Mexico y atencion comercial para Latinoamerica.",
  "Si, puedes pagar por Mercado Pago, transferencia o anticipo B2B.",
];

const LANDING_STATS = [
  { label: "Anos de experiencia", value: "30+" },
  { label: "Cobertura comercial", value: "MX + LATAM" },
  { label: "Marcas distribuidas", value: "ZSG - SKF - Timken - FAG - FULO" },
  { label: "Atencion tecnica", value: "Postventa especializada" },
];

export function StorefrontLandingPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la landing."));
  }, [tenantSlug]);

  if (error) {
    return (
      <main className="route-landing-industrial">
        <section className="landing-shell">
          <h1>Landing no disponible</h1>
          <p>{error}</p>
          <Link className="button" to={`/store/${tenantSlug}`}>
            Ir al catalogo
          </Link>
        </section>
      </main>
    );
  }
  if (!data) return <p>Cargando landing comercial...</p>;

  const config = parseConfig(data.storefront_config?.config_json);
  const draft = (config.landing_draft as LandingDraft | undefined) ?? {};
  const sections = (draft.sections ?? []).filter((section) => section.title || section.body);
  const faqItems = draft.faq_items?.filter((item) => item.trim()) ?? INDUSTRIAL_FAQ;
  const quickAnswers = draft.quick_answer_blocks?.filter((item) => item.trim()) ?? QUICK_ANSWERS;
  const heroTitle = draft.hero_title?.trim() || data.branding?.hero_title || "Entregamos soluciones en transmision de potencia";
  const heroSubtitle =
    draft.hero_subtitle?.trim() ||
    data.branding?.hero_subtitle ||
    "Distribucion industrial de refacciones con respaldo tecnico, disponibilidad comercial y enfoque en continuidad operativa.";
  const ctaPrimary = draft.cta_primary?.trim() || "Cotizar por WhatsApp";
  const ctaSecondary = draft.cta_secondary?.trim() || "Ver catalogo industrial";
  const whatsapp = data.branding?.contact_whatsapp ? `https://wa.me/52${data.branding.contact_whatsapp}` : "https://wa.me/525511791417";

  return (
    <main className="route-landing-industrial">
      <section className="landing-hero-industrial">
        <div className="landing-chip-row">
          <span className="chip">Sitio productivo</span>
          <span className="chip">Industrial premium</span>
        </div>
        <h1>{heroTitle}</h1>
        <p>{heroSubtitle}</p>
        <img
          className="landing-hero-visual"
          src="/client-assets/todoindustrialmx/hero_baleros_caliper.jpg"
          alt="Linea industrial TodoIndustrialMX"
        />
        <div className="landing-hero-actions">
          <a className="button" href={whatsapp} target="_blank" rel="noreferrer">
            {ctaPrimary}
          </a>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}`}>
            {ctaSecondary}
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores`}>
            Portal distribuidores
          </Link>
        </div>
      </section>

      <section className="landing-shell">
        <div className="landing-logo-strip">
          <img src="/client-assets/todoindustrialmx/logo_zsg.jpg" alt="ZSG" />
          <img src="/client-assets/todoindustrialmx/logo_skf.jpg" alt="SKF" />
          <img src="/client-assets/todoindustrialmx/logo_timken.png" alt="Timken" />
          <img src="/client-assets/todoindustrialmx/logo_fag.png" alt="FAG" />
          <img src="/client-assets/todoindustrialmx/logo_fulo.png" alt="FULO" />
        </div>

        <div className="landing-stat-grid">
          {LANDING_STATS.map((stat) => (
            <article key={stat.label} className="landing-stat-card">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>

        <section className="landing-block">
          <h2>Categorias tecnicas prioritarias</h2>
          <div className="landing-category-grid">
            {INDUSTRIAL_CATEGORIES.map((category) => (
              <article key={category} className="landing-category-card">
                <h3>{category}</h3>
                <p>Disponibilidad para industria, taller y distribucion comercial.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-block landing-two-col">
          <article>
            <h2>Propuesta de valor industrial</h2>
            <p>Excelente calidad al mejor precio con asesoria tecnica y seguimiento postventa para continuidad operativa.</p>
            <ul>
              <li>Distribucion de marcas reconocidas con respuesta rapida.</li>
              <li>Soporte comercial para cotizacion por volumen y proyectos.</li>
              <li>Linea automotriz, retenes, lubricantes y material ferretero.</li>
            </ul>
          </article>
          <article>
            <h2>Experiencia, cobertura y logistica</h2>
            <p>Operacion en CDMX con cobertura para Mexico y soporte comercial para Latinoamerica.</p>
            <ul>
              <li>Entrega programada y seguimiento por pedido.</li>
              <li>Gestion de refacciones de rotacion alta y recurrente.</li>
              <li>Canal B2B con opciones de anticipo y credito.</li>
            </ul>
          </article>
        </section>

        <section className="landing-block landing-two-col">
          <article>
            <h2>Bloque automotriz y servicio tecnico</h2>
            <p>Suministro para automotriz, industria ligera y pesada con acompanamiento tecnico comercial.</p>
          </article>
          <article>
            <h2>Mision y vision</h2>
            <p>Mision: resolver necesidades de transmision de potencia con servicio tecnico comercial confiable.</p>
            <p>Vision: consolidar una red industrial referente en Mexico y Latinoamerica para distribucion y postventa.</p>
          </article>
        </section>

        {sections.length > 0 ? (
          <section className="landing-block">
            <h2>Contenido comercial adicional</h2>
            <div className="landing-category-grid">
              {sections.map((section, index) => (
                <article key={`${section.title ?? "section"}-${index}`} className="landing-category-card">
                  <h3>{section.title ?? `Bloque ${index + 1}`}</h3>
                  <p>{section.body ?? ""}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="landing-block landing-two-col">
          <article>
            <h2>FAQ tecnico comercial</h2>
            <ul>
              {faqItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2>Respuestas rapidas (AEO)</h2>
            <ul>
              {quickAnswers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="landing-contact">
          <h2>Contacto comercial</h2>
          <p>Tel: 55-90397409 · WhatsApp: 55-11791417 · Email: {data.branding?.contact_email ?? "todoindustrialmx@gmail.com"}</p>
          <p>Calle Zaragoza 18, Azcapotzalco Centro, CP 02000, CDMX</p>
          <p>Contactos: Ing. Jorge Luis Perea · Flor Maria Cedeno</p>
          <div className="landing-hero-actions">
            <a className="button" href={whatsapp} target="_blank" rel="noreferrer">
              Cotizar ahora
            </a>
            <Link className="button button-outline" to={`/store/${data.tenant.slug}`}>
              Abrir catalogo
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
