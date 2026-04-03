import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const selectedTemplateRaw =
    workflow.selected_template ?? parsed.landing_template ?? parsed.landing_mode ?? `tenant-${payload?.tenant.slug ?? "sin-slug"}-landing`;
  const selectedTemplate = String(selectedTemplateRaw).trim() || `tenant-${payload?.tenant.slug ?? "sin-slug"}-landing`;
  return {
    landingDraft: (parsed.landing_draft as LandingDraft | undefined) ?? null,
    selectedTemplate,
    flowType: String(workflow.flow_type ?? "without_landing"),
    isPublished: Boolean(workflow.is_published),
    identity,
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
  const landingDraft = landingConfig.landingDraft;
  const hasInternalLanding =
    Boolean(landingDraft?.hero_title || landingDraft?.hero_subtitle || data.branding?.hero_title || data.storefront_config?.landing_enabled) &&
    landingConfig.flowType !== "with_existing_landing";
  const externalLandingUrl = normalizeExternalUrl(landingConfig.identity.existing_landing_url);
  const externalLandingAvailable = Boolean(landingConfig.identity.has_existing_landing && isUsableExternalUrl(externalLandingUrl));
  const landingSections =
    landingDraft?.sections?.filter((section) => section.title || section.body) ?? [];
  const heroTitle = landingDraft?.hero_title ?? data.branding?.hero_title ?? `${data.tenant.name} en COMERCIA`;
  const heroSubtitle =
    landingDraft?.hero_subtitle ??
    data.branding?.hero_subtitle ??
    "Landing comercial tenant-aware conectada con ecommerce publico, canal distribuidores y operacion POS.";
  const ctaPrimary = landingDraft?.cta_primary?.trim() || "Ir al ecommerce publico";
  const ctaSecondary = landingDraft?.cta_secondary?.trim() || "Ir al canal distribuidores";
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

      {landingDraft?.contact_cta ? (
        <section className="store-banner">
          <h2>Llamado comercial</h2>
          <p>{landingDraft.contact_cta}</p>
        </section>
      ) : null}
    </main>
  );
}
