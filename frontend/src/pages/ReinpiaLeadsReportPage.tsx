import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { api } from "../services/api";

export function ReinpiaLeadsReportPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaReportsLeads(token, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar leads"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;
  const byStatus = Array.isArray(data.by_status) ? (data.by_status as Array<Record<string, unknown>>) : [];

  return (
    <section>
      <PageHeader title="REINPIA Leads" subtitle="Leads comerciales: directos vs comisionados y estado de compra." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Total leads" value={Number(data.total_leads ?? 0)} />
        <ReportKpiCard label="Comisionados" value={Number(data.commissioned_leads ?? 0)} />
        <ReportKpiCard label="Directos" value={Number(data.direct_leads ?? 0)} />
      </div>
      <StatusSummaryCard
        title="Leads por estado"
        values={byStatus.map((row) => ({ label: String(row.status ?? "-"), value: Number(row.count ?? 0) }))}
      />
    </section>
  );
}

