import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { InsightCard } from "../components/InsightCard";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { RankingTable } from "../components/RankingTable";
import { useTenantScope } from "../hooks/useTenantScope";
import { api } from "../services/api";
import { MarketingInsightItem } from "../types/domain";

export function TenantMarketingInsightsPage() {
  const { token, user } = useAuth();
  const { isGlobalAdmin, tenantIdForReports, tenantOptions, scopeError, setTenantIdForReports } = useTenantScope();
  const [period, setPeriod] = useState("month");
  const [insights, setInsights] = useState<MarketingInsightItem[]>([]);
  const [categories, setCategories] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !tenantIdForReports) return;
    api
      .getTenantMarketingInsights(token, tenantIdForReports, query)
      .then((res) => {
        const normalized = ((res.insights ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
          id: Number(row.id ?? idx + 1),
          tenant_id: Number(row.tenant_id ?? tenantIdForReports ?? 0),
          insight_type: String(row.insight_type ?? "insight"),
          category: row.category ? String(row.category) : null,
          product_id: row.product_id ? Number(row.product_id) : null,
          message: String(row.message ?? ""),
          recommendation: String(row.recommendation ?? ""),
          period_label: String(row.period_label ?? "current"),
          created_at: String(row.created_at ?? new Date().toISOString())
        }));
        setInsights(normalized);
        setCategories(res.top_categories ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar insights"));
  }, [token, tenantIdForReports, query, user?.tenant_id]);

  const exportCsv = async () => {
    if (!token || !tenantIdForReports) return;
    const url = api.getTenantReportExportUrl(tenantIdForReports, "marketing-insights", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenant-marketing-insights.csv";
    link.click();
  };

  if (!tenantIdForReports) return <p className="error">No hay marca seleccionada para reportes.</p>;
  if (scopeError) return <p className="error">{scopeError}</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="Insights de Marketing" subtitle="Recomendaciones accionables por productos, categorias y recompra." />
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
      <div className="stack">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            title={insight.insight_type}
            message={insight.message}
            recommendation={insight.recommendation}
          />
        ))}
      </div>
      <RankingTable
        headers={["Categoria", "Unidades", "Revenue"]}
        rows={categories.map((row) => [String(row.name ?? "-"), Number(row.units ?? 0), `$${Number(row.revenue ?? 0).toLocaleString("es-MX")}`])}
      />
    </section>
  );
}
