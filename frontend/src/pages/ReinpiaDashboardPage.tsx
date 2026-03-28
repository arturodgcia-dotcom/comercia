import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SimpleChartSection } from "../components/SimpleChartSection";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import { ReinpiaKpisResponse, ReinpiaTimeseriesPoint } from "../types/domain";

export function ReinpiaDashboardPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [kpis, setKpis] = useState<ReinpiaKpisResponse | null>(null);
  const [timeseries, setTimeseries] = useState<ReinpiaTimeseriesPoint[]>([]);
  const [topTenants, setTopTenants] = useState<Array<{ tenant_id: number; tenant_name: string; revenue: number; commissions: number; net_amount: number }>>([]);
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
      api.getReinpiaDashboardKpis(token, query),
      api.getReinpiaOrdersTimeseries(token, query),
      api.getReinpiaTopTenants(token, query)
    ])
      .then(([kpiData, tsData, top]) => {
        setKpis(kpiData);
        setTimeseries(tsData);
        setTopTenants(top);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar dashboard global"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;
  if (!kpis) return <p>Cargando dashboard global...</p>;

  return (
    <section>
      <PageHeader title="REINPIA Global Dashboard" subtitle="Vista consolidada multi-tenant de COMERCIA." />
      <FilterBar tenantId={filters.tenantId} dateFrom={filters.dateFrom} dateTo={filters.dateTo} status={filters.status} onChange={setFilters} />

      <div className="card-grid">
        <KpiCard label="Total tenants" value={kpis.kpis.total_tenants} />
        <KpiCard label="Activos" value={kpis.kpis.tenants_active} />
        <KpiCard label="Inactivos" value={kpis.kpis.tenants_inactive} />
        <KpiCard label="Revenue" value={`$${kpis.kpis.total_revenue.toLocaleString("es-MX")}`} />
        <KpiCard label="Comisiones" value={`$${kpis.kpis.total_commissions.toLocaleString("es-MX")}`} />
        <KpiCard label="Neto" value={`$${kpis.kpis.total_net_amount.toLocaleString("es-MX")}`} />
        <KpiCard label="Paid orders" value={kpis.kpis.total_paid_orders} />
        <KpiCard label="Failed orders" value={kpis.kpis.total_failed_orders} />
        <KpiCard label="AOV" value={`$${kpis.kpis.average_order_value.toLocaleString("es-MX")}`} />
        <KpiCard label="Solicitudes distribuidor" value={kpis.kpis.total_distributor_applications} />
        <KpiCard label="Distribuidores aprobados" value={kpis.kpis.total_approved_distributors} />
        <KpiCard label="Subscriptions activas" value={kpis.kpis.total_active_subscriptions} />
        <KpiCard label="Citas" value={kpis.kpis.total_appointments} />
        <KpiCard label="Logistica total" value={kpis.kpis.total_logistics_orders} />
        <KpiCard label="Logistica entregada" value={kpis.kpis.delivered_logistics_orders} />
      </div>

      {timeseries.length === 0 ? <EmptyState title="Sin datos de timeseries" description="No hay ordenes para el filtro actual." /> : null}

      {timeseries.length > 0 ? (
        <>
          <SimpleChartSection title="Revenue over time" series={timeseries.map((point) => ({ label: point.day, value: point.revenue }))} />
          <SimpleChartSection title="Commissions over time" series={timeseries.map((point) => ({ label: point.day, value: point.commissions }))} />
          <SimpleChartSection title="Paid vs Failed" series={[{ label: "Paid", value: kpis.kpis.total_paid_orders }, { label: "Failed", value: kpis.kpis.total_failed_orders }]} />
        </>
      ) : null}

      <SimpleChartSection
        title="Tenants activos vs inactivos"
        series={[
          { label: "Activos", value: kpis.active_vs_inactive.active },
          { label: "Inactivos", value: kpis.active_vs_inactive.inactive }
        ]}
      />

      <section>
        <h3>Top tenants por revenue</h3>
        <SummaryTable
          headers={["Tenant", "Revenue", "Comisiones", "Neto"]}
          rows={topTenants.map((item) => [
            item.tenant_name,
            `$${item.revenue.toLocaleString("es-MX")}`,
            `$${item.commissions.toLocaleString("es-MX")}`,
            `$${item.net_amount.toLocaleString("es-MX")}`
          ])}
        />
      </section>

      <section>
        <h3>Distribucion por plan</h3>
        <SummaryTable
          headers={["Plan", "Codigo", "Cantidad"]}
          rows={kpis.plan_distribution.map((item) => [item.plan_name, item.plan_code, item.count])}
        />
      </section>

      <section>
        <h3>Distribucion por tipo de negocio</h3>
        <SummaryTable
          headers={["Business type", "Cantidad"]}
          rows={kpis.business_type_distribution.map((item) => [item.business_type, item.count])}
        />
      </section>
    </section>
  );
}

