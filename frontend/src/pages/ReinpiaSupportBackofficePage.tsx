import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { SupportTicket, Tenant } from "../types/domain";

type TenantSupportSnapshot = {
  tenantId: number;
  tenantName: string;
  total: number;
  abiertos: number;
  pendientes: number;
  incidencias: number;
  ultimaActualizacion?: string;
};

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isOpenStatus(status: string | undefined): boolean {
  const current = normalize(status);
  return current !== "resuelto" && current !== "cerrado";
}

function isPendingStatus(status: string | undefined): boolean {
  const current = normalize(status);
  return current.includes("pendiente") || current.includes("nuevo") || current.includes("abierto") || current.includes("proceso");
}

function isIncidentPriority(priority: string | undefined): boolean {
  const current = normalize(priority);
  return current.includes("alta") || current.includes("critica") || current.includes("urgent");
}

function toTenantSupportSnapshot(tenant: Tenant, tickets: SupportTicket[]): TenantSupportSnapshot {
  const abiertos = tickets.filter((ticket) => isOpenStatus(ticket.estado)).length;
  const pendientes = tickets.filter((ticket) => isPendingStatus(ticket.estado)).length;
  const incidencias = tickets.filter((ticket) => isIncidentPriority(ticket.prioridad)).length;
  const ultimaActualizacion = tickets
    .map((ticket) => ticket.updated_at)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    total: tickets.length,
    abiertos,
    pendientes,
    incidencias,
    ultimaActualizacion,
  };
}

export function ReinpiaSupportBackofficePage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<TenantSupportSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");

    api
      .getTenants(token)
      .then(async (tenants) => {
        const snapshots = await Promise.all(
          tenants.map(async (tenant) => {
            try {
              const tickets = await api.getSupportTickets(token, tenant.id);
              return toTenantSupportSnapshot(tenant, tickets);
            } catch {
              return toTenantSupportSnapshot(tenant, []);
            }
          })
        );
        setRows(snapshots.filter((row) => row.total > 0 || row.abiertos > 0 || row.pendientes > 0 || row.incidencias > 0));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar el soporte backoffice.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const metrics = useMemo(() => {
    const tickets = rows.reduce((acc, row) => acc + row.total, 0);
    const incidencias = rows.reduce((acc, row) => acc + row.incidencias, 0);
    const abiertos = rows.reduce((acc, row) => acc + row.abiertos, 0);
    const pendientes = rows.reduce((acc, row) => acc + row.pendientes, 0);
    const clientesAbiertos = rows.filter((row) => row.abiertos > 0 || row.pendientes > 0).length;
    return { tickets, incidencias, abiertos, pendientes, clientesAbiertos };
  }, [rows]);

  return (
    <section>
      <PageHeader
        title="Soporte global backoffice"
        subtitle="Centro técnico-operativo para tickets e incidencias. El inbox comercial y prospectos viven en Comercial."
      />

      <div className="card-grid">
        <KpiCard label="Tickets" value={metrics.tickets} />
        <KpiCard label="Incidencias" value={metrics.incidencias} />
        <KpiCard label="Clientes abiertos" value={metrics.clientesAbiertos} />
        <KpiCard label="Pendientes" value={metrics.pendientes} />
      </div>

      <section className="card">
        <h3>Cola operativa por cliente</h3>
        <p className="muted">
          En esta vista se priorizan casos técnicos y operativos. Prospectos, precotizaciones y seguimiento comercial se gestionan en el módulo Comercial.
        </p>

        {loading ? <p>Cargando tickets de soporte...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tickets</th>
                <th>Abiertos</th>
                <th>Pendientes</th>
                <th>Incidencias</th>
                <th>Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tenantId}>
                  <td>{row.tenantName}</td>
                  <td>{row.total}</td>
                  <td>{row.abiertos}</td>
                  <td>{row.pendientes}</td>
                  <td>{row.incidencias}</td>
                  <td>{row.ultimaActualizacion ? new Date(row.ultimaActualizacion).toLocaleString("es-MX") : "-"}</td>
                </tr>
              ))}
              {!rows.length && !loading ? (
                <tr>
                  <td colSpan={6}>No hay tickets de soporte registrados en este momento.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
