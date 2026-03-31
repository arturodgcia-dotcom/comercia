import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";

export function ReinpiaOperationsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [appointments, setAppointments] = useState<{ total: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [logistics, setLogistics] = useState<{ total: number; delivered: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [distributors, setDistributors] = useState<{ total_applications: number; approved_profiles: number } | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tenantId) params.set("tenant_id", filters.tenantId);
    if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59`);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getReinpiaAppointmentsSummary(token, query),
      api.getReinpiaLogisticsSummary(token, query),
      api.getReinpiaDistributorsSummary(token, query)
    ])
      .then(([appointmentsSummary, logisticsSummary, distributorsSummary]) => {
        setAppointments(appointmentsSummary);
        setLogistics(logisticsSummary);
        setDistributors(distributorsSummary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar operaciones globales"));
  }, [token, query]);

  useEffect(() => {
    if (!token) return;
    api.getReinpiaTenantsSummary(token)
      .then((rows) => setTenantOptions(rows.map((row) => ({ id: row.tenant_id, name: row.tenant_name }))))
      .catch(() => setTenantOptions([]));
  }, [token]);

  return (
    <section>
      <PageHeader title="Operacion global ComerCia" subtitle="Citas, logistica y distribuidores en vista global o por marca." />
      <FilterBar
        tenantId={filters.tenantId}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        status={filters.status}
        tenantOptions={tenantOptions}
        onChange={setFilters}
      />
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid">
        <KpiCard label="Citas total" value={appointments?.total ?? 0} />
        <KpiCard label="Logistica total" value={logistics?.total ?? 0} />
        <KpiCard label="Logistica entregada" value={logistics?.delivered ?? 0} />
        <KpiCard label="Solicitudes distribuidor" value={distributors?.total_applications ?? 0} />
        <KpiCard label="Distribuidores aprobados" value={distributors?.approved_profiles ?? 0} />
      </div>

      <section>
        <h3>Citas por estado</h3>
        <SummaryTable
          headers={["Estado", "Cantidad"]}
          rows={(appointments?.by_status ?? []).map((item) => [item.status, item.count])}
        />
      </section>

      <section>
        <h3>Logistica por estado</h3>
        <SummaryTable
          headers={["Estado", "Cantidad"]}
          rows={(logistics?.by_status ?? []).map((item) => [item.status, item.count])}
        />
      </section>
    </section>
  );
}
