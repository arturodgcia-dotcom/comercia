import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { StorefrontHomePayload } from "../types/domain";
import { resolveOfficialChannelTemplatesFromConfig } from "../branding/officialChannelTemplates";

type LandingSection = { title?: string; body?: string };
type LandingDraft = {
  hero_title?: string;
  hero_subtitle?: string;
  cta_primary?: string;
  cta_secondary?: string;
  contact_cta?: string;
  sections?: LandingSection[];
};

type WorkflowPayload = {
  selected_template?: string;
  flow_type?: string;
  is_published?: boolean;
};

type IdentityPayload = {
  has_existing_landing?: boolean;
  existing_landing_url?: string;
};

type ParsedLandingConfig = {
  landingDraft: LandingDraft | null;
  selectedTemplate: string;
  flowType: string;
  isPublished: boolean;
  identity: IdentityPayload;
};

type DemoLandingContent = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  contactCta: string;
  sections: Array<{ title: string; body: string }>;
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

function normalizeExternalUrl(raw?: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function isUsableExternalUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return !(
      host.endsWith(".demo") ||
      host.endsWith(".local") ||
      host.endsWith(".invalid") ||
      host.includes("example")
    );
  } catch {
    return false;
  }
}

function resolveLandingConfig(payload: StorefrontHomePayload | null): ParsedLandingConfig {
  const parsed = parseConfig(payload?.storefront_config?.config_json);
  const workflow = (parsed.workflow as WorkflowPayload | undefined) ?? {};
  const identity = (parsed.identity_data as IdentityPayload | undefined) ?? {};
  const channelTemplates = resolveOfficialChannelTemplatesFromConfig(payload?.storefront_config?.config_json);
  const selectedTemplate = channelTemplates.landing_template;
  return {
    landingDraft: (parsed.landing_draft as LandingDraft | undefined) ?? null,
    selectedTemplate,
    flowType: String(workflow.flow_type ?? "without_landing"),
    isPublished: Boolean(workflow.is_published),
    identity,
  };
}

