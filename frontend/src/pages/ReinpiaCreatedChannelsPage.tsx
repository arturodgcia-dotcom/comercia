import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BrandAdminSettings, BrandSetupWorkflow, CommercialClientAccount, Tenant } from "../types/domain";
import { buildBrandChannelUrls } from "../utils/brandChannelUrls";

type ChannelKey = "landing" | "public" | "distributors" | "pos";
type ChannelState = "creado" | "en_configuracion" | "pendiente";

type ChannelMatrixRow = {
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  clientAccountId: number | null;
  clientName: string;
  channelKey: ChannelKey;
  channelName: string;
  state: ChannelState;
  templateActive: string;
  routeActive: string;
  countryLanguageCurrency: string;
  updatedAt: string;
  setupStatus: string;
};

function toStateFromStep(status: string | undefined, approved: boolean | undefined): ChannelState {
  if (approved) return "creado";
  if (status === "in_progress") return "en_configuracion";
  return "pendiente";
}

function toLabel(state: ChannelState): string {
  if (state === "creado") return "Creado";
  if (state === "en_configuracion") return "En configuración";
  return "Pendiente";
}

function toAbsolute(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${window.location.origin}${path}`;
}

function resolveLocaleByChannel(settings: BrandAdminSettings | undefined, channel: ChannelKey): string {
  if (!settings) return "Sin definir";
  const channels = settings.country_channels ?? [];
  const channelRow = channels.find((row) => {
    if (channel === "landing") return row.landing_enabled;
    if (channel === "public") return row.ecommerce_enabled;
    if (channel === "distributors") return row.ecommerce_enabled;
    return row.webapp_enabled;
  });
  const country = channelRow?.country_code ?? settings.country_code ?? "MX";
  const language = channelRow?.language ?? settings.language_primary ?? "es";
  const currency = channelRow?.currency ?? settings.currency_base_currency ?? "MXN";
  return `${country} / ${language} / ${currency}`;
}

function resolveRouteByChannel(workflow: BrandSetupWorkflow | undefined, tenantSlug: string, channel: ChannelKey): string {
  const fallbackRoutes = buildBrandChannelUrls(tenantSlug);
  const routes = workflow?.channel_routes;
  if (channel === "landing") return routes?.landing_url ?? fallbackRoutes.landingInternalUrl;
  if (channel === "public") return routes?.public_url ?? fallbackRoutes.publicUrl;
  if (channel === "distributors") return routes?.distributors_url ?? fallbackRoutes.distributorsUrl;
  return routes?.pos_preview_url ?? fallbackRoutes.posPreviewUrl;
}

function resolveTemplateByChannel(workflow: BrandSetupWorkflow | undefined, channel: ChannelKey): string {
  if (!workflow) return "Sin plantilla";
  if (channel === "landing") return workflow.landing_template ?? "retail_landing_impacto_fixed_subscription_v1";
  if (channel === "public") return workflow.public_store_template ?? "retail_public_store_impacto_fixed_subscription_v1";
  if (channel === "distributors") return workflow.distributor_store_template ?? "retail_distributor_store_impacto_fixed_subscription_v1";
  return workflow.webapp_template ?? "retail_webapp_impacto_fixed_subscription_v1";
}

function resolveUpdatedByChannel(workflow: BrandSetupWorkflow | undefined, channel: ChannelKey): string {
  if (!workflow) return "Sin registro";
  const runtime = workflow.channel_runtime;
  if (channel === "landing" && runtime?.landing_last_regenerated_at) return runtime.landing_last_regenerated_at;
  if (channel === "public" && runtime?.public_last_regenerated_at) return runtime.public_last_regenerated_at;
  if (channel === "distributors" && runtime?.distributors_last_regenerated_at) return runtime.distributors_last_regenerated_at;
  const codeByChannel: Record<ChannelKey, string> = {
    landing: "landing_setup",
    public: "ecommerce_setup",
    distributors: "distributors_setup",
    pos: "pos_setup",
  };
  const step = (workflow.steps ?? []).find((item) => item.code === codeByChannel[channel]);
  return step?.updated_at ?? "Sin registro";
}

export function ReinpiaCreatedChannelsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<CommercialClientAccount[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [workflows, setWorkflows] = useState<Record<number, BrandSetupWorkflow>>({});
  const [brandSettings, setBrandSettings] = useState<Record<number, BrandAdminSettings>>({});
  const [accountFilter, setAccountFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    Promise.all([api.getReinpiaCommercialClientAccounts(token).catch(() => []), api.getTenants(token)])
      .then(async ([accountRows, tenantRows]) => {
        setAccounts(accountRows);
        setTenants(tenantRows);
        const workflowPairs = await Promise.all(
          tenantRows.map(async (tenant) => {
            try {
              const data = await api.getBrandSetupWorkflow(token, tenant.id);
              return [tenant.id, data] as const;
            } catch {
              return null;
            }
          })
        );
        const settingsPairs = await Promise.all(
          tenantRows.map(async (tenant) => {
            try {
              const data = await api.getBrandAdminSettings(token, tenant.id);
              return [tenant.id, data] as const;
            } catch {
              return null;
            }
          })
        );
        const workflowMap: Record<number, BrandSetupWorkflow> = {};
        for (const pair of workflowPairs) {
          if (pair) workflowMap[pair[0]] = pair[1];
        }
        const settingsMap: Record<number, BrandAdminSettings> = {};
        for (const pair of settingsPairs) {
          if (pair) settingsMap[pair[0]] = pair[1];
        }
        setWorkflows(workflowMap);
        setBrandSettings(settingsMap);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar canales creados."))
      .finally(() => setLoading(false));
  }, [token]);

  const rows = useMemo<ChannelMatrixRow[]>(() => {
    const accountNameById = new Map<number, string>();
    for (const account of accounts) {
      accountNameById.set(account.id, account.legal_name);
    }
    const allRows: ChannelMatrixRow[] = [];
    const channelConfig: Array<{ key: ChannelKey; label: string; stepCode: string }> = [
      { key: "landing", label: "Landing", stepCode: "landing_setup" },
      { key: "public", label: "Ecommerce público", stepCode: "ecommerce_setup" },
      { key: "distributors", label: "Ecommerce distribuidores", stepCode: "distributors_setup" },
      { key: "pos", label: "WebApp / POS", stepCode: "pos_setup" },
    ];

    for (const tenant of tenants) {
      const workflow = workflows[tenant.id];
      const settings = brandSettings[tenant.id];
      const steps = new Map((workflow?.steps ?? []).map((step) => [step.code, step]));
      const clientId = tenant.commercial_client_account_id ?? null;
      const clientName = accountNameById.get(Number(clientId || 0)) ?? "Sin cliente principal";
      for (const channel of channelConfig) {
        const step = steps.get(channel.stepCode);
        allRows.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          clientAccountId: clientId,
          clientName,
          channelKey: channel.key,
          channelName: channel.label,
          state: toStateFromStep(step?.status, step?.approved),
          templateActive: resolveTemplateByChannel(workflow, channel.key),
          routeActive: resolveRouteByChannel(workflow, tenant.slug, channel.key),
          countryLanguageCurrency: resolveLocaleByChannel(settings, channel.key),
          updatedAt: resolveUpdatedByChannel(workflow, channel.key),
          setupStatus: workflow?.wizard_status ?? "borrador",
        });
      }
    }
    return allRows;
  }, [accounts, tenants, workflows, brandSettings]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (accountFilter && String(row.clientAccountId || "") !== accountFilter) return false;
        if (tenantFilter && String(row.tenantId) !== tenantFilter) return false;
        return true;
      }),
    [rows, accountFilter, tenantFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { clientName: string; clientId: number | null; brands: Map<number, ChannelMatrixRow[]> }>();
    for (const row of filteredRows) {
      const key = `${row.clientAccountId ?? "none"}:${row.clientName}`;
      if (!map.has(key)) {
        map.set(key, {
          clientName: row.clientName,
          clientId: row.clientAccountId,
          brands: new Map(),
        });
      }
      const client = map.get(key)!;
      if (!client.brands.has(row.tenantId)) {
        client.brands.set(row.tenantId, []);
      }
      client.brands.get(row.tenantId)!.push(row);
    }
    return Array.from(map.values());
  }, [filteredRows]);

  return (
    <section>
      <PageHeader
        title="Canales creados"
        subtitle="Módulo administrativo Ãºnico para ver activos ya creados por cliente principal, marca y canal."
      />
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Cargando consolidado de canales...</p> : null}

      <article className="card">
        <h3>Filtros</h3>
        <div className="inline-form">
          <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="">Todos los clientes principales</option>
            {accounts.map((account) => (
              <option key={account.id} value={String(account.id)}>
                {account.legal_name}
              </option>
            ))}
          </select>
          <select value={tenantFilter} onChange={(event) => setTenantFilter(event.target.value)}>
            <option value="">Todas las marcas</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={String(tenant.id)}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </article>

      {grouped.map((clientGroup) => (
        <article className="card" key={`${clientGroup.clientId ?? "none"}-${clientGroup.clientName}`} style={{ marginTop: "12px" }}>
          <h3>Cliente principal: {clientGroup.clientName}</h3>
          <p className="muted">Marcas asociadas: {clientGroup.brands.size}</p>
          {Array.from(clientGroup.brands.entries()).map(([tenantId, brandRows]) => (
            <div key={tenantId} style={{ marginTop: "10px" }}>
              <h4>{brandRows[0]?.tenantName ?? `Marca ${tenantId}`}</h4>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Estado</th>
                      <th>Plantilla activa</th>
                      <th>Ruta real</th>
                      <th>País / idioma / moneda</th>
                      <th>Última actualizaciÃ³n</th>
                      <th>AcciÃ³n principal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandRows.map((row) => (
                      <tr key={`${row.tenantId}-${row.channelKey}`}>
                        <td>{row.channelName}</td>
                        <td>{toLabel(row.state)}</td>
                        <td>{row.templateActive}</td>
                        <td>{row.routeActive}</td>
                        <td>{row.countryLanguageCurrency}</td>
                        <td>{row.updatedAt}</td>
                        <td>
                          <Link className="button" to={`/reinpia/canales-creados/${row.tenantId}/${row.channelKey}`}>
                            Ver detalle administrativo
                          </Link>
                        </td>
                        <td>
                          <div className="row-gap">
                            <a className="button button-outline" href={toAbsolute(row.routeActive)} target="_blank" rel="noreferrer">
                              Abrir canal
                            </a>
                            <Link className="button button-outline" to={`/reinpia/canales-creados/${row.tenantId}/${row.channelKey}`}>
                              Revisar estado
                            </Link>
                            <Link className="button button-outline" to={`/reinpia/tenants/${row.tenantId}`}>
                              Abrir ficha de marca
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </article>
      ))}

      {!loading && !grouped.length ? (
        <article className="card" style={{ marginTop: "12px" }}>
          <p>No hay activos creados para los filtros actuales.</p>
        </article>
      ) : null}
    </section>
  );
}




