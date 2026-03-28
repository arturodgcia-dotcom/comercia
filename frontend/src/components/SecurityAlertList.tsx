import { SecurityAlert } from "../types/domain";

interface SecurityAlertListProps {
  alerts: SecurityAlert[];
  onMarkRead?: (id: number) => void;
}

export function SecurityAlertList({ alerts, onMarkRead }: SecurityAlertListProps) {
  return (
    <div className="stack">
      {alerts.map((alert) => (
        <article key={alert.id} className="panel">
          <p>
            <strong>{alert.title}</strong> [{alert.severity}]
          </p>
          <p>{alert.message}</p>
          <p className="muted">
            Tipo: {alert.alert_type} | Leida: {alert.is_read ? "si" : "no"} | {new Date(alert.created_at).toLocaleString("es-MX")}
          </p>
          {!alert.is_read && onMarkRead ? (
            <button type="button" className="button button-outline" onClick={() => onMarkRead(alert.id)}>
              Marcar leida
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

