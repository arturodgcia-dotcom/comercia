import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { TenantCommercialStatus, TenantCommercialUsage } from "../types/domain";

type LimitRow = {
  label: string;
  used: number;
  limit: number;
};

export function PlansPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const [status, setStatus] = useState<TenantCommercialStatus | null>(null);
  const [usage, setUsage] = useState<TenantCommercialUsage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !tenantId) return;
    Promise.all([
      api.getTenantCommercialStatus(token, tenantId).catch(() => null),
      api.getTenantCommercialUsage(token, tenantId).catch(() => null),
    ])
      .then(([statusData, usageData]) => {
        setStatus(statusData);
        setUsage(usageData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar el detalle del plan.");
      });
  }, [token, tenantId]);

  const limits = useMemo<LimitRow[]>(() => {
    if (!usage) return [];
    return [
      { label: "Marcas", used: usage.brands_used, limit: usage.brands_limit },
      { label: "Usuarios", used: usage.users_used, limit: usage.users_limit },
      { label: "Agentes IA", used: usage.ai_agents_used, limit: usage.ai_agents_limit },
      { label: "Productos", used: usage.products_used, limit: usage.products_limit },
      { label: "Sucursales", used: usage.branches_used, limit: usage.branches_limit },
    ];
  }, [usage]);

  return (
    <section>
      <PageHeader
        title="Plan activo y límites"
        subtitle="Detalle contractual del plan, modelo de cobro, comisión y límites operativos."
      />
      {error ? <p className="error">{error}</p> : null}

      <article className="card">
        <h3>Resumen del plan</h3>
        <p>
          <strong>Plan activo:</strong> {status?.plan_display_name || status?.commercial_plan_key || "Sin plan asignado"}
        </p>
        <p>
          <strong>Modelo de cobro:</strong> {status?.billing_model === "commission_based" ? "Comisión por venta" : "Cuota fija"}
        </p>
        <p>
          <strong>Comisión:</strong> {status?.commission_enabled ? "Activa" : "Inactiva"} ({Number(status?.commission_percentage ?? 0).toFixed(2)}%)
        </p>
        <p>
          <strong>Soporte:</strong> {status?.support || "Soporte base"}
        </p>
      </article>

      <article className="card">
        <h3>Límites del plan</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Usado</th>
                <th>Límite</th>
                <th>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {limits.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.used}</td>
                  <td>{row.limit}</td>
                  <td>{Math.max(row.limit - row.used, 0)}</td>
                </tr>
              ))}
              {!limits.length ? (
                <tr>
                  <td colSpan={4}>No hay información de límites disponible.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card">
        <h3>Créditos IA del plan</h3>
        <p>Incluidos: {usage?.ai_tokens_included ?? 0}</p>
        <p>Extra contratados: {usage?.ai_tokens_extra ?? 0}</p>
        <p>Asignados: {usage?.ai_tokens_assigned ?? 0}</p>
        <p>Consumidos: {usage?.ai_tokens_used ?? 0}</p>
        <p>Restantes: {usage?.ai_tokens_remaining ?? 0}</p>
        <p>Estado de llave IA: {usage?.ai_key_state ?? "abierta"}</p>
      </article>

      <article className="card">
        <div className="row-gap">
          <Link className="button" to="/">
            Volver a Resumen de marca
          </Link>
          <Link className="button button-outline" to="/admin/capacity-expand">
            Ir a expansión y add-ons
          </Link>
        </div>
      </article>
    </section>
  );
}
