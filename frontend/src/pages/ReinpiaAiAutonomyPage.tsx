import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AiAutonomyLevel, AiOrchestratorDashboard, AiProviderSetting } from "../types/domain";

const EMPTY_DASHBOARD: AiOrchestratorDashboard = {
  orchestrator_status: "inactivo",
  active_tenants: 0,
  logical_agents_catalog: [],
  selected_tenant: null,
  executions_total: 0,
  skipped_total: 0,
  tokens_used_total: 0,
  tokens_saved_total: 0,
  recent_executions: [],
  recent_skips: [],
};

const EVENT_OPTIONS = [
  "new_lead",
  "new_ticket",
  "campaign_request",
  "abandoned_cart",
  "sentinel_alert",
  "user_explicit_request",
  "scheduled_high_value_review",
  "sentinel_deep_scan",
];

export function ReinpiaAiAutonomyPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<AiOrchestratorDashboard>(EMPTY_DASHBOARD);
  const [providers, setProviders] = useState<AiProviderSetting[]>([]);
  const [levels, setLevels] = useState<AiAutonomyLevel[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [triggerForm, setTriggerForm] = useState({
    event_type: "new_lead",
    event_channel: "dashboard",
    execution_priority: "normal",
    execution_cost_estimate: 70,
  });

  const load = async (tenantId?: number) => {
    if (!token) return;
    const [dash, providerRows, autonomyRows] = await Promise.all([
      api.getAiOrchestratorDashboard(token, tenantId ? { tenant_id: tenantId } : undefined),
      api.getAiProviderSettings(token),
      api.getAiAutonomyLevels(token),
    ]);
    setDashboard(dash);
    setProviders(providerRows);
    setLevels(autonomyRows);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar el orquestador IA"));
  }, [token]);

  const selectedTenant = dashboard.selected_tenant;

  const activeProviders = useMemo(() => providers.filter((provider) => provider.is_enabled), [providers]);

  const autonomyLabel = useMemo(() => {
    if (!selectedTenant) return "No definido";
    const row = levels.find((item) => item.level === selectedTenant.autonomy_level);
    return row?.display_name || `Nivel ${selectedTenant.autonomy_level}`;
  }, [levels, selectedTenant]);

  const triggerEvent = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!token || !selectedTenant) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await api.triggerAiOrchestratorEvent(token, {
        tenant_id: selectedTenant.tenant_id,
        brand_id: selectedTenant.tenant_id,
        event_type: triggerForm.event_type,
        event_channel: triggerForm.event_channel,
        execution_priority: triggerForm.execution_priority,
        execution_cost_estimate: Number(triggerForm.execution_cost_estimate),
        context: {
          source: "reinpia_ai_autonomy_panel",
          has_new_data: triggerForm.event_type === "scheduled_high_value_review",
          has_opportunity: triggerForm.event_type === "new_lead",
          no_changes: triggerForm.event_type === "sentinel_deep_scan",
        },
      });
      setMessage(
        result.executed
          ? `Evento ejecutado con ${result.tokens_used} tokens usando ${result.triggered_agent || "agente"}.`
          : `Evento omitido por regla: ${result.skip_reason || "sin detalle"}.`
      );
      await load(selectedTenant.tenant_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible procesar el evento del orquestador");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Cerebro Orquestador IA"
        subtitle="Ejecucion por evento, capacidades por plan y control de presupuesto de tokens sin agentes permanentes innecesarios."
      />

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}

      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <h4>Estado del orquestador</h4>
          <p>{dashboard.orchestrator_status}</p>
        </article>
        <article className="card">
          <h4>Tenants activos</h4>
          <p>{dashboard.active_tenants.toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h4>Ejecuciones</h4>
          <p>{dashboard.executions_total.toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h4>Omisiones por reglas</h4>
          <p>{dashboard.skipped_total.toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h4>Tokens consumidos</h4>
          <p>{dashboard.tokens_used_total.toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h4>Tokens ahorrados</h4>
          <p>{dashboard.tokens_saved_total.toLocaleString("es-MX")}</p>
        </article>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Catalogo de agentes logicos reutilizables</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Descripcion</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.logical_agents_catalog.map((agent) => (
              <tr key={agent.agent_key}>
                <td>
                  <strong>{agent.display_name}</strong>
                  <div className="muted">{agent.agent_key}</div>
                </td>
                <td>{agent.description}</td>
              </tr>
            ))}
            {!dashboard.logical_agents_catalog.length ? (
              <tr>
                <td colSpan={2}>No hay catalogo cargado.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Capacidades por plan y presupuesto</h3>
        {selectedTenant ? (
          <>
            <p>
              <strong>Tenant:</strong> {selectedTenant.tenant_name} | <strong>Plan:</strong> {selectedTenant.plan_key || "sin plan"} |
              <strong> Autonomia:</strong> {autonomyLabel}
            </p>
            <p>
              <strong>Budget mensual:</strong> {selectedTenant.token_budget_monthly.toLocaleString("es-MX")} tokens |
              <strong> Disponible:</strong> {selectedTenant.token_budget_remaining.toLocaleString("es-MX")} |
              <strong> Reservado:</strong> {selectedTenant.token_budget_reserved.toLocaleString("es-MX")}
            </p>
            <p>
              <strong>Capacidades habilitadas por plan:</strong> {selectedTenant.available_ai_capabilities.join(", ") || "Sin capacidades"}
            </p>
            <p>
              <strong>Capacidades activas:</strong> {selectedTenant.active_ai_capabilities.join(", ") || "Sin capacidades activas"}
            </p>
          </>
        ) : (
          <p className="muted">No hay tenant seleccionado para mostrar entitlements.</p>
        )}
      </div>

      <form className="card inline-form" onSubmit={triggerEvent} style={{ marginBottom: "1rem" }}>
        <h3>Simular trigger de evento</h3>
        <select
          value={triggerForm.event_type}
          onChange={(e) => setTriggerForm((prev) => ({ ...prev, event_type: e.target.value }))}
        >
          {EVENT_OPTIONS.map((eventKey) => (
            <option key={eventKey} value={eventKey}>
              {eventKey}
            </option>
          ))}
        </select>
        <input
          placeholder="Canal"
          value={triggerForm.event_channel}
          onChange={(e) => setTriggerForm((prev) => ({ ...prev, event_channel: e.target.value }))}
        />
        <select
          value={triggerForm.execution_priority}
          onChange={(e) => setTriggerForm((prev) => ({ ...prev, execution_priority: e.target.value }))}
        >
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <input
          type="number"
          min={1}
          step={1}
          value={triggerForm.execution_cost_estimate}
          onChange={(e) => setTriggerForm((prev) => ({ ...prev, execution_cost_estimate: Number(e.target.value) }))}
        />
        <button className="button" type="submit" disabled={saving || !selectedTenant}>
          Ejecutar trigger
        </button>
      </form>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Proveedores IA disponibles</h3>
        <p>
          {activeProviders.length
            ? `Activos: ${activeProviders.map((provider) => provider.display_name).join(", ")}`
            : "No hay proveedores activos"}
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Ultimas ejecuciones</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Agente</th>
              <th>Resultado</th>
              <th>Tokens</th>
              <th>Costo</th>
              <th>Resumen</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recent_executions.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.started_at).toLocaleString("es-MX")}</td>
                <td>{event.event_type}</td>
                <td>{event.triggered_agent || "n/a"}</td>
                <td>{event.executed ? "Ejecutado" : "Omitido"}</td>
                <td>{event.executed ? event.tokens_used : event.tokens_saved}</td>
                <td>${Number(event.cost_estimate_mxn || 0).toLocaleString("es-MX")}</td>
                <td>{event.outcome_summary || "Sin resumen"}</td>
              </tr>
            ))}
            {!dashboard.recent_executions.length ? (
              <tr>
                <td colSpan={7}>Sin ejecuciones registradas.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Ejecuciones omitidas (skip rules)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Regla de omision</th>
              <th>Tokens ahorrados</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recent_skips.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.started_at).toLocaleString("es-MX")}</td>
                <td>{event.event_type}</td>
                <td>{event.skip_reason || "sin detalle"}</td>
                <td>{event.tokens_saved}</td>
              </tr>
            ))}
            {!dashboard.recent_skips.length ? (
              <tr>
                <td colSpan={4}>No hay omisiones recientes.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
