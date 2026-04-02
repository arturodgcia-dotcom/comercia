import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { TenantConfig } from "../types/domain";
import { calculatePlanTotals } from "../utils/monetization";

const modules = [
  "Landing Generator",
  "Ecommerce Multitenant",
  "Fidelizacion",
  "Distribuidores",
  "Servicios y Agenda",
  "Logistica",
  "Bots y Agentes",
  "Dashboard Central REINPIA"
];

export function DashboardPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [metrics, setMetrics] = useState<{ sold: number; commission: number; net: number }>({ sold: 0, commission: 0, net: 0 });

  useEffect(() => {
    if (!token || !tenantId) return;
    Promise.all([
      api.getTenantConfig({ tenantId }).catch(() => null),
      api.getPaymentsDashboard(token, tenantId).catch(() => null),
    ]).then(([config, payments]) => {
      setTenantConfig(config);
      if (!payments) return;
      setMetrics({ sold: Number(payments.total_sold ?? 0), commission: Number(payments.total_commission ?? 0), net: Number(payments.total_net ?? 0) });
    });
  }, [token, tenantId]);

  const estimatedSubscriptionSavings = useMemo(() => {
    if (!tenantConfig) return 0;
    const estimated = calculatePlanTotals(
      { subtotal: metrics.sold },
      "commission",
      tenantConfig.commission_rules
    ).commission;
    return Math.max(0, estimated - Number(tenantConfig.subscription_plan.price ?? 0));
  }, [metrics.sold, tenantConfig]);

  return (
    <section>
      <PageHeader
        title="Dashboard Central"
        subtitle="Vista inicial para operacion multitenant de ComerCia by REINPIA."
      />
      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <KpiCard label="Modelo de monetizacion" value={tenantConfig?.plan_type === "commission" ? "Comision" : "Suscripcion"} />
        <KpiCard label="Ventas totales" value={`$${metrics.sold.toLocaleString("es-MX")}`} />
        {tenantConfig?.plan_type === "commission" ? (
          <>
            <KpiCard label="Comision generada" value={`$${metrics.commission.toLocaleString("es-MX")}`} />
            <KpiCard label="Ingreso neto marca" value={`$${metrics.net.toLocaleString("es-MX")}`} />
          </>
        ) : (
          <>
            <KpiCard label="Costo del plan" value={`$${Number(tenantConfig?.subscription_plan.price ?? 0).toLocaleString("es-MX")}`} />
            <KpiCard label="Ahorro estimado vs comision" value={`$${estimatedSubscriptionSavings.toLocaleString("es-MX")}`} />
          </>
        )}
      </div>
      <div className="card-grid">
        {modules.map((module) => (
          <article key={module} className="card">
            <h3>{module}</h3>
            <p>Base inicial lista para evolucionar en siguientes iteraciones.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
