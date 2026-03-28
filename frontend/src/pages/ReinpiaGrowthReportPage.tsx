import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { RankingTable } from "../components/RankingTable";
import { api } from "../services/api";

export function ReinpiaGrowthReportPage() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("month");
  const [top, setTop] = useState<Array<Record<string, unknown>>>([]);
  const [low, setLow] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token) return;
    api
      .getReinpiaReportsGrowth(token, query)
      .then((res) => {
        setTop(res.top_growth ?? []);
        setLow(res.low_movement ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar crecimiento"));
  }, [token, query]);

  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="REINPIA Growth" subtitle="Tenants con mayor y menor movimiento comercial." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <h3>Top crecimiento</h3>
      <RankingTable
        headers={["Tenant", "Revenue", "Ordenes pagadas"]}
        rows={top.map((row) => [String(row.tenant_name ?? "-"), `$${Number(row.revenue ?? 0).toLocaleString("es-MX")}`, Number(row.paid_orders ?? 0)])}
      />
      <h3>Menor movimiento</h3>
      <RankingTable
        headers={["Tenant", "Revenue", "Ordenes pagadas"]}
        rows={low.map((row) => [String(row.tenant_name ?? "-"), `$${Number(row.revenue ?? 0).toLocaleString("es-MX")}`, Number(row.paid_orders ?? 0)])}
      />
    </section>
  );
}

