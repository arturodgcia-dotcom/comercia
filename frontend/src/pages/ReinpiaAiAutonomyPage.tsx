import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AiAgent, AiAutonomyDashboard, AiAutonomyLevel, AiProviderSetting } from "../types/domain";

const EMPTY_DASHBOARD: AiAutonomyDashboard = {
  active_agents: 0,
  total_consumption_tokens: 0,
  total_cost_mxn: 0,
  total_actions: 0,
  estimated_roi_mxn: 0,
  success_rate_pct: 0,
  autonomy_distribution: [],
  provider_distribution: [],
  recent_events: [],
};

export function ReinpiaAiAutonomyPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<AiAutonomyDashboard>(EMPTY_DASHBOARD);
  const [levels, setLevels] = useState<AiAutonomyLevel[]>([]);
  const [providers, setProviders] = useState<AiProviderSetting[]>([]);
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    provider_key: "openai",
    autonomy_level: 0,
    owner_scope: "global",
  });

  const load = async () => {
    if (!token) return;
    const [dash, autonomy, providerRows, agentRows] = await Promise.all([
      api.getAiAutonomyDashboard(token),
      api.getAiAutonomyLevels(token),
      api.getAiProviderSettings(token),
      api.getAiAgents(token),
    ]);
    setDashboard(dash);
    setLevels(autonomy);
    setProviders(providerRows);
    setAgents(agentRows);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar IA autónoma"));
  }, [token]);

  const providerLookup = useMemo(() => {
    return providers.reduce<Record<string, string>>((acc, row) => {
      acc[row.provider_key] = row.display_name;
      return acc;
    }, {});
  }, [providers]);

  const levelLookup = useMemo(() => {
    return levels.reduce<Record<number, string>>((acc, row) => {
      acc[row.level] = row.display_name;
      return acc;
    }, {});
  }, [levels]);

  const createAgent = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.createAiAgent(token, {
        name: agentForm.name,
        description: agentForm.description || undefined,
        provider_key: agentForm.provider_key,
        autonomy_level: Number(agentForm.autonomy_level),
        owner_scope: agentForm.owner_scope,
        status: "activo",
        is_active: true,
      });
      setMessage("Agente creado correctamente.");
      setAgentForm((prev) => ({ ...prev, name: "", description: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el agente");
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (provider: AiProviderSetting) => {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.updateAiProviderSetting(token, provider.provider_key, {
        is_enabled: !provider.is_enabled,
      });
      setMessage(`Proveedor ${provider.display_name} ${provider.is_enabled ? "desactivado" : "activado"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar proveedor");
    } finally {
      setSaving(false);
    }
  };

  const registerAction = async (agent: AiAgent) => {
    if (!token) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.createAiEvent(token, agent.id, {
        event_type: "accion_autonoma",
        event_status: "ejecutado",
        summary: `Acción autónoma registrada para ${agent.name}`,
        tokens_used: 120,
        input_tokens: 80,
        output_tokens: 40,
        cost_mxn: 0.9,
        estimated_value_mxn: 12,
      });
      setMessage("Acción registrada y consumo actualizado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la acción");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="IA autónoma"
        subtitle="Control operativo de agentes, consumo, eventos y ROI estimado por proveedor y nivel de autonomía."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}

      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <h4>Agentes activos</h4>
          <p>{dashboard.active_agents}</p>
        </article>
        <article className="card">
          <h4>Consumo total</h4>
          <p>{dashboard.total_consumption_tokens.toLocaleString("es-MX")} tokens</p>
        </article>
        <article className="card">
          <h4>Acciones realizadas</h4>
          <p>{dashboard.total_actions.toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h4>ROI estimado</h4>
          <p>${Number(dashboard.estimated_roi_mxn || 0).toLocaleString("es-MX")}</p>
        </article>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Proveedores IA (OpenAI / Gemini)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Modelo base</th>
              <th>API key</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td>{provider.display_name}</td>
                <td>{provider.default_model || "Sin modelo"}</td>
                <td>{provider.api_key_masked || "No configurada"}</td>
                <td>{provider.is_enabled ? "Activo" : "Inactivo"}</td>
                <td>
                  <button className="button button-outline" type="button" disabled={saving} onClick={() => void toggleProvider(provider)}>
                    {provider.is_enabled ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Niveles de autonomía</h3>
        <ul>
          {levels.map((level) => (
            <li key={level.id}>
              <strong>{level.display_name}</strong>: {level.description}
            </li>
          ))}
        </ul>
      </div>

      <form className="card inline-form" onSubmit={createAgent} style={{ marginBottom: "1rem" }}>
        <h3>Nuevo agente</h3>
        <input
          placeholder="Nombre del agente"
          value={agentForm.name}
          onChange={(e) => setAgentForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Descripción"
          value={agentForm.description}
          onChange={(e) => setAgentForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <select
          value={agentForm.provider_key}
          onChange={(e) => setAgentForm((prev) => ({ ...prev, provider_key: e.target.value }))}
        >
          {providers.map((provider) => (
            <option key={provider.provider_key} value={provider.provider_key}>
              {provider.display_name}
            </option>
          ))}
        </select>
        <select
          value={agentForm.autonomy_level}
          onChange={(e) => setAgentForm((prev) => ({ ...prev, autonomy_level: Number(e.target.value) }))}
        >
          {levels.map((level) => (
            <option key={level.id} value={level.level}>
              {level.display_name}
            </option>
          ))}
        </select>
        <select
          value={agentForm.owner_scope}
          onChange={(e) => setAgentForm((prev) => ({ ...prev, owner_scope: e.target.value }))}
        >
          <option value="global">Global</option>
          <option value="brand">Marca</option>
        </select>
        <button className="button" type="submit" disabled={saving}>
          Crear agente
        </button>
      </form>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Agentes activos</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Agente</th>
              <th>Proveedor</th>
              <th>Nivel</th>
              <th>Estado</th>
              <th>Acciones</th>
              <th>ROI estimado</th>
              <th>Operación</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td>
                  <strong>{agent.name}</strong>
                  <div className="muted">{agent.description || "Sin descripción"}</div>
                </td>
                <td>{providerLookup[agent.provider_key] || agent.provider_key}</td>
                <td>{levelLookup[agent.autonomy_level] || `Nivel ${agent.autonomy_level}`}</td>
                <td>{agent.is_active ? "Activo" : "Pausado"}</td>
                <td>{agent.total_actions}</td>
                <td>${Number(agent.estimated_roi_mxn || 0).toLocaleString("es-MX")}</td>
                <td>
                  <button className="button button-outline" type="button" disabled={saving} onClick={() => void registerAction(agent)}>
                    Registrar acción
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Eventos recientes</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Estado</th>
              <th>Tokens</th>
              <th>Costo</th>
              <th>Valor</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recent_events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.created_at).toLocaleString("es-MX")}</td>
                <td>{event.summary}</td>
                <td>{event.event_status}</td>
                <td>{event.tokens_used}</td>
                <td>${Number(event.cost_mxn || 0).toLocaleString("es-MX")}</td>
                <td>${Number(event.estimated_value_mxn || 0).toLocaleString("es-MX")}</td>
                <td>${Number(event.roi_delta_mxn || 0).toLocaleString("es-MX")}</td>
              </tr>
            ))}
            {!dashboard.recent_events.length ? (
              <tr>
                <td colSpan={7}>Sin eventos registrados todavía.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
