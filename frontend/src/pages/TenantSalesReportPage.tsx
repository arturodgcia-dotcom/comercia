import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { SimpleChartSection } from "../components/SimpleChartSection";
import { api } from "../services/api";
import { TenantReportSales } from "../types/domain";

export function TenantSalesReportPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<TenantReportSales | null>(null);
  const [error, setError] = useState("");

  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api
      .getTenantReportSales(token, user.tenant_id, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar ventas"));
  }, [token, user?.tenant_id, query]);

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando reporte de ventas...</p>;

  const exportCsv = async () => {
    const url = api.getTenantReportExportUrl(user.tenant_id as number, "sales", query);
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

