import { BlockedEntity } from "../types/domain";

interface BlockedEntityTableProps {
  rows: BlockedEntity[];
  onUnblock?: (id: number) => void;
}

export function BlockedEntityTable({ rows, onUnblock }: BlockedEntityTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tipo</th>
          <th>Clave</th>
          <th>Motivo</th>
          <th>Hasta</th>
          <th>Activo</th>
          <th>Accion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.entity_type}</td>
            <td>{row.entity_key}</td>
            <td>{row.reason}</td>
            <td>{row.blocked_until ? new Date(row.blocked_until).toLocaleString("es-MX") : "indefinido"}</td>
            <td>{row.is_active ? "si" : "no"}</td>
            <td>
              {row.is_active && onUnblock ? (
                <button type="button" className="button button-outline" onClick={() => onUnblock(row.id)}>
                  Desbloquear
                </button>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

