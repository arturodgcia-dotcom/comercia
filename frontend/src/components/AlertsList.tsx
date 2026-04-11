import { InternalAlert } from "../types/domain";

export function AlertsList({
  alerts,
  onMarkRead
}: {
  alerts: InternalAlert[];
  onMarkRead?: (alertId: number) => void;
}) {
  return (
    <div className="card-grid">
      {alerts.map((alert) => (
        <article key={alert.id} className="card">
          <p className="marketing-tag">{alert.alert_type}</p>
          <h4>{alert.title}</h4>
          <p>{alert.message}</p>
          <p>Severidad: {alert.severity}</p>
          <p>Marca/Tenant: {alert.tenant_id ?? "Global"}</p>
          <p>Estado: {alert.is_read ? "Leida" : "Pendiente"}</p>
          <p>{new Date(alert.created_at).toLocaleString("es-MX")}</p>
          {!alert.is_read && onMarkRead ? (
            <button className="button button-outline" type="button" onClick={() => onMarkRead(alert.id)}>
              Marcar leida
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
