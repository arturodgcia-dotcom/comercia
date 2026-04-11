import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { FilterBar } from "../components/FilterBar";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { ReinpiaTenantSummaryRow } from "../types/domain";

function describeActivity(row: ReinpiaTenantSummaryRow): string {
  if (row.paid_orders > 0) return `${row.paid_orders} ventas pagadas`;
  if (row.revenue > 0) return "Actividad comercial registrada";
  return "Sin actividad reciente";
}

function billingModelLabel(value?: string): string {
  return value === "commission_based" ? "Comision por venta" : "Cuota fija";
}

export function ReinpiaTenantsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [rows, setRows] = useState<ReinpiaTenantSummaryRow[]>([]);
  const [error, setError] = useState("");
  const [tenantNames, setTenantNames] = useState<Record<number, string>>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59`);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    api
      .getTenants(token)
      .then((data) => {
        const next: Record<number, string> = {};
        data.forEach((item) => {
          next[item.id] = item.name;
        });
        setTenantNames(next);
      })
      .catch(() => setTenantNames({}));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaTenantsSummary(token, query)
      .then((data) => {
        if (filters.tenantId) {
          setRows(data.filter((row) => row.tenant_id === Number(filters.tenantId)));
        } else {
          setRows(data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar marcas globales"));
  }, [token, query, filters.tenantId]);

  return (
    <section>
      <PageHeader
        title="Marcas clientes"
        subtitle="ComerCia administra marcas activas, su plan, estado operativo y avance comercial."
      />
      <FilterBar tenantId={filters.tenantId} dateFrom={filters.dateFrom} dateTo={filters.dateTo} status={filters.status} onChange={setFilters} />
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Marca</th>
              <th>Estado</th>
              <th>Plan</th>
              <th>Tipo de negocio</th>
              <th>Modelo comercial</th>
              <th>% comision</th>
              <th>Revenue</th>
              <th>Comisiones</th>
              <th>Ventas sujetas</th>
              <th>Comision estimada</th>
              <th>Neto</th>
              <th>Última actividad</th>
              <th>Acción principal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tenant_id}>
                <td>{row.tenant_id}</td>
                <td>{tenantNames[row.tenant_id] ?? row.tenant_name}</td>
                <td>{row.is_active ? "Activa" : "Inactiva"}</td>
                <td>{row.plan_id ?? "-"}</td>
                <td>{row.business_type}</td>
                <td>{billingModelLabel(row.billing_model)}</td>
                <td>{row.commission_enabled ? `${Number(row.commission_percentage ?? 0).toFixed(2)}%` : "No aplica"}</td>
                <td>${row.revenue.toLocaleString("es-MX")}</td>
                <td>${row.commissions.toLocaleString("es-MX")}</td>
                <td>${Number(row.sales_subject_to_commission ?? 0).toLocaleString("es-MX")}</td>
                <td>${Number(row.estimated_commission_amount ?? 0).toLocaleString("es-MX")}</td>
                <td>${row.net_amount.toLocaleString("es-MX")}</td>
                <td>{describeActivity(row)}</td>
                <td>
                  <Link className="button" to={`/reinpia/tenants/${row.tenant_id}`}>
                    Ver detalle
                  </Link>
                </td>
                <td>
                  <div className="row-gap">
                    <Link className="button button-outline" to={`/reinpia/brands/${row.tenant_id}/setup`}>
                      Wizard creación
                    </Link>
                    <Link className="button button-outline" to={`/reinpia/canales-creados`}>
                      Canales creados
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row-gap" style={{ marginTop: "12px" }}>
        <Link className="button" to="/reinpia/brands/new">
          Crear nueva marca
        </Link>
      </div>
    </section>
  );
}
