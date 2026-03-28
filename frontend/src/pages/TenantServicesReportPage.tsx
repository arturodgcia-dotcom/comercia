import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { RankingTable } from "../components/RankingTable";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { api } from "../services/api";

export function TenantServicesReportPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api
      .getTenantServicesReport(token, user.tenant_id, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar servicios"));
  }, [token, user?.tenant_id, query]);

  const exportCsv = async () => {
    if (!token || !user?.tenant_id) return;
    const url = api.getTenantReportExportUrl(user.tenant_id, "services", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenant-services.csv";
    link.click();
  };

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;

  const topServices = Array.isArray(data.top_services) ? (data.top_services as Array<Record<string, unknown>>) : [];
  const appointmentRows = Array.isArray((data.appointments as Record<string, unknown>)?.by_status)
    ? ((data.appointments as Record<string, unknown>).by_status as Array<Record<string, unknown>>)
    : [];

  return (
    <section>
      <PageHeader title="Reporte de Servicios" subtitle="Reservas, cancelaciones y servicios mas contratados." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
        <ExportCsvButton onClick={exportCsv} />
      </div>
      <StatusSummaryCard
        title="Citas"
        values={[
          { label: "Canceladas", value: Number(data.cancelled_appointments ?? 0) },
          { label: "Completadas", value: Number(data.completed_appointments ?? 0) }
        ]}
      />
      <RankingTable
        headers={["Servicio", "Reservas"]}
        rows={topServices.map((row) => [String(row.name ?? "-"), Number(row.bookings ?? 0)])}
      />
      <StatusSummaryCard
        title="Status de citas"
        values={appointmentRows.map((row) => ({ label: String(row.status ?? "-"), value: Number(row.count ?? 0) }))}
      />
    </section>
  );
}

