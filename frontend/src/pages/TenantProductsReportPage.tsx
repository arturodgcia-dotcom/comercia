import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { InsightCard } from "../components/InsightCard";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { RankingTable } from "../components/RankingTable";
import { ReportSection } from "../components/ReportSection";
import { useTenantScope } from "../hooks/useTenantScope";
import { api } from "../services/api";

export function TenantProductsReportPage() {
  const { token } = useAuth();
  const { isGlobalAdmin, tenantIdForReports, tenantOptions, scopeError, setTenantIdForReports } = useTenantScope();
  const [period, setPeriod] = useState("month");
  const [topRows, setTopRows] = useState<Array<Record<string, unknown>>>([]);
  const [lowRows, setLowRows] = useState<Array<Record<string, unknown>>>([]);
  const [unsoldRows, setUnsoldRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !tenantIdForReports) return;
    Promise.all([
      api.getTenantTopProducts(token, tenantIdForReports, query),
      api.getTenantLowProducts(token, tenantIdForReports, query),
      api.getTenantUnsoldProducts(token, tenantIdForReports, query)
    ])
      .then(([top, low, unsold]) => {
        setTopRows(top);
        setLowRows(low);
        setUnsoldRows(unsold);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar productos"));
  }, [token, tenantIdForReports, query]);

  if (!tenantIdForReports) return <p className="error">No hay marca seleccionada para reportes.</p>;
  if (scopeError) return <p className="error">{scopeError}</p>;
  if (error) return <p className="error">{error}</p>;

  const exportCsv = async () => {
    const url = api.getTenantReportExportUrl(tenantIdForReports, "products", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "tenant-products.csv";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <section>
      <PageHeader title="Reporte de Productos" subtitle="Top, baja rotacion y productos sin ventas." />
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
      <ReportSection title="Mas vendidos">
        <RankingTable
          headers={["Producto", "Unidades", "Revenue"]}
          rows={topRows.map((row) => [String(row.name ?? "-"), Number(row.units ?? 0), `$${Number(row.revenue ?? 0).toLocaleString("es-MX")}`])}
        />
      </ReportSection>
      <ReportSection title="Menor rotacion">
        <RankingTable
          headers={["Producto", "Unidades", "Revenue"]}
          rows={lowRows.map((row) => [String(row.name ?? "-"), Number(row.units ?? 0), `$${Number(row.revenue ?? 0).toLocaleString("es-MX")}`])}
        />
      </ReportSection>
      <ReportSection title="Sin ventas">
        <RankingTable
          headers={["Producto", "Precio"]}
          rows={unsoldRows.map((row) => [String(row.name ?? "-"), `$${Number(row.price_public ?? 0).toLocaleString("es-MX")}`])}
        />
      </ReportSection>
      {unsoldRows.length > 0 ? (
        <InsightCard
          title="Recomendacion comercial"
          message="Se detectaron productos sin venta."
          recommendation="Crear promocion focalizada, mejorar posicion en home y evaluar ajuste de precio."
        />
      ) : null}
    </section>
  );
}
