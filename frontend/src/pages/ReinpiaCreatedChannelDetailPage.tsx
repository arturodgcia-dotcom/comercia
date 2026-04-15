import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BrandAdminSettings, BrandSetupWorkflow, Tenant, TenantBranding } from "../types/domain";
import { buildBrandChannelUrls } from "../utils/brandChannelUrls";

type ChannelKey = "landing" | "public" | "distributors" | "pos";

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  landing: "Landing",
  public: "Ecommerce público",
  distributors: "Ecommerce distribuidores",
  pos: "WebApp / POS",
};

function toAbsolute(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${window.location.origin}${path}`;
}

function resolveRoute(workflow: BrandSetupWorkflow | null, slug: string, channel: ChannelKey): string {
  const fallback = buildBrandChannelUrls(slug);
  const routes = workflow?.channel_routes;
  if (channel === "landing") return routes?.landing_url ?? fallback.landingInternalUrl;
  if (channel === "public") return routes?.public_url ?? fallback.publicUrl;
  if (channel === "distributors") return routes?.distributors_url ?? fallback.distributorsUrl;
  return routes?.pos_preview_url ?? fallback.posPreviewUrl;
}

function resolveTemplate(workflow: BrandSetupWorkflow | null, channel: ChannelKey): string {
  if (!workflow) return "Sin plantilla";
  if (channel === "landing") return workflow.landing_template ?? "approved_landing_v1";
  if (channel === "public") return workflow.public_store_template ?? "approved_public_v1";
  if (channel === "distributors") return workflow.distributor_store_template ?? "approved_b2b_v1";
  return "pos_webapp_operativo_v1";
}

function resolveUpdated(workflow: BrandSetupWorkflow | null, channel: ChannelKey): string {
  if (!workflow) return "Sin registro";
  const runtime = workflow.channel_runtime;
  if (channel === "landing" && runtime?.landing_last_regenerated_at) return runtime.landing_last_regenerated_at;
  if (channel === "public" && runtime?.public_last_regenerated_at) return runtime.public_last_regenerated_at;
  if (channel === "distributors" && runtime?.distributors_last_regenerated_at) return runtime.distributors_last_regenerated_at;
  const stepCode: Record<ChannelKey, string> = {
    landing: "landing_setup",
    public: "ecommerce_setup",
    distributors: "distributors_setup",
    pos: "pos_setup",
  };
  const step = workflow.steps.find((item) => item.code === stepCode[channel]);
  return step?.updated_at ?? "Sin registro";
}

function resolveState(workflow: BrandSetupWorkflow | null, channel: ChannelKey): string {
  if (!workflow) return "pendiente";
  const stepCode: Record<ChannelKey, string> = {
    landing: "landing_setup",
    public: "ecommerce_setup",
    distributors: "distributors_setup",
    pos: "pos_setup",
  };
  const step = workflow.steps.find((item) => item.code === stepCode[channel]);
  if (step?.approved) return "creado";
  if (step?.status === "in_progress") return "en configuración";
  return "pendiente";
}

function resolveLocale(settings: BrandAdminSettings | null, channel: ChannelKey): string {
  if (!settings) return "Sin definir";
  const row = (settings.country_channels ?? []).find((item) => {
    if (channel === "landing") return item.landing_enabled;
    if (channel === "public") return item.ecommerce_enabled;
    if (channel === "distributors") return item.ecommerce_enabled;
    return item.webapp_enabled;
  });
  const country = row?.country_code ?? settings.country_code;
  const language = row?.language ?? settings.language_primary;
  const currency = row?.currency ?? settings.currency_base_currency;
  return `${country} / ${language} / ${currency}`;
}

export function ReinpiaCreatedChannelDetailPage() {
  const { token } = useAuth();
  const params = useParams<{ tenantId: string; channelKey: string }>();
  const tenantId = Number(params.tenantId || 0);
  const channelKey = (params.channelKey || "landing") as ChannelKey;
  const channelValid = channelKey === "landing" || channelKey === "public" || channelKey === "distributors" || channelKey === "pos";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [workflow, setWorkflow] = useState<BrandSetupWorkflow | null>(null);
  const [settings, setSettings] = useState<BrandAdminSettings | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [clientName, setClientName] = useState("Sin cliente principal");

  useEffect(() => {
    if (!token || !tenantId || !channelValid) return;
    setLoading(true);
    Promise.all([
      api.getTenantById(token, tenantId),
      api.getBrandSetupWorkflow(token, tenantId).catch(() => null),
      api.getBrandAdminSettings(token, tenantId).catch(() => null),
      api.getTenantBranding(token, tenantId).catch(() => null),
      api.getReinpiaCommercialClientAccounts(token).catch(() => []),
    ])
      .then(([tenantData, workflowData, settingsData, brandingData, accounts]) => {
        setTenant(tenantData);
        setWorkflow(workflowData);
        setSettings(settingsData);
        setBranding(brandingData);
        const account = accounts.find((item) => item.id === tenantData.commercial_client_account_id);
        setClientName(account?.legal_name ?? "Sin cliente principal");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar el detalle del canal."))
      .finally(() => setLoading(false));
  }, [token, tenantId, channelValid, channelKey]);

  const summary = useMemo(() => {
    if (!tenant || !channelValid) return null;
    return {
      channelName: CHANNEL_LABELS[channelKey],
      state: resolveState(workflow, channelKey),
      template: resolveTemplate(workflow, channelKey),
      route: resolveRoute(workflow, tenant.slug, channelKey),
      locale: resolveLocale(settings, channelKey),
      updatedAt: resolveUpdated(workflow, channelKey),
      wizardStatus: workflow?.wizard_status ?? "borrador",
    };
  }, [tenant, channelKey, channelValid, workflow, settings]);

  if (!channelValid) {
    return (
      <section>
        <PageHeader title="Detalle de canal" subtitle="Canal no vÃ¡lido." />
        <Link className="button" to="/reinpia/canales-creados">
          Volver a canales creados
        </Link>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title={`Detalle administrativo: ${CHANNEL_LABELS[channelKey]}`}
        subtitle="Vista consolidada por cliente principal, marca y canal creado."
      />
      {loading ? <p className="muted">Cargando detalle del canal...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && tenant && summary ? (
        <article className="card">
          <h3>{summary.channelName}</h3>
          <div className="card-grid">
            <article className="card">
              <h4>Cliente principal</h4>
              <p>{clientName}</p>
            </article>
            <article className="card">
              <h4>Marca</h4>
              <p>{tenant.name}</p>
            </article>
            <article className="card">
              <h4>Tipo de canal</h4>
              <p>{summary.channelName}</p>
            </article>
            <article className="card">
              <h4>Estado</h4>
              <p>{summary.state}</p>
            </article>
            <article className="card">
              <h4>Plantilla activa</h4>
              <p>{summary.template}</p>
            </article>
            <article className="card">
              <h4>Ruta activa</h4>
              <p>{summary.route}</p>
            </article>
            <article className="card">
              <h4>País / idioma / moneda</h4>
              <p>{summary.locale}</p>
            </article>
            <article className="card">
              <h4>Última regeneración/configuración</h4>
              <p>{summary.updatedAt}</p>
            </article>
            <article className="card">
              <h4>Estado general setup</h4>
              <p>{summary.wizardStatus}</p>
            </article>
          </div>
          <article className="card" style={{ marginTop: "12px" }}>
            <h4>Branding aplicado</h4>
            <p>Color primario: {branding?.primary_color ?? "Sin definir"}</p>
            <p>Color secundario: {branding?.secondary_color ?? "Sin definir"}</p>
            <p>Logo: {branding?.logo_url ?? "Sin definir"}</p>
          </article>
          <div className="row-gap" style={{ marginTop: "12px" }}>
            <a className="button button-outline" href={toAbsolute(summary.route)} target="_blank" rel="noreferrer">
              Abrir canal
            </a>
            <Link className="button button-outline" to={`/reinpia/tenants/${tenant.id}`}>
              Abrir ficha de marca
            </Link>
            <Link className="button" to="/reinpia/canales-creados">
              Volver a canales creados
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}


