import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BrandAdminSettings, InternalAlert, TenantCommercialStatus, TenantCommercialUsage } from "../types/domain";

type CapacityCard = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

function statusLabel(used: number, limit: number): string {
  if (limit <= 0) return "Sin límite";
  if (used >= limit) return "Límite alcanzado";
  if (used >= Math.ceil(limit * 0.9)) return "Alerta fuerte";
  if (used >= Math.ceil(limit * 0.8)) return "Alerta preventiva";
  return "Disponible";
}

function statusColor(used: number, limit: number): string {
  if (limit <= 0) return "#22c55e";
  if (used >= limit) return "#ef4444";
  if (used >= Math.ceil(limit * 0.8)) return "#f59e0b";
  return "#22c55e";
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const tenantId = user?.tenant_id ?? null;
  const [commercialStatus, setCommercialStatus] = useState<TenantCommercialStatus | null>(null);
  const [commercialUsage, setCommercialUsage] = useState<TenantCommercialUsage | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [operationalAlerts, setOperationalAlerts] = useState<InternalAlert[]>([]);
  const [metrics, setMetrics] = useState<{ sold: number; commission: number; net: number }>({ sold: 0, commission: 0, net: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !tenantId) return;
    setError("");
    Promise.all([
      api.getTenantCommercialStatus(token, tenantId).catch(() => null),
      api.getTenantCommercialUsage(token, tenantId).catch(() => null),
      api.getBrandAdminSettings(token, tenantId).catch(() => null),
      api.getPaymentsDashboard(token, tenantId).catch(() => null),
      api.getTenantOperationalAlerts(token, tenantId, "is_read=false").catch(() => []),
    ])
      .then(([status, usage, adminSettings, payments, alerts]) => {
        setCommercialStatus(status);
        setCommercialUsage(usage);
        setBrandSettings(adminSettings);
        setOperationalAlerts(alerts ?? []);
        if (!payments) return;
        setMetrics({
          sold: Number(payments.total_sold ?? 0),
          commission: Number(payments.total_commission ?? 0),
          net: Number(payments.total_net ?? 0),
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar el resumen de marca.");
      });
  }, [token, tenantId]);

  const capacityCards = useMemo<CapacityCard[]>(() => {
    if (!commercialUsage) return [];
    return [
      { key: "brands", label: "Marcas", used: commercialUsage.brands_used, limit: commercialUsage.brands_limit },
      { key: "users", label: "Usuarios", used: commercialUsage.users_used, limit: commercialUsage.users_limit },
      { key: "ai_agents", label: "Agentes IA", used: commercialUsage.ai_agents_used, limit: commercialUsage.ai_agents_limit },
      { key: "products", label: "Productos", used: commercialUsage.products_used, limit: commercialUsage.products_limit },
      { key: "branches", label: "Sucursales", used: commercialUsage.branches_used, limit: commercialUsage.branches_limit },
    ];
  }, [commercialUsage]);

  const aiCreditsTotal = useMemo(() => {
    if (!commercialUsage) return 0;
    return Math.max(
      Number(commercialUsage.ai_tokens_assigned ?? 0),
      Number((commercialUsage.ai_tokens_included ?? 0) + (commercialUsage.ai_tokens_extra ?? 0))
    );
  }, [commercialUsage]);

  const aiCreditsUsed = Number(commercialUsage?.ai_tokens_used ?? 0);
  const aiCreditsRemaining = Number(commercialUsage?.ai_tokens_remaining ?? commercialUsage?.ai_tokens_balance ?? 0);
  const aiConsumption = Number(commercialUsage?.ai_tokens_consumption_percentage ?? 0);
  const aiState = commercialUsage?.ai_key_state ?? "abierta";

  return (
    <section>
      <PageHeader
        title="Resumen de marca"
        subtitle="Vista ejecutiva del plan activo, consumo, créditos IA y alertas operativas."
      />
      {error ? <p className="error">{error}</p> : null}

      <article className="card">
        <h3>Estado comercial actual</h3>
        <p>
          <strong>Plan:</strong> {commercialStatus?.plan_display_name || commercialStatus?.commercial_plan_key || "Sin plan asignado"}
        </p>
        <p>
          <strong>Modelo:</strong> {commercialStatus?.billing_model === "commission_based" ? "Comisión por venta" : "Cuota fija"}
          {" | "}
          <strong>Comisión activa:</strong> {commercialStatus?.commission_enabled ? "Sí" : "No"}
          {" | "}
          <strong>Porcentaje:</strong> {Number(commercialStatus?.commission_percentage ?? 0).toFixed(2)}%
        </p>
        <p>
          <strong>Soporte incluido:</strong> {commercialStatus?.support || "Soporte base"}
        </p>
        <div className="row-gap">
          <button className="button" type="button" onClick={() => navigate("/plans")}>
            Ver detalle de plan y límites
          </button>
          <button className="button button-outline" type="button" onClick={() => navigate("/admin/capacity-expand")}>
            Gestionar add-ons y expansión
          </button>
          <button className="button button-outline" type="button" onClick={() => navigate("/admin/support")}>
            Abrir soporte
          </button>
        </div>
      </article>

      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <KpiCard label="Ventas totales" value={`$${metrics.sold.toLocaleString("es-MX")}`} />
        <KpiCard label="Comisión generada" value={`$${metrics.commission.toLocaleString("es-MX")}`} />
        <KpiCard label="Ingreso neto marca" value={`$${metrics.net.toLocaleString("es-MX")}`} />
        <KpiCard label="Estado de llave IA" value={aiState} />
      </div>

      <article className="card">
        <h3>Consumo por capacidad</h3>
        <div className="card-grid">
          {capacityCards.map((item) => (
            <article key={item.key} className="card">
              <h4>{item.label}</h4>
              <p>Usados: {item.used}</p>
              <p>Límite: {item.limit}</p>
              <p>
                <strong>Estatus:</strong> <span style={{ color: statusColor(item.used, item.limit) }}>{statusLabel(item.used, item.limit)}</span>
              </p>
            </article>
          ))}
        </div>
      </article>

      <article className="card">
        <h3>Créditos IA</h3>
        <p>Total asignado: {aiCreditsTotal}</p>
        <p>Consumidos: {aiCreditsUsed}</p>
        <p>Restantes: {aiCreditsRemaining}</p>
        <p>Consumo actual: {aiConsumption.toFixed(2)}%</p>
      </article>

      <article className="card">
        <h3>Configuración internacional</h3>
        <p>País principal: {brandSettings?.country_code ?? "MX"}</p>
        <p>Moneda base: {brandSettings?.currency_base_currency ?? "MXN"}</p>
        <p>Idioma principal: {brandSettings?.language_primary ?? "es"}</p>
      </article>

      <article className="card">
        <h3>Alertas operativas</h3>
        <div className="card-grid">
          {operationalAlerts.slice(0, 6).map((alert) => (
            <article key={alert.id} className="card">
              <p className="marketing-tag">{alert.severity}</p>
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
              <p>{new Date(alert.created_at).toLocaleString("es-MX")}</p>
            </article>
          ))}
          {!operationalAlerts.length ? <p>Sin alertas operativas activas.</p> : null}
        </div>
      </article>
    </section>
  );
}
