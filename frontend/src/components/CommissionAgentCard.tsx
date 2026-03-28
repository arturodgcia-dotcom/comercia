import { SalesCommissionAgent } from "../types/domain";

export function CommissionAgentCard({
  agent,
  summary,
  onEdit
}: {
  agent: SalesCommissionAgent;
  summary?: Record<string, number | string>;
  onEdit?: (agent: SalesCommissionAgent) => void;
}) {
  return (
    <article className="card">
      <h3>{agent.full_name}</h3>
      <p>Clave: {agent.code}</p>
      <p>Email: {agent.email}</p>
      <p>Comision: {agent.commission_percentage}%</p>
      <p>Activo: {agent.is_active ? "Si" : "No"}</p>
      {summary ? (
        <p>
          Leads: {summary.total_leads ?? 0} | Ventas comisionadas: {summary.commissioned_sales ?? 0}
        </p>
      ) : null}
      {onEdit ? (
        <button className="button button-outline" type="button" onClick={() => onEdit(agent)}>
          Editar
        </button>
      ) : null}
    </article>
  );
}

