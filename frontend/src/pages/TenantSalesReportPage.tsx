import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { SimpleChartSection } from "../components/SimpleChartSection";
import { useTenantScope } from "../hooks/useTenantScope";
import { api } from "../services/api";
import { TenantReportSales } from "../types/domain";

export function TenantSalesReportPage() {
  const { token } = useAuth();
  const { isGlobalAdmin, tenantIdForReports, tenantOptions, scopeError, setTenantIdForReports } = useTenantScope();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<TenantReportSales | null>(null);
  const [error, setError] = useState("");

  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !tenantIdForReports) return;
    api
      .getTenantReportSales(token, tenantIdForReports, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar ventas"));
  }, [token, tenantIdForReports, query]);

  if (!tenantIdForReports) return <p className="error">No hay marca seleccionada para reportes.</p>;
  if (scopeError) return <p className="error">{scopeError}</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando reporte de ventas...</p>;

  const exportCsv = async () => {
    const url = api.getTenantReportExportUrl(tenantIdForReports, "sales", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "tenant-sales.csv";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <section>
      <PageHeader title="Reporte de Ventas" subtitle="Analitica de ordenes, ticket promedio y comportamiento por periodo." />
      <div className="inline-form">
        {isGlobalAdmin ? (
          <select value={tenantIdForReports} onChange={(event) => setTenantIdForReports(Number(event.target.value))}>
            {tenantOptions.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.tenant_name}
              </option>
            ))}
          </select>
        ) : null}
        <PeriodSelector period={period} onChange={setPeriod} />
        <ExportCsvButton onClick={exportCsv} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Ventas totales" value={`$${data.total_sales.toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Pagadas" value={data.paid_orders} />
        <ReportKpiCard label="Fallidas" value={data.failed_orders} />
        <ReportKpiCard label="Ticket promedio" value={`$${data.average_ticket.toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Ventas recurrentes" value={data.recurring_sales} />
      </div>
      <SimpleChartSection
        title="Revenue por periodo"
        series={data.timeseries.map((item) => ({ label: item.bucket, value: item.revenue }))}
      />
    </section>
  );
}
