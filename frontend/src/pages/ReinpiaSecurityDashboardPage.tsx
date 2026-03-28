import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { SecurityAlertList } from "../components/SecurityAlertList";
import { SecurityEventTable } from "../components/SecurityEventTable";
import { SecurityKpiCard } from "../components/SecurityKpiCard";
import { api } from "../services/api";
import { BlockedEntity, SecurityAlert, SecurityEvent, SecurityKpis } from "../types/domain";

export function ReinpiaSecurityDashboardPage() {
  const { token } = useAuth();
  const [kpis, setKpis] = useState<SecurityKpis | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blocked, setBlocked] = useState<BlockedEntity[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getSecurityKpis(token),
      api.getSecurityEvents(token, "limit=20"),
      api.getSecurityAlerts(token, "is_read=false"),
      api.getBlockedEntities(token)
    ])
      .then(([kpiData, eventData, alertsData, blockedData]) => {
        setKpis(kpiData);
        setEvents(eventData);
        setAlerts(alertsData.slice(0, 5));
        setBlocked(blockedData.slice(0, 5));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar seguridad"));
  }, [token]);

  if (error) return <p className="error">{error}</p>;
  if (!kpis) return <p>Cargando seguridad...</p>;

  return (
    <section>
      <PageHeader title="REINPIA Security" subtitle="Centinela antifraude base con monitoreo y respuesta operativa." />
      <div className="card-grid">
        <SecurityKpiCard label="Eventos" value={kpis.total_events} />
        <SecurityKpiCard label="Criticos" value={kpis.critical_events} />
        <SecurityKpiCard label="High" value={kpis.high_events} />
        <SecurityKpiCard label="Medium" value={kpis.medium_events} />
        <SecurityKpiCard label="Low" value={kpis.low_events} />
        <SecurityKpiCard label="Alertas nuevas" value={kpis.new_alerts} />
        <SecurityKpiCard label="Alertas no leidas" value={kpis.unread_alerts} />
        <SecurityKpiCard label="Entidades bloqueadas" value={kpis.blocked_entities} />
      </div>

      <h3>Top tipos de evento</h3>
      <ul>
        {kpis.top_event_types.map((item) => (
          <li key={item.event_type}>
            {item.event_type}: {item.count}
          </li>
        ))}
      </ul>

      <h3>Eventos recientes</h3>
      <SecurityEventTable events={events} />

      <h3>Alertas criticas recientes</h3>
      <SecurityAlertList alerts={alerts} />

      <h3>Entidades bloqueadas recientes</h3>
      <ul>
        {blocked.map((item) => (
          <li key={item.id}>
            {item.entity_type} / {item.entity_key} - {item.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}