function buildDemoLandingContent(payload: StorefrontHomePayload): DemoLandingContent {
  const tenantName = payload.tenant.name;
  const businessType = payload.tenant.business_type;
  const isTulipanes = tenantName.toLowerCase().includes("tulipanes");
  if (isTulipanes) {
    return {
      heroTitle: payload.branding?.hero_title ?? `${tenantName}: formación profesional con enfoque práctico`,
      heroSubtitle:
        payload.branding?.hero_subtitle ??
        "Especialízate en cosmetología, podología, cursos y diplomados con una experiencia educativa clara y orientada a resultados.",
      ctaPrimary: "Solicitar diagnóstico académico",
      ctaSecondary: "Ver programas disponibles",
      contactCta: "Agenda una asesoría personalizada para construir tu ruta de formación profesional.",
      sections: [
        {
          title: "Propuesta de valor",
          body: "Formación profesional con metodología práctica, docentes especializados y seguimiento individual."
        },
        {
          title: "Beneficios principales",
          body: "Programas actualizados, enfoque en empleabilidad, acompañamiento comercial y crecimiento profesional."
        },
        {
          title: "Oferta formativa",
          body: "Cosmetología integral, podología clínica, cursos intensivos y diplomados para especialización."
        }
      ]
    };
  }

  return {
    heroTitle: payload.branding?.hero_title ?? `${tenantName}: landing comercial tenant-aware`,
    heroSubtitle:
      payload.branding?.hero_subtitle ??
      (businessType === "services"
        ? "Presenta servicios y convierte oportunidades con estructura comercial clara."
        : "Muestra catálogo y propuesta de valor con una experiencia de marca coherente."),
    ctaPrimary: "Solicitar diagnóstico comercial",
    ctaSecondary: "Conocer propuesta completa",
    contactCta: "Comparte tu objetivo y te mostramos una ruta comercial lista para ejecución.",
    sections: [
      {
        title: "Propuesta de valor",
        body: "Landing interna de revisión conectada al branding de la marca activa."
      },
      {
        title: "Beneficios",
        body: "Mensajes claros, jerarquía comercial y estructura lista para evaluación."
      },
      {
        title: "Oferta principal",
        body: "Bloques de contenido listos para validar antes de publicación definitiva."
      }
    ]
  };
}

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
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la landing de la marca."));
  }, [tenantSlug]);

  if (error) {
    return (
      <main className="storefront">
        <section className="store-banner">
          <h1>Landing de marca no disponible</h1>
          <p className="error">{error}</p>
          <Link className="button" to={`/store/${tenantSlug}`}>
            Ir al ecommerce publico
          </Link>
        </section>
      </main>
    );
  }

  if (!data) return <p>Cargando landing de marca...</p>;

  const isPreview = searchParams.get("preview") === "1";
  const landingConfig = resolveLandingConfig(data);
  const demoContent = buildDemoLandingContent(data);
  const landingDraft = landingConfig.landingDraft;
  const hasInternalLanding =
    Boolean(
      landingDraft?.hero_title ||
        landingDraft?.hero_subtitle ||
        (landingDraft?.sections?.length ?? 0) > 0 ||
        data.branding?.hero_title ||
        data.storefront_config?.landing_enabled
    );
  const externalLandingUrl = normalizeExternalUrl(landingConfig.identity.existing_landing_url);
  const externalLandingAvailable = Boolean(landingConfig.identity.has_existing_landing && isUsableExternalUrl(externalLandingUrl));
  const landingSections =
    landingDraft?.sections?.filter((section) => section.title || section.body) ??
    demoContent.sections;
  const heroTitle = landingDraft?.hero_title ?? data.branding?.hero_title ?? demoContent.heroTitle;
  const heroSubtitle =
    landingDraft?.hero_subtitle ??
    data.branding?.hero_subtitle ??
    demoContent.heroSubtitle;
  const ctaPrimary = landingDraft?.cta_primary?.trim() || demoContent.ctaPrimary;
  const ctaSecondary = landingDraft?.cta_secondary?.trim() || demoContent.ctaSecondary;
  const publicationState = landingConfig.isPublished ? "publicado" : isPreview ? "en revision" : "borrador";

  return (
    <main className="storefront premium-store">
      <section
        className="store-hero premium-hero"
        style={{
          background: `linear-gradient(130deg, ${data.branding?.primary_color ?? "#0d3e86"}, ${
            data.branding?.secondary_color ?? "#5f97e3"
          })`,
        }}
      >
        <p className="marketing-eyebrow">{isPreview ? "Preview landing" : "Landing publicada"}</p>
        <p className="chip">Template activo: {landingConfig.selectedTemplate}</p>
        <h1>{heroTitle}</h1>
        <p>{heroSubtitle}</p>
        <div className="row-gap">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            {ctaPrimary}
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores`}>
            {ctaSecondary}
          </Link>
          {externalLandingAvailable && !hasInternalLanding ? (
            <a className="button button-outline" href={externalLandingUrl ?? undefined} target="_blank" rel="noreferrer">
              Abrir landing externa
            </a>
          ) : null}
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Marca</h3>
          <p>{data.tenant.name}</p>
          <p className="muted">Slug: {data.tenant.slug}</p>
        </article>
        <article className="card">
          <h3>Estado de publicacion</h3>
          <p className="chip">{publicationState}</p>
          <p className="muted">Preview: {isPreview ? "Si" : "No"}</p>
        </article>
        <article className="card">
          <h3>Tipo de landing</h3>
          <p>{hasInternalLanding ? "Template interno aprobado" : externalLandingAvailable ? "Landing externa validada" : "Template en preparacion"}</p>
          <p className="muted">Slug tenant: {data.tenant.slug}</p>
        </article>
      </section>

      {landingSections.length > 0 ? (
        <section className="card-grid">
          {landingSections.map((section, index) => (
            <article className="card" key={`${section.title ?? "section"}-${index}`}>
              <h3>{section.title ?? `Seccion ${index + 1}`}</h3>
              <p>{section.body ?? "Contenido en preparacion."}</p>
            </article>
          ))}
        </section>
      ) : (
        <section className="store-banner">
          <h2>Contenido de landing</h2>
          <p>
            Esta marca aun no tiene bloques de contenido publicados en su template interno. Puedes continuar con el ecommerce
            publico mientras se finaliza la aprobacion del contenido comercial.
          </p>
        </section>
      )}

      {landingDraft?.contact_cta || demoContent.contactCta ? (
        <section className="store-banner">
          <h2>Llamado comercial</h2>
          <p>{landingDraft?.contact_cta ?? demoContent.contactCta}</p>
        </section>
      ) : null}
    </main>
  );
}
