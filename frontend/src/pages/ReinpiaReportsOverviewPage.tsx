import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { api } from "../services/api";

export function ReinpiaReportsOverviewPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaReportsOverview(token, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar reportes globales"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;
  const kpis = (data.global_kpis as Record<string, number>) ?? {};
  const sales = (data.sales_summary as Record<string, number>) ?? {};
  const commissions = (data.commissions_summary as Record<string, number>) ?? {};

  return (
    <section>
      <PageHeader title="Resumen ejecutivo de reportes" subtitle="Vista global multi-marca para direccion y seguimiento comercial." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Revenue" value={`$${Number(kpis.total_revenue ?? sales.total_revenue ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Comisiones" value={`$${Number(kpis.total_commissions ?? commissions.total_commissions ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Neto" value={`$${Number(kpis.total_net_amount ?? commissions.total_net_amount ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Tenants activos" value={Number(kpis.tenants_active ?? 0)} />
        <ReportKpiCard label="Ordenes pagadas" value={Number(kpis.total_paid_orders ?? 0)} />
        <ReportKpiCard label="Ordenes fallidas" value={Number(kpis.total_failed_orders ?? 0)} />
        <ReportKpiCard label="Ventas sujetas a comision" value={`$${Number(commissions.sales_subject_to_commission ?? 0).toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Comision estimada" value={`$${Number(commissions.estimated_commission_amount ?? 0).toLocaleString("es-MX")}`} />
      </div>
    </section>
  );
}
