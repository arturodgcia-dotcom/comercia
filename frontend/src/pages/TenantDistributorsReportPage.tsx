import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { api } from "../services/api";

export function TenantDistributorsReportPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api
      .getTenantDistributorsReport(token, user.tenant_id, query)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [token, user?.tenant_id, query]);

  const exportCsv = async () => {
    if (!token || !user?.tenant_id) return;
    const url = api.getTenantReportExportUrl(user.tenant_id, "distributors", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenant-distributors.csv";
    link.click();
  };

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="Reporte de Distribuidores" subtitle="Canal distribuidor, actividad y recurrencia." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
        <ExportCsvButton onClick={exportCsv} />
      </div>
      <StatusSummaryCard
        title="Estado de distribuidores"
        values={[
          { label: "Solicitudes", value: summary.applications ?? 0 },
          { label: "Activos", value: summary.active_distributors ?? 0 },
          { label: "Inactivos", value: summary.inactive_distributors ?? 0 },
          { label: "Pedidos recurrentes", value: summary.recurring_orders ?? 0 }
        ]}
      />
    </section>
  );
}

