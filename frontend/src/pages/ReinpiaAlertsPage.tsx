import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { AlertsList } from "../components/AlertsList";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { InternalAlert } from "../types/domain";

export function ReinpiaAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<InternalAlert[]>([]);
  const [filters, setFilters] = useState({ alert_type: "", severity: "", read: "" });
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.alert_type) params.set("alert_type", filters.alert_type);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.read) params.set("is_read", filters.read);
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

  return (
    <section>
      <PageHeader title="REINPIA Alerts" subtitle="Alertas internas comerciales y contables para seguimiento." />
      {error ? <p className="error">{error}</p> : null}
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
        <select value={filters.read} onChange={(e) => setFilters((p) => ({ ...p, read: e.target.value }))}>
          <option value="">Leidas y no leidas</option>
          <option value="false">No leidas</option>
          <option value="true">Leidas</option>
        </select>
      </div>
      <AlertsList alerts={alerts} onMarkRead={markRead} />
    </section>
  );
}

