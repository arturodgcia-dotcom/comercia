import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { useTenantScope } from "../hooks/useTenantScope";
import { api } from "../services/api";

export function TenantDistributorsReportPage() {
  const { token } = useAuth();
  const { isGlobalAdmin, tenantIdForReports, tenantOptions, scopeError, setTenantIdForReports } = useTenantScope();
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !tenantIdForReports) return;
    api
      .getTenantDistributorsReport(token, tenantIdForReports, query)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [token, tenantIdForReports, query]);

  const exportCsv = async () => {
    if (!token || !tenantIdForReports) return;
    const url = api.getTenantReportExportUrl(tenantIdForReports, "distributors", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenant-distributors.csv";
    link.click();
  };

  if (!tenantIdForReports) return <p className="error">No hay marca seleccionada para reportes.</p>;
  if (scopeError) return <p className="error">{scopeError}</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <PageHeader title="Reporte de Distribuidores" subtitle="Canal distribuidor, actividad y recurrencia." />
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
