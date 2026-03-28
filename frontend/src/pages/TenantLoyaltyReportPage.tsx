import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportCsvButton } from "../components/ExportCsvButton";
import { PageHeader } from "../components/PageHeader";
import { PeriodSelector } from "../components/PeriodSelector";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { StatusSummaryCard } from "../components/StatusSummaryCard";
import { api } from "../services/api";

export function TenantLoyaltyReportPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [membership, setMembership] = useState<Record<string, number>>({});
  const [loyalty, setLoyalty] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const query = useMemo(() => `period=${period}`, [period]);

  useEffect(() => {
    if (!token || !user?.tenant_id) return;
    Promise.all([
      api.getTenantReportMemberships(token, user.tenant_id, query),
      api.getTenantReportLoyalty(token, user.tenant_id, query)
    ])
      .then(([m, l]) => {
        setMembership(m);
        setLoyalty(l);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar fidelizacion"));
  }, [token, user?.tenant_id, query]);

  if (!user?.tenant_id) return <p className="error">Tu usuario no tiene tenant asociado.</p>;
  if (error) return <p className="error">{error}</p>;

  const exportCsv = async () => {
    const url = api.getTenantReportExportUrl(user.tenant_id as number, "loyalty", query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "tenant-loyalty.csv";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const couponRows = Array.isArray(loyalty.coupon_performance)
    ? (loyalty.coupon_performance as Array<Record<string, unknown>>)
    : [];

  return (
    <section>
      <PageHeader title="Reporte de Fidelizacion" subtitle="Membresias, puntos, cupones y recompra." />
      <div className="inline-form">
        <PeriodSelector period={period} onChange={setPeriod} />
        <ExportCsvButton onClick={exportCsv} />
      </div>
      <div className="card-grid">
        <ReportKpiCard label="Membresias activas" value={membership.active_memberships ?? 0} />
        <ReportKpiCard label="Membresias inactivas" value={membership.inactive_memberships ?? 0} />
        <ReportKpiCard label="Clientes con membresia" value={membership.customers_with_membership ?? 0} />
        <ReportKpiCard label="Puntos acumulados" value={Number(loyalty.points_accumulated ?? 0)} />
        <ReportKpiCard label="Puntos usados" value={Number(loyalty.points_used ?? 0)} />
      </div>
      <StatusSummaryCard
        title="Cupones con mejor resultado"
        values={couponRows.slice(0, 5).map((row) => ({
          label: String(row.code ?? "-"),
          value: Number(row.orders ?? 0)
        }))}
      />
    </section>
  );
}

