import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { FilterBar } from "../components/FilterBar";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import { ReinpiaTenantSummaryRow } from "../types/domain";

export function ReinpiaTenantsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [rows, setRows] = useState<ReinpiaTenantSummaryRow[]>([]);
  const [error, setError] = useState("");

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
      .getReinpiaTenantsSummary(token, query)
      .then((data) => {
        if (filters.tenantId) {
          setRows(data.filter((row) => row.tenant_id === Number(filters.tenantId)));
        } else {
          setRows(data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar tenants globales"));
  }, [token, query, filters.tenantId]);

  return (
    <section>
      <PageHeader title="REINPIA Tenants" subtitle="Tenants, plan, tipo de negocio y performance acumulado." />
      <FilterBar tenantId={filters.tenantId} dateFrom={filters.dateFrom} dateTo={filters.dateTo} status={filters.status} onChange={setFilters} />
      {error ? <p className="error">{error}</p> : null}
      <SummaryTable
        headers={["ID", "Tenant", "Activo", "Plan ID", "Business Type", "Revenue", "Comisiones", "Neto", "Detalle"]}
        rows={rows.map((row) => [
          row.tenant_id,
          row.tenant_name,
          row.is_active ? "Si" : "No",
          row.plan_id ?? "-",
          row.business_type,
          `$${row.revenue.toLocaleString("es-MX")}`,
          `$${row.commissions.toLocaleString("es-MX")}`,
          `$${row.net_amount.toLocaleString("es-MX")}`,
          `Ver: /reinpia/tenants/${row.tenant_id}`
        ])}
      />
      <div className="row-gap">
        {rows.map((row) => (
          <Link key={row.tenant_id} className="button button-outline" to={`/reinpia/tenants/${row.tenant_id}`}>
            Tenant {row.tenant_name}
          </Link>
        ))}
      </div>
    </section>
  );
}

