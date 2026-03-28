import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { api } from "../services/api";

export function TenantLogisticsReportPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api
      .getTenantLogisticsReport(token, user.tenant_id, query)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar logistica"));
  }, [token, user?.tenant_id, query]);

  const exportCsv = async () => {
    if (!token || !user?.tenant_id) return;
    const url = api.getTenantReportExportUrl(user.tenant_id, "logistics", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenant-logistics.csv";
    link.click();
  };

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="Reporte de Logistica" subtitle="Entregas exitosas, retrasadas, reprogramadas y fallidas." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
        <ExportCsvButton onClick={exportCsv} />
      </div>
      <StatusSummaryCard
        title="Estado logistica"
        values={[
          { label: "Total", value: summary.total ?? 0 },
          { label: "Entregadas", value: summary.delivered ?? 0 },
          { label: "Retrasadas/Reprogramadas", value: summary.delayed_or_rescheduled ?? 0 },
          { label: "Fallidas", value: summary.failed ?? 0 }
        ]}
      />
    </section>
  );
}

