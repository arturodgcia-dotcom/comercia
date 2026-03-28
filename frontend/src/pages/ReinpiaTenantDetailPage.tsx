import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SummaryTable } from "../components/SummaryTable";
import { api } from "../services/api";
import { Order, ReinpiaSubscription, ReinpiaTenantKpis, Tenant, TenantBranding } from "../types/domain";

export function ReinpiaTenantDetailPage() {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [kpis, setKpis] = useState<ReinpiaTenantKpis | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReinpiaSubscription[]>([]);
  const [appointmentSummary, setAppointmentSummary] = useState<{ total: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [logisticsSummary, setLogisticsSummary] = useState<{ total: number; delivered: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [distributorSummary, setDistributorSummary] = useState<{ total_applications: number; approved_profiles: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !tenantId) return;
    Promise.all([
      api.getTenantById(token, Number(tenantId)),
      api.getTenantBranding(token, Number(tenantId)),
      api.getReinpiaTenantKpis(token, Number(tenantId)),
      api.getReinpiaTenantOrders(token, Number(tenantId)),
      api.getReinpiaTenantSubscriptions(token, Number(tenantId)),
      api.getReinpiaAppointmentsSummary(token, `tenant_id=${tenantId}`),
      api.getReinpiaLogisticsSummary(token, `tenant_id=${tenantId}`),
      api.getReinpiaDistributorsSummary(token, `tenant_id=${tenantId}`)
    ])
      .then(([tenantData, brandingData, kpisData, orderData, subscriptionData, appSummary, logSummary, distSummary]) => {
        setTenant(tenantData);
        setBranding(brandingData);
        setKpis(kpisData);
        setOrders(orderData.slice(0, 20));
        setSubscriptions(subscriptionData);
        setAppointmentSummary(appSummary);
        setLogisticsSummary(logSummary);
        setDistributorSummary(distSummary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar tenant detail"));
  }, [token, tenantId]);

  if (error) return <p className="error">{error}</p>;
  if (!tenant || !kpis) return <p>Cargando detalle tenant...</p>;

  return (
    <section>
      <PageHeader title={`Tenant Detail #${tenant.id}`} subtitle={`${tenant.name} | ${tenant.business_type} | plan ${tenant.plan_id ?? "-"}`} />
      <div className="row-gap">
        <Link className="button button-outline" to="/reinpia/tenants">
          Volver a tenants
        </Link>
        <Link className="button button-outline" to={`/tenants/${tenant.id}/branding`}>
          Editar branding tenant
        </Link>
      </div>

      <div className="card-grid">
        <KpiCard label="Revenue" value={`$${kpis.revenue.toLocaleString("es-MX")}`} />
        <KpiCard label="Comisiones" value={`$${kpis.commissions.toLocaleString("es-MX")}`} />
        <KpiCard label="Neto" value={`$${kpis.net_amount.toLocaleString("es-MX")}`} />
        <KpiCard label="Paid orders" value={kpis.paid_orders} />
        <KpiCard label="Failed orders" value={kpis.failed_orders} />
        <KpiCard label="Subscription activa" value={kpis.active_subscription_status ? "Si" : "No"} />
        <KpiCard label="Distribuidores aprobados" value={kpis.distributors_approved} />
        <KpiCard label="Citas" value={kpis.appointments_count} />
        <KpiCard label="Logistica entregada" value={kpis.logistics_delivered_count} />
      </div>

      <section className="store-banner">
        <h3>Branding resumido</h3>
        <p>Hero: {branding?.hero_title ?? "-"}</p>
        <p>Subtitulo: {branding?.hero_subtitle ?? "-"}</p>
        <p>Email: {branding?.contact_email ?? "-"}</p>
      </section>

      <section>
        <h3>Orders recientes</h3>
        <SummaryTable
          headers={["Order", "Status", "Total", "Comision", "Neto", "Fecha"]}
          rows={orders.map((order) => [
            order.id,
            order.status,
            `$${Number(order.total_amount).toLocaleString("es-MX")}`,
            `$${Number(order.commission_amount).toLocaleString("es-MX")}`,
            `$${Number(order.net_amount).toLocaleString("es-MX")}`,
            new Date(order.created_at).toLocaleString("es-MX")
          ])}
        />
      </section>

      <section>
        <h3>Subscriptions tenant</h3>
        <SummaryTable
          headers={["ID", "Plan", "Status", "Started", "Ends"]}
          rows={subscriptions.map((sub) => [sub.id, sub.plan_id, sub.status, sub.started_at, sub.ends_at ?? "-"])}
        />
      </section>

      <section>
        <h3>Resumen operativo</h3>
        <SummaryTable
          headers={["Modulo", "Dato", "Valor"]}
          rows={[
            ["Appointments", "Total", appointmentSummary?.total ?? 0],
            ["Logistics", "Total", logisticsSummary?.total ?? 0],
            ["Logistics", "Delivered", logisticsSummary?.delivered ?? 0],
            ["Distributors", "Solicitudes", distributorSummary?.total_applications ?? 0],
            ["Distributors", "Aprobados", distributorSummary?.approved_profiles ?? 0]
          ]}
        />
      </section>
    </section>
  );
}

