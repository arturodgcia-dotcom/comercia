import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { SecurityAlertList } from "../components/SecurityAlertList";
import { api } from "../services/api";
import { SecurityAlert } from "../types/domain";

export function ReinpiaSecurityAlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filters, setFilters] = useState({ severity: "", alertType: "", read: "" });
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.alertType) params.set("alert_type", filters.alertType);
    if (filters.read) params.set("is_read", filters.read);
    return params.toString();
  }, [filters]);

  const load = async () => {
    if (!token) return;
    setAlerts(await api.getSecurityAlerts(token, query));
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar alertas"));
  }, [token, query]);

  const markRead = async (alertId: number) => {
    if (!token) return;
    await api.markSecurityAlertRead(token, alertId);
    await load();
  };

  return (
    <section>
      <PageHeader title="Security Alerts" subtitle="Alertas de vigilancia de riesgo y antifraude." />
      {error ? <p className="error">{error}</p> : null}
      <div className="inline-form">
        <input
          placeholder="alert_type"
          value={filters.alertType}
          onChange={(e) => setFilters((prev) => ({ ...prev, alertType: e.target.value }))}
        />
        <select value={filters.severity} onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}>
          <option value="">Todas severidades</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <select value={filters.read} onChange={(e) => setFilters((prev) => ({ ...prev, read: e.target.value }))}>
          <option value="">Todas</option>
          <option value="false">No leidas</option>
          <option value="true">Leidas</option>
        </select>
      </div>
      <SecurityAlertList alerts={alerts} onMarkRead={markRead} />
    </section>
  );
}

