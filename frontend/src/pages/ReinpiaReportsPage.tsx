import { useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportButtons } from "../components/ExportButtons";
import { FilterBar } from "../components/FilterBar";
import { PageHeader } from "../components/PageHeader";

export function ReinpiaReportsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [message, setMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tenantId) params.set("tenant_id", filters.tenantId);
    if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59`);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  const handleExport = async (type: "sales" | "commissions" | "tenants" | "orders") => {
    if (!token) return;
    const url = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1/reinpia/exports/${type}.csv${query ? `?${query}` : ""}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `reinpia-${type}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
    setMessage(`Reporte ${type}.csv generado correctamente.`);
  };

  return (
    <section>
      <PageHeader title="REINPIA Reports" subtitle="Exportes CSV globales para analitica y seguimiento comercial." />
      <FilterBar tenantId={filters.tenantId} dateFrom={filters.dateFrom} dateTo={filters.dateTo} status={filters.status} onChange={setFilters} />
      <section className="store-banner">
        <h3>Exportables disponibles</h3>
        <p>Ventas globales, comisiones, resumen de tenants y ordenes completas.</p>
        <ExportButtons onExport={handleExport} />
      </section>
      {message ? <p>{message}</p> : null}
    </section>
  );
}

