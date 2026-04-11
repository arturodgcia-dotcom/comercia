import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BrandSetupWorkflow, CommercialClientAccount, Tenant } from "../types/domain";
import { buildBrandChannelUrls } from "../utils/brandChannelUrls";

type ChannelState = "creado" | "en_configuracion" | "pendiente";

type ChannelSummary = {
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  clientAccountId: number | null;
  clientName: string;
  wizardStatus: string;
  landing: ChannelState;
  publicStore: ChannelState;
  distributorStore: ChannelState;
  webapp: ChannelState;
  landingUrl: string;
  publicUrl: string;
  distributorUrl: string;
  webappUrl: string;
  setupUrl: string;
};

function toLabel(state: ChannelState): string {
  if (state === "creado") return "Creado";
  if (state === "en_configuracion") return "En configuración";
  return "Pendiente";
}

function toStateFromStep(status: string | undefined, approved: boolean | undefined): ChannelState {
  if (approved) return "creado";
  if (status === "in_progress") return "en_configuracion";
  return "pendiente";
}

function toAbsolute(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${window.location.origin}${path}`;
}

export function ReinpiaCreatedChannelsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<CommercialClientAccount[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [workflows, setWorkflows] = useState<Record<number, BrandSetupWorkflow>>({});
  const [accountFilter, setAccountFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    Promise.all([
      api.getReinpiaCommercialClientAccounts(token).catch(() => []),
      api.getTenants(token),
    ])
      .then(async ([accountRows, tenantRows]) => {
        setAccounts(accountRows);
        setTenants(tenantRows);
        const pairs = await Promise.all(
          tenantRows.map(async (tenant) => {
            try {
              const workflow = await api.getBrandSetupWorkflow(token, tenant.id);
              return [tenant.id, workflow] as const;
            } catch {
              return null;
            }
          })
        );
        const map: Record<number, BrandSetupWorkflow> = {};
        for (const row of pairs) {
          if (!row) continue;
          map[row[0]] = row[1];
        }
        setWorkflows(map);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar canales creados."))
      .finally(() => setLoading(false));
  }, [token]);

  const summaries = useMemo<ChannelSummary[]>(() => {
    const accountNameById = new Map<number, string>();
    for (const account of accounts) {
      accountNameById.set(account.id, account.legal_name);
    }
    return tenants.map((tenant) => {
      const workflow = workflows[tenant.id];
      const fallbackRoutes = buildBrandChannelUrls(tenant.slug);
      const routes = workflow?.channel_routes;
      const stepByCode = new Map((workflow?.steps ?? []).map((step) => [step.code, step]));
      const landingStep = stepByCode.get("landing_setup");
      const publicStep = stepByCode.get("ecommerce_setup");
      const distributorsStep = stepByCode.get("distributors_setup");
      const posStep = stepByCode.get("pos_setup");
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        clientAccountId: tenant.commercial_client_account_id ?? null,
        clientName: accountNameById.get(Number(tenant.commercial_client_account_id || 0)) ?? "Sin cliente principal",
        wizardStatus: workflow?.wizard_status ?? "borrador",
        landing: toStateFromStep(landingStep?.status, landingStep?.approved),
        publicStore: toStateFromStep(publicStep?.status, publicStep?.approved),
        distributorStore: toStateFromStep(distributorsStep?.status, distributorsStep?.approved),
        webapp: toStateFromStep(posStep?.status, posStep?.approved),
        landingUrl: routes?.landing_url ?? fallbackRoutes.landingInternalUrl,
        publicUrl: routes?.public_url ?? fallbackRoutes.publicUrl,
        distributorUrl: routes?.distributors_url ?? fallbackRoutes.distributorsUrl,
        webappUrl: routes?.pos_preview_url ?? fallbackRoutes.posPreviewUrl,
        setupUrl: `/reinpia/brands/${tenant.id}/setup`,
      };
    });
  }, [accounts, tenants, workflows]);

  const visibleRows = useMemo(
    () =>
      summaries.filter((row) => {
        if (accountFilter && String(row.clientAccountId || "") !== accountFilter) return false;
        if (tenantFilter && String(row.tenantId) !== tenantFilter) return false;
        return true;
      }),
    [summaries, accountFilter, tenantFilter]
  );

  return (
    <section>
      <PageHeader
        title="Canales creados"
        subtitle="Vista administrativa global de activos creados por cliente y marca: landing, ecommerce público, ecommerce distribuidores y WebApp/POS."
      />
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Cargando activos creados...</p> : null}

      <article className="card">
        <h3>Filtros administrativos</h3>
        <div className="inline-form">
          <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="">Todos los clientes</option>
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

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Matriz de canales creados</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente principal</th>
                <th>Marca</th>
                <th>Wizard</th>
                <th>Landing</th>
                <th>Ecommerce público</th>
                <th>Ecommerce distribuidores</th>
                <th>WebApp/POS</th>
                <th>Rutas activas</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.tenantId}>
                  <td>{row.clientName}</td>
                  <td>{row.tenantName}</td>
                  <td>{row.wizardStatus}</td>
                  <td>{toLabel(row.landing)}</td>
                  <td>{toLabel(row.publicStore)}</td>
                  <td>{toLabel(row.distributorStore)}</td>
                  <td>{toLabel(row.webapp)}</td>
                  <td>
                    <div className="row-gap">
                      <a className="button button-outline" href={toAbsolute(row.landingUrl)} target="_blank" rel="noreferrer">Abrir landing</a>
                      <a className="button button-outline" href={toAbsolute(row.publicUrl)} target="_blank" rel="noreferrer">Abrir ecommerce público</a>
                      <a className="button button-outline" href={toAbsolute(row.distributorUrl)} target="_blank" rel="noreferrer">Abrir distribuidores</a>
                      <a className="button button-outline" href={toAbsolute(row.webappUrl)} target="_blank" rel="noreferrer">Abrir WebApp/POS</a>
                    </div>
                  </td>
                  <td>
                    <Link className="button" to={row.setupUrl}>
                      Abrir wizard
                    </Link>
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={9}>No hay resultados para los filtros actuales.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
