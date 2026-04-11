import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CommercialAccountAiCredits, CommercialAccountUsage, CommercialClientAccount, InternalAlert, Tenant } from "../types/domain";
import { resolveCapacitySuggestion } from "../utils/capacityActions";

type NewAccountForm = {
  legal_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_model: "fixed_subscription" | "commission_based";
  commercial_plan_key: string;
};

const DEFAULT_FORM: NewAccountForm = {
  legal_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  billing_model: "fixed_subscription",
  commercial_plan_key: "fixed_subscription_basic",
};

export function ReinpiaCommercialClientsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<CommercialClientAccount[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [usage, setUsage] = useState<Record<number, CommercialAccountUsage>>({});
  const [aiCredits, setAiCredits] = useState<Record<number, CommercialAccountAiCredits>>({});
  const [tenantAlerts, setTenantAlerts] = useState<Record<number, InternalAlert[]>>({});
  const [draftDistribution, setDraftDistribution] = useState<Record<number, Record<number, { assigned_tokens: number; reserved_tokens: number }>>>({});
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [assignTenantId, setAssignTenantId] = useState<number>(0);
  const [assignAsParent, setAssignAsParent] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [accounts, tenantList] = await Promise.all([
        api.getReinpiaCommercialClientAccounts(token),
        api.getTenants(token),
      ]);
      setRows(accounts);
      setTenants(tenantList);
      const usagePairs = await Promise.all(accounts.map(async (account) => [account.id, await api.getReinpiaCommercialClientAccountUsage(token, account.id)] as const));
      setUsage(Object.fromEntries(usagePairs));
      const creditsPairs = await Promise.all(
        accounts.map(async (account) => [account.id, await api.getReinpiaCommercialClientAccountAiCredits(token, account.id)] as const)
      );
      const alertPairs = await Promise.all(
        tenantList.map(async (tenant) => [tenant.id, await api.getTenantOperationalAlerts(token, tenant.id, "is_read=false").catch(() => [])] as const)
      );
      setTenantAlerts(Object.fromEntries(alertPairs));
      const creditsMap = Object.fromEntries(creditsPairs);
      setAiCredits(creditsMap);
      const draft: Record<number, Record<number, { assigned_tokens: number; reserved_tokens: number }>> = {};
      for (const [accountIdRaw, payload] of Object.entries(creditsMap)) {
        const accountId = Number(accountIdRaw);
        draft[accountId] = {};
        for (const brand of payload.brands) {
          draft[accountId][brand.tenant_id] = {
            assigned_tokens: brand.assigned_tokens,
            reserved_tokens: brand.reserved_tokens,
          };
        }
      }
      setDraftDistribution(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar clientes comerciales.");
    } finally {
      setLoading(false);
    }
  };

  const autoDistribute = async (accountId: number) => {
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.autoDistributeReinpiaCommercialClientAccountAiCredits(token, accountId);
      setMessage("Distribucion automatica aplicada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible aplicar distribucion automatica.");
    } finally {
      setSaving(false);
    }
  };

  const saveManualDistribution = async (accountId: number) => {
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const allocations = Object.entries(draftDistribution[accountId] ?? {}).map(([tenantId, values]) => ({
        tenant_id: Number(tenantId),
        assigned_tokens: Number(values.assigned_tokens || 0),
        reserved_tokens: Number(values.reserved_tokens || 0),
      }));
      await api.updateReinpiaCommercialClientAccountAiCreditDistribution(token, accountId, { allocations });
      setMessage("Distribucion manual guardada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar distribucion manual.");
    } finally {
      setSaving(false);
    }
  };

  const setDraftValue = (accountId: number, tenantId: number, key: "assigned_tokens" | "reserved_tokens", value: number) => {
    setDraftDistribution((prev) => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] ?? {}),
        [tenantId]: {
          assigned_tokens: prev[accountId]?.[tenantId]?.assigned_tokens ?? 0,
          reserved_tokens: prev[accountId]?.[tenantId]?.reserved_tokens ?? 0,
          [key]: Math.max(0, Number.isFinite(value) ? value : 0),
        },
      },
    }));
  };

  const toggleOverride = async (tenantId: number, active: boolean) => {
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.updateReinpiaTenantAiCreditOverride(token, tenantId, {
        active,
        reason: active ? "override operativo REINPIA" : "cierre de override",
      });
      setMessage(active ? "Override IA activado." : "Override IA desactivado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar override.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.createReinpiaCommercialClientAccount(token, {
        ...form,
        status: "active",
        commercial_limits_json: "{}",
        addons_json: "{}",
      });
      setForm(DEFAULT_FORM);
      setMessage("Cliente comercial creado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear cliente comercial.");
    } finally {
      setSaving(false);
    }
  };

  const assignTenant = async () => {
    if (!token || !selectedAccount || !assignTenantId) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.assignTenantToCommercialClientAccount(token, selectedAccount, {
        tenant_id: assignTenantId,
        is_parent_brand: assignAsParent,
      });
      setMessage("Marca asignada al cliente comercial.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible asignar marca.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddonCheckout = async (
    addonCode: string,
    context: { tenantId: number; accountId: number; resourceOrigin: string; uiOrigin: "dashboard_global" | "alert" },
  ) => {
    if (!token) return;
    try {
      setLoadingCheckout(`${context.tenantId}:${addonCode}`);
      setError("");
      const baseUrl = window.location.origin;
      const response = await api.createCommercialPlanCheckoutSession(token, {
        tenant_id: context.tenantId,
        client_account_id: context.accountId,
        item_code: addonCode,
        add_on_code: addonCode,
        resource_origin: context.resourceOrigin,
        ui_origin: context.uiOrigin,
        success_url: `${baseUrl}/reinpia/clientes-comerciales?checkout=success`,
        cancel_url: `${baseUrl}/reinpia/clientes-comerciales?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar la compra en este momento. Intenta nuevamente.");
    } finally {
      setLoadingCheckout("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Clientes Comerciales"
        subtitle="Control de cliente, marca padre/hijas, limites por plan y uso real de recursos."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {loading ? <p className="muted">Cargando...</p> : null}

      <div className="card-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <article className="card">
          <h3>Alta de cliente comercial</h3>
          <form className="detail-form" onSubmit={createAccount}>
            <label>Razon social / cliente
              <input required value={form.legal_name} onChange={(e) => setForm((p) => ({ ...p, legal_name: e.target.value }))} />
            </label>
            <label>Contacto
              <input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
            </label>
            <label>Correo
              <input type="email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} />
            </label>
            <label>Telefono
              <input value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
            </label>
            <label>Modelo comercial
              <select value={form.billing_model} onChange={(e) => setForm((p) => ({ ...p, billing_model: e.target.value as NewAccountForm["billing_model"] }))}>
                <option value="fixed_subscription">Cuota fija (sin comision)</option>
                <option value="commission_based">Comision por venta</option>
              </select>
            </label>
            <label>Plan comercial
              <select value={form.commercial_plan_key} onChange={(e) => setForm((p) => ({ ...p, commercial_plan_key: e.target.value }))}>
                <option value="fixed_subscription_basic">Basico sin comision</option>
                <option value="fixed_subscription_growth">Growth sin comision</option>
                <option value="fixed_subscription_premium">Premium sin comision</option>
                <option value="commission_based_basic">Basico con comision</option>
                <option value="commission_based_growth">Growth con comision</option>
                <option value="commission_based_premium">Premium con comision</option>
              </select>
            </label>
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear cliente comercial"}
            </button>
          </form>
        </article>

        <article className="card">
          <h3>Asignar marca padre/hija</h3>
          <label>
            Cliente comercial
            <select value={selectedAccount ?? ""} onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Selecciona...</option>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.legal_name}</option>
              ))}
            </select>
          </label>
          <label>
            Marca
            <select value={assignTenantId || ""} onChange={(e) => setAssignTenantId(Number(e.target.value || 0))}>
              <option value="">Selecciona...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={assignAsParent} onChange={(e) => setAssignAsParent(e.target.checked)} />
            Marcar como marca padre
          </label>
          <button className="button" type="button" disabled={saving || !selectedAccount || !assignTenantId} onClick={() => void assignTenant()}>
            {saving ? "Asignando..." : "Asignar marca"}
          </button>
        </article>
      </div>

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Control de uso por cliente</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plan</th>
                <th>Marcas</th>
                <th>Usuarios</th>
                <th>Productos</th>
                <th>Sucursales</th>
                    <th>Tokens IA</th>
                    <th>Riesgo IA</th>
                  </tr>
                </thead>
                <tbody>
              {rows.map((row) => {
                const u = usage[row.id];
                return (
                  <tr key={row.id}>
                    <td>{row.legal_name}</td>
                    <td>{row.commercial_plan_key ?? "-"}</td>
                    <td>{u ? `${u.brands_used}/${u.brands_limit}` : "-"}</td>
                    <td>{u ? `${u.users_used}/${u.users_limit}` : "-"}</td>
                    <td>{u ? `${u.products_used}/${u.products_limit}` : "-"}</td>
                    <td>{u ? `${u.branches_used}/${u.branches_limit}` : "-"}</td>
                    <td>{u ? `${u.ai_tokens_remaining} disp / ${u.ai_tokens_included + u.ai_tokens_extra}` : "-"}</td>
                    <td>{u ? `Warn ${u.brands_warning} | Bloq ${u.brands_blocked} | Ovr ${u.brands_override}` : "-"}</td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={8}>No hay clientes comerciales registrados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Marcas en riesgo operativo</h3>
        <p>Acciones rapidas para ampliar capacidad o sugerir upgrade de plan sin salir del panel global.</p>
        <div className="card-grid">
          {tenants.map((tenant) => {
            const accountId = Number(tenant.commercial_client_account_id || 0);
            if (!accountId) return null;
            const account = rows.find((row) => row.id === accountId);
            const alerts = (tenantAlerts[tenant.id] || []).filter((item) => String(item.related_entity_type || "").includes("capacity_"));
            if (!alerts.length) return null;
            const alert = alerts[0];
            const suggestion = resolveCapacitySuggestion(alert.related_entity_type);
            const showUpgrade = String(alert.severity || "").toLowerCase() !== "info";
            return (
              <article className="card" key={`risk-${tenant.id}`}>
                <p className="marketing-tag">{alert.severity}</p>
                <h4>{tenant.name}</h4>
                <p>{alert.message}</p>
                <p><strong>Cliente:</strong> {account?.legal_name || "Sin cliente principal"}</p>
                <div className="row-gap">
                  {suggestion ? (
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={Boolean(loadingCheckout)}
                      onClick={() => void handleAddonCheckout(suggestion.addonCode, {
                        tenantId: tenant.id,
                        accountId,
                        resourceOrigin: suggestion.resource,
                        uiOrigin: "dashboard_global",
                      })}
                    >
                      {loadingCheckout === `${tenant.id}:${suggestion.addonCode}` ? "Redirigiendo..." : suggestion.addonLabel}
                    </button>
                  ) : null}
                  {showUpgrade ? (
                    <button
                      className="button"
                      type="button"
                      disabled={Boolean(saving)}
                      onClick={() => void api.createCommercialPlanRequest(token || "", {
                        tenant_id: tenant.id,
                        request_type: "upgrade",
                        target_plan_key: "growth_fixed",
                        notes: `Solicitud de upgrade desde panel global por alerta ${alert.related_entity_type || "capacidad"}.`,
                      }).then(() => setMessage("Solicitud de mejora de plan registrada.")).catch((err) => setError(err instanceof Error ? err.message : "No fue posible registrar la solicitud de upgrade."))}
                    >
                      Mejorar plan
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
          {!tenants.some((tenant) => (tenantAlerts[tenant.id] || []).some((item) => String(item.related_entity_type || "").includes("capacity_"))) ? (
            <p>Sin marcas en riesgo de capacidad en este momento.</p>
          ) : null}
        </div>
      </article>

      {rows.map((row) => {
        const credit = aiCredits[row.id];
        if (!credit) return null;
        return (
          <article className="card" style={{ marginTop: "12px" }} key={`ai-${row.id}`}>
            <h3>Creditos IA por marca - {row.legal_name}</h3>
            <p>
              Capacidad total: {credit.total_tokens_capacity} | Asignados: {credit.total_tokens_assigned} | Consumidos: {credit.total_tokens_consumed}
              {" | "}Reservados: {credit.total_tokens_reserved} | Restantes: {credit.total_tokens_remaining}
            </p>
            <div className="row-gap" style={{ marginBottom: "8px" }}>
              <button className="button button-outline" type="button" disabled={saving} onClick={() => void autoDistribute(row.id)}>
                {saving ? "Procesando..." : "Distribucion automatica"}
              </button>
              <button className="button" type="button" disabled={saving} onClick={() => void saveManualDistribution(row.id)}>
                {saving ? "Guardando..." : "Guardar distribucion manual"}
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Marca</th>
                    <th>Incluidos plan</th>
                    <th>Extra asignados</th>
                    <th>Asignados</th>
                    <th>Reservados</th>
                    <th>Consumidos</th>
                    <th>Restantes</th>
                    <th>% consumo</th>
                    <th>Llave IA</th>
                    <th>Override</th>
                  </tr>
                </thead>
                <tbody>
                  {credit.brands.map((brand) => (
                    <tr key={`${row.id}-${brand.tenant_id}`}>
                      <td>{brand.tenant_name}</td>
                      <td>{brand.included_by_plan}</td>
                      <td>{brand.extra_assigned}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={draftDistribution[row.id]?.[brand.tenant_id]?.assigned_tokens ?? brand.assigned_tokens}
                          onChange={(e) => setDraftValue(row.id, brand.tenant_id, "assigned_tokens", Number(e.target.value))}
                          style={{ width: "92px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={draftDistribution[row.id]?.[brand.tenant_id]?.reserved_tokens ?? brand.reserved_tokens}
                          onChange={(e) => setDraftValue(row.id, brand.tenant_id, "reserved_tokens", Number(e.target.value))}
                          style={{ width: "92px" }}
                        />
                      </td>
                      <td>{brand.consumed_tokens}</td>
                      <td>{brand.remaining_tokens}</td>
                      <td>{brand.percentage_consumed.toFixed(2)}%</td>
                      <td>{brand.key_state}</td>
                      <td>
                        <button
                          className="button button-outline"
                          type="button"
                          disabled={saving}
                          onClick={() => void toggleOverride(brand.tenant_id, !brand.override_active)}
                        >
                          {brand.override_active ? "Desactivar override" : "Activar override"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        );
      })}
    </section>
  );
}
