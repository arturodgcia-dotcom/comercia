import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ExportButtons } from "../components/ExportButtons";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import { Order } from "../types/domain";

export function ReinpiaPaymentsPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ tenantId: "", dateFrom: "", dateTo: "", status: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<{
    total_orders: number;
    subtotal_amount: number;
    discount_amount: number;
    total_revenue: number;
    stripe_ecommerce?: { orders: number; amount: number };
    pos?: { sales: number; amount: number; by_method: Array<{ payment_method: string; sales: number; amount: number }> };
  } | null>(null);
  const [commissions, setCommissions] = useState<{ total_commissions: number; total_net_amount: number } | null>(null);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tenantId) params.set("tenant_id", filters.tenantId);
    if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00`);
    if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59`);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getReinpiaPaymentsOrders(token, query),
      api.getReinpiaSalesSummary(token, query),
      api.getReinpiaCommissionsSummary(token, query)
    ])
      .then(([ordersRows, salesSummary, commissionSummary]) => {
        setOrders(ordersRows);
        setSales(salesSummary);
        setCommissions(commissionSummary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar payments globales"));
  }, [token, query]);

  const handleExport = async (
    type: "sales" | "commissions" | "tenants" | "orders" | "commission-agents" | "plan-purchase-leads"
  ) => {
    if (!token) return;
    const { url } = api.getReinpiaExportUrl(token, type, query);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `reinpia-${type}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <section>
      <PageHeader title="REINPIA Payments" subtitle="Ventas, comisiones, netos y ordenes globales con filtros." />
      <FilterBar tenantId={filters.tenantId} dateFrom={filters.dateFrom} dateTo={filters.dateTo} status={filters.status} onChange={setFilters} />
      {error ? <p className="error">{error}</p> : null}

      {sales && commissions ? (
        <div className="card-grid">
          <KpiCard label="Total orders" value={sales.total_orders} />
          <KpiCard label="Subtotal" value={`$${sales.subtotal_amount.toLocaleString("es-MX")}`} />
          <KpiCard label="Descuentos" value={`$${sales.discount_amount.toLocaleString("es-MX")}`} />
          <KpiCard label="Revenue" value={`$${sales.total_revenue.toLocaleString("es-MX")}`} />
          <KpiCard label="Comisiones" value={`$${commissions.total_commissions.toLocaleString("es-MX")}`} />
          <KpiCard label="Neto tenants" value={`$${commissions.total_net_amount.toLocaleString("es-MX")}`} />
          <KpiCard label="Stripe ecommerce" value={`$${(sales.stripe_ecommerce?.amount ?? 0).toLocaleString("es-MX")}`} />
          <KpiCard label="POS total" value={`$${(sales.pos?.amount ?? 0).toLocaleString("es-MX")}`} />
        </div>
      ) : null}

      {sales?.pos?.by_method?.length ? (
        <section className="card">
          <h3>POS por metodo de pago</h3>
          <SummaryTable
            headers={["Metodo", "Ventas", "Monto"]}
            rows={sales.pos.by_method.map((row) => [row.payment_method, row.sales, `$${row.amount.toLocaleString("es-MX")}`])}
          />
        </section>
      ) : null}

      <section className="store-banner">
        <h3>Exportables CSV</h3>
        <ExportButtons onExport={handleExport} />
      </section>

      <section>
        <h3>Ordenes globales</h3>
        <SummaryTable
          headers={["Order", "Tenant", "Status", "Total", "Comision", "Neto", "Fecha"]}
          rows={orders.map((order) => [
            order.id,
            order.tenant_id,
            order.status,
            `$${Number(order.total_amount).toLocaleString("es-MX")}`,
            `$${Number(order.commission_amount).toLocaleString("es-MX")}`,
            `$${Number(order.net_amount).toLocaleString("es-MX")}`,
            new Date(order.created_at).toLocaleString("es-MX")
          ])}
        />
      </section>
    </section>
  );
}
