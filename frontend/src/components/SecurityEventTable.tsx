import { SecurityEvent } from "../types/domain";

interface SecurityEventTableProps {
  events: SecurityEvent[];
}

export function SecurityEventTable({ events }: SecurityEventTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tipo</th>
          <th>Severidad</th>
          <th>Estado</th>
          <th>Tenant</th>
          <th>IP</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td>{event.id}</td>
            <td>{event.event_type}</td>
            <td>{event.severity}</td>
            <td>{event.status}</td>
            <td>{event.tenant_id ?? "-"}</td>
            <td>{event.source_ip ?? "-"}</td>
            <td>{new Date(event.created_at).toLocaleString("es-MX")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

