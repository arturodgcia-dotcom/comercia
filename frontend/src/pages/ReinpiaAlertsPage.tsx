import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { AlertsList } from "../components/AlertsList";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { InternalAlert } from "../types/domain";

export function ReinpiaAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<InternalAlert[]>([]);
  const [filters, setFilters] = useState({ alert_type: "", severity: "", read: "", tenant_id: "" });
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.alert_type) params.set("alert_type", filters.alert_type);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.read) params.set("is_read", filters.read);
    if (filters.tenant_id) params.set("tenant_id", filters.tenant_id);
    return params.toString();
  }, [filters]);

  const load = async () => {
    if (!token) return;
    setAlerts(await api.getReinpiaAlerts(token, query));
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar alertas"));
  }, [token, query]);

  const markRead = async (alertId: number) => {
    if (!token) return;
    await api.markReinpiaAlertRead(token, alertId);
    await load();
  };

  const sentinelSummary = useMemo(() => {
    const pending = alerts.filter((row) => !row.is_read && row.alert_type === "sentinel_minimo");
    const countByCode = (code: string) =>
      pending.filter((row) => (row.related_entity_type || "").toLowerCase() === code).length;
    return {
      tokensBajos: countByCode("tokens_bajos"),
      planLleno: countByCode("plan_lleno"),
      pagoFallido: countByCode("pago_fallido"),
      ticketUrgente: countByCode("ticket_urgente"),
      marcaSinActividad: countByCode("marca_sin_actividad"),
    };
  }, [alerts]);

  return (
    <section>
      <PageHeader title="Alertas REINPIA" subtitle="Alertas internas operativas, comerciales y de límites para todas las marcas." />
      {error ? <p className="error">{error}</p> : null}
      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <article className="card"><h4>Tokens bajos</h4><p>{sentinelSummary.tokensBajos}</p></article>
        <article className="card"><h4>Plan lleno</h4><p>{sentinelSummary.planLleno}</p></article>
        <article className="card"><h4>Pago fallido</h4><p>{sentinelSummary.pagoFallido}</p></article>
        <article className="card"><h4>Ticket urgente</h4><p>{sentinelSummary.ticketUrgente}</p></article>
        <article className="card"><h4>Marca sin actividad</h4><p>{sentinelSummary.marcaSinActividad}</p></article>
      </div>
      <div className="inline-form">
        <input
          placeholder="Tipo alerta"
          value={filters.alert_type}
          onChange={(e) => setFilters((p) => ({ ...p, alert_type: e.target.value }))}
        />
        <select value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}>
          <option value="">Todas severidades</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="high">high</option>
        </select>
        <input
          placeholder="Tenant ID"
          value={filters.tenant_id}
          onChange={(e) => setFilters((p) => ({ ...p, tenant_id: e.target.value }))}
        />
        <select value={filters.read} onChange={(e) => setFilters((p) => ({ ...p, read: e.target.value }))}>
          <option value="">Leídas y no leídas</option>
          <option value="false">No leídas</option>
          <option value="true">Leídas</option>
        </select>
      </div>
      <AlertsList alerts={alerts} onMarkRead={markRead} />
    </section>
  );
}
