import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { StorefrontHomePayload } from "../types/domain";

type LandingSection = { title?: string; body?: string };
type LandingDraft = {
  hero_title?: string;
  hero_subtitle?: string;
  cta_primary?: string;
  cta_secondary?: string;
  contact_cta?: string;
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
  "¿Qué marcas industriales maneja TODOINDUSTRIALMX?",
  "¿Realizan envíos en México y Latinoamérica?",
  "¿Pueden cotizar por aplicación o por número de parte?",
  "¿Aceptan Mercado Pago para anticipo y pedido especial?",
];

export function StorefrontLandingPage() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la landing."));
  }, [tenantSlug]);

  const isPreview = searchParams.get("preview") === "1";

  if (error) {
    return (
      <main className="route-landing-industrial">
        <section className="landing-shell">
          <h1>Landing no disponible</h1>
          <p>{error}</p>
          <Link className="button" to={`/store/${tenantSlug}`}>
            Ir al catálogo
          </Link>
        </section>
      </main>
    );
  }
  if (!data) return <p>Cargando landing comercial...</p>;

  const config = parseConfig(data.storefront_config?.config_json);
  const draft = (config.landing_draft as LandingDraft | undefined) ?? {};
  const heroTitle = draft.hero_title?.trim() || data.branding?.hero_title || "Entregamos soluciones en transmisión de potencia";
  const heroSubtitle =
    draft.hero_subtitle?.trim() ||
    data.branding?.hero_subtitle ||
    "Más de 30 años resolviendo refacciones industriales con marcas reconocidas, respuesta comercial rápida y cobertura nacional.";
  const ctaPrimary = draft.cta_primary?.trim() || "Cotizar ahora";
  const ctaSecondary = draft.cta_secondary?.trim() || "Ver catálogo industrial";
  const sections = (draft.sections ?? []).filter((section) => section.title || section.body);
  const faqItems = draft.faq_items?.filter((item) => item.trim()) ?? INDUSTRIAL_FAQ;
  const quickAnswers = draft.quick_answer_blocks?.filter((item) => item.trim()) ?? [
    "Sí, cotizamos por aplicación, por marca y por SKU técnico.",
    "Sí, tenemos cobertura para México y atención comercial para Latinoamérica.",
    "Sí, puedes pagar por Mercado Pago, transferencia o anticipo B2B.",
  ];
  const stats = useMemo(
    () => [
      { label: "Años de experiencia", value: "30+" },
      { label: "Cobertura comercial", value: "MX + LATAM" },
      { label: "Marcas distribuidas", value: "ZSG · SKF · Timken · FAG · FULO" },
      { label: "Atención técnica", value: "Postventa especializada" },
    ],
    []
  );

  const whatsapp = data.branding?.contact_whatsapp ? `https://wa.me/52${data.branding.contact_whatsapp}` : undefined;

  return (
    <main className="route-landing-industrial">
      <section className="landing-hero-industrial">
        <div className="landing-chip-row">
          <span className="chip">{isPreview ? "Modo preview" : "Sitio productivo"}</span>
          <span className="chip">Industrial premium</span>
        </div>
        <h1>{heroTitle}</h1>
        <p>{heroSubtitle}</p>
        <div className="landing-hero-actions">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            {ctaSecondary}
          </Link>
          {whatsapp ? (
            <a className="button button-outline" href={whatsapp} target="_blank" rel="noreferrer">
              {ctaPrimary}
            </a>
          ) : (
            <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores`}>
              {ctaPrimary}
            </Link>
          )}
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
          {stats.map((stat) => (
            <article key={stat.label} className="landing-stat-card">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>

        <section className="landing-block">
          <h2>Categorías técnicas prioritarias</h2>
          <div className="landing-category-grid">
            {INDUSTRIAL_CATEGORIES.map((category) => (
              <article key={category} className="landing-category-card">
                <h3>{category}</h3>
                <p>Disponibilidad para industria, taller y distribución comercial.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-block landing-two-col">
          <article>
            <h2>Propuesta de valor industrial</h2>
            <p>Excelente calidad al mejor precio con asesoría técnica y seguimiento postventa real para continuidad operativa.</p>
            <ul>
              <li>Distribución de marcas reconocidas con respuesta rápida.</li>
              <li>Soporte comercial para cotización por volumen y proyectos.</li>
              <li>Atención para mantenimiento, reemplazo y línea automotriz.</li>
            </ul>
          </article>
          <article>
            <h2>Logística y cobertura</h2>
            <p>Operación en CDMX con cobertura para México y soporte comercial para Latinoamérica.</p>
            <ul>
              <li>Entrega programada y seguimiento por pedido.</li>
              <li>Gestión de refacciones de rotación alta y recurrente.</li>
              <li>Canal B2B con opciones de anticipo y crédito.</li>
            </ul>
          </article>
        </section>

        {sections.length > 0 ? (
          <section className="landing-block">
            <h2>Contenido comercial</h2>
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
            <h2>FAQ técnico comercial</h2>
            <ul>
              {faqItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2>Respuestas rápidas (AEO)</h2>
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
          <p>Contactos: Ing. Jorge Luis Perea · Flor María Cedeño</p>
          <div className="landing-hero-actions">
            <Link className="button" to={`/store/${data.tenant.slug}`}>
              Ver catálogo y comprar
            </Link>
            <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores`}>
              Portal distribuidores B2B
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
