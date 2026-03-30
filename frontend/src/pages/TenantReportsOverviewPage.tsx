import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { ReportSection } from "../components/ReportSection";
import { RankingTable } from "../components/RankingTable";
import { SimpleChartSection } from "../components/SimpleChartSection";
import { api } from "../services/api";
import { TenantReportOverview } from "../types/domain";

export function TenantReportsOverviewPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<TenantReportOverview | null>(null);
  const [error, setError] = useState("");

  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    api
      .getTenantReportOverview(token, user.tenant_id, query)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar overview"));
  }, [token, user?.tenant_id, query]);

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando reportes...</p>;

  return (
    <section>
      <PageHeader title="Reportes Tenant" subtitle="KPIs clave para operacion comercial y crecimiento." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Ventas" value={`$${data.sales.total_sales.toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Ordenes pagadas" value={data.sales.paid_orders} />
        <ReportKpiCard label="Ordenes fallidas" value={data.sales.failed_orders} />
        <ReportKpiCard label="Ticket promedio" value={`$${data.sales.average_ticket.toLocaleString("es-MX")}`} />
        <ReportKpiCard label="Usuarios nuevos" value={data.users.new_registrations} />
        <ReportKpiCard label="Distribuidores autorizados" value={data.users.total_authorized_distributors} />
      </div>

      <SimpleChartSection
        title="Revenue timeseries"
        series={data.sales.timeseries.map((row) => ({ label: row.bucket, value: row.revenue }))}
      />

      {data.sales.payment_channels ? (
        <ReportSection title="Canales de venta">
          <div className="card-grid">
            <ReportKpiCard
              label="Stripe ecommerce"
              value={`$${data.sales.payment_channels.stripe_ecommerce.amount.toLocaleString("es-MX")}`}
            />
            <ReportKpiCard
              label="POS total"
              value={`$${data.sales.payment_channels.pos_total.amount.toLocaleString("es-MX")}`}
            />
          </div>
          <RankingTable
            headers={["Metodo POS", "Ventas", "Monto"]}
            rows={data.sales.payment_channels.pos_by_method.map((row) => [
              row.payment_method,
              row.sales,
              `$${row.amount.toLocaleString("es-MX")}`
            ])}
          />
        </ReportSection>
      ) : null}

      <ReportSection title="Top productos">
        <RankingTable
          headers={["Producto", "Unidades", "Revenue"]}
          rows={data.top_products.map((row) => [row.name, row.units, `$${row.revenue.toLocaleString("es-MX")}`])}
        />
      </ReportSection>
    </section>
  );
}
