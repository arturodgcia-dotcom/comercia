import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { api } from "../services/api";

export function ReinpiaCommissionsReportPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaReportsCommissions(token, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar comisiones"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;
  const kpis = (data.commission_sales_kpis as Record<string, number>) ?? {};
  const payments = (data.payment_commissions as Record<string, number>) ?? {};

  return (
    <section>
      <PageHeader title="REINPIA Commissions" subtitle="Comisiones por ventas, directas y comisionadas." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Comisiones de pagos" value={`$${Number(payments.total_commissions ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Neto a tenants" value={`$${Number(payments.total_net_amount ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Ventas comisionadas" value={Number(kpis.total_commission_sales ?? 0)} />
        <ReportKpiCard label="Ventas directas" value={Number(kpis.total_direct_sales ?? 0)} />
        <ReportKpiCard label="Comisionistas activos" value={Number(kpis.total_commission_agents ?? 0)} />
      </div>
    </section>
  );
}

