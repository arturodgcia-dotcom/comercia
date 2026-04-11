import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AiCreditMovement, BrandAdminSettings, CommercialAddon, CommercialPlan, TenantCommercialStatus, TenantCommercialUsage } from "../types/domain";

type CapacityCard = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

const WARNING_RATIO = 0.8;

function statusLabel(used: number, limit: number): string {
  if (limit <= 0) return "Sin limite";
  if (used > limit) return "Excedido";
  if (used >= Math.ceil(limit * WARNING_RATIO)) return "Cerca del limite";
  return "Disponible";
}

function supportChannel(support: string | null | undefined): "correo" | "chat" {
  const normalized = String(support || "").toLowerCase();
  return normalized.includes("chat") ? "chat" : "correo";
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const [commercialStatus, setCommercialStatus] = useState<TenantCommercialStatus | null>(null);
  const [commercialUsage, setCommercialUsage] = useState<TenantCommercialUsage | null>(null);
  const [planCatalog, setPlanCatalog] = useState<CommercialPlan[]>([]);
  const [addonsCatalog, setAddonsCatalog] = useState<CommercialAddon[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [aiMovements, setAiMovements] = useState<AiCreditMovement[]>([]);
  const [metrics, setMetrics] = useState<{ sold: number; commission: number; net: number }>({ sold: 0, commission: 0, net: 0 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  useEffect(() => {
    if (!token || !tenantId) return;
    setError("");
    Promise.all([
      api.getTenantCommercialStatus(token, tenantId).catch(() => null),
      api.getTenantCommercialUsage(token, tenantId).catch(() => null),
      api.getCommercialPlanCatalog(token).catch(() => null),
      api.getBrandAdminSettings(token, tenantId).catch(() => null),
      api.getPaymentsDashboard(token, tenantId).catch(() => null),
      api.getTenantAiCreditMovements(token, tenantId, 8).catch(() => []),
    ]).then(([status, usage, catalog, adminSettings, payments, movements]) => {
      setCommercialStatus(status);
      setCommercialUsage(usage);
      setPlanCatalog(catalog?.plans ?? []);
      setAddonsCatalog(catalog?.addons ?? []);
      setBrandSettings(adminSettings);
      setAiMovements(movements ?? []);
      if (!payments) return;
      setMetrics({ sold: Number(payments.total_sold ?? 0), commission: Number(payments.total_commission ?? 0), net: Number(payments.total_net ?? 0) });
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "No fue posible cargar el dashboard de marca.");
    });
  }, [token, tenantId]);

  const activePlan = useMemo(
    () => planCatalog.find((plan) => plan.id === commercialStatus?.commercial_plan_key) ?? null,
    [planCatalog, commercialStatus?.commercial_plan_key]
  );

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

  const creditsExtra = useMemo(() => {
    if (!commercialUsage) return 0;
    return commercialUsage.addons.reduce((acc, addon) => {
      if (addon.addon_id === "extra_500_tokens") return acc + (addon.quantity * 500);
      return acc;
    }, 0);
  }, [commercialUsage]);

  const estimatedSubscriptionSavings = useMemo(() => {
    if (!commercialStatus?.commission_enabled) return 0;
    const estimated = metrics.sold * (Number(commercialStatus.commission_percentage || 0) / 100);
    return Math.max(0, estimated - metrics.commission);
  }, [metrics.sold, metrics.commission, commercialStatus]);

  const handlePlanRequest = async (payload: { request_type: "addon" | "upgrade"; addon_id?: string; target_plan_key?: string; notes: string }) => {
    if (!token || !tenantId) return;
    try {
      setLoadingAction(payload.addon_id || payload.target_plan_key || payload.request_type);
      setError("");
      setMessage("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: tenantId,
        request_type: payload.request_type,
        addon_id: payload.addon_id,
        target_plan_key: payload.target_plan_key,
        notes: payload.notes,
      });
      setMessage("Solicitud registrada. El equipo ComerCia revisara costo y activacion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la solicitud comercial.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Dashboard de marca"
        subtitle="Panel gobernado por plan contratado: capacidad, consumo, soporte, comision y expansion."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <article className="card">
        <h3>Plan contratado</h3>
        <p>
          <strong>Plan:</strong> {activePlan?.display_name || commercialStatus?.plan_display_name || commercialStatus?.commercial_plan_key || "Sin plan asignado"}
        </p>
        <p>
          <strong>Tipo:</strong> {commercialStatus?.billing_model === "commission_based" ? "Comision por venta" : "Cuota fija"}
          {" | "}<strong>Estado:</strong> {commercialStatus?.commercial_plan_status || "not_purchased"}
          {" | "}<strong>Activacion:</strong> {commercialStatus?.plan_activated_at ? new Date(commercialStatus.plan_activated_at).toLocaleString("es-MX") : "Sin fecha"}
        </p>
        <p>
          <strong>Soporte incluido:</strong> {commercialStatus?.support || activePlan?.support || "Soporte base"}
        </p>
      </article>

      <div className="card-grid" style={{ marginBottom: "1rem" }}>
        <KpiCard label="Modelo de monetizacion" value={commercialStatus?.billing_model === "commission_based" ? "Comision por venta" : "Cuota fija"} />
        <KpiCard label="Ventas totales" value={`$${metrics.sold.toLocaleString("es-MX")}`} />
        {commercialStatus?.billing_model === "commission_based" ? (
          <>
            <KpiCard label="Comision generada" value={`$${metrics.commission.toLocaleString("es-MX")}`} />
            <KpiCard label="Porcentaje de comision" value={`${Number(commercialStatus?.commission_percentage ?? 0).toFixed(2)}%`} />
            <KpiCard label="Ingreso neto marca" value={`$${metrics.net.toLocaleString("es-MX")}`} />
          </>
        ) : (
          <>
            <KpiCard label="Comision por venta" value="Desactivada" />
            <KpiCard label="Ahorro vs escenario comision" value={`$${estimatedSubscriptionSavings.toLocaleString("es-MX")}`} />
          </>
        )}
      </div>

      <article className="card">
        <h3>Capacidad y consumo del plan</h3>
        <div className="card-grid">
          {capacityCards.map((item) => {
            const available = item.limit > 0 ? item.limit - item.used : 0;
            return (
              <article key={item.key} className="card">
                <h4>{item.label}</h4>
                <p>Usados: {item.used}</p>
                <p>Permitidos: {item.limit}</p>
                <p>Disponibles: {available}</p>
                <p><strong>Estatus:</strong> {statusLabel(item.used, item.limit)}</p>
              </article>
            );
          })}
          <article className="card">
            <h4>Creditos IA</h4>
            <p>Incluidos por plan: {commercialUsage?.ai_tokens_included ?? 0}</p>
            <p>Extra comprados: {commercialUsage?.ai_tokens_extra ?? creditsExtra}</p>
            <p>Asignados a la marca: {commercialUsage?.ai_tokens_assigned ?? 0}</p>
            <p>Reservados: {commercialUsage?.ai_tokens_reserved ?? 0}</p>
            <p>Consumidos: {commercialUsage?.ai_tokens_used ?? 0}</p>
            <p>Restantes: {commercialUsage?.ai_tokens_remaining ?? commercialUsage?.ai_tokens_balance ?? 0}</p>
            <p><strong>Estado llave IA:</strong> {commercialUsage?.ai_key_state ?? "abierta"}</p>
            <p><strong>Consumo:</strong> {Number(commercialUsage?.ai_tokens_consumption_percentage ?? 0).toFixed(2)}%</p>
            <progress value={commercialUsage?.ai_tokens_used ?? 0} max={Math.max(commercialUsage?.ai_tokens_assigned ?? 1, 1)} />
          </article>
          <article className="card">
            <h4>Sucursales (detalle)</h4>
            <p>Activas: {commercialUsage?.branches_active ?? 0}</p>
            <p>Desactivadas: {commercialUsage?.branches_inactive ?? 0}</p>
            <p>Disponibles por activar: {Math.max((commercialUsage?.branches_limit ?? 0) - (commercialUsage?.branches_used ?? 0), 0)}</p>
          </article>
        </div>
      </article>

      <article className="card-grid">
        <article className="card">
          <h3>Comision por venta</h3>
          {commercialStatus?.commission_enabled ? (
            <>
              <p><strong>Comision sobre venta activa</strong></p>
              <p>Porcentaje: {Number(commercialStatus.commission_percentage ?? 0).toFixed(2)}%</p>
              <p>Scope: {user?.role === "tenant_admin" ? "ventas_online_pagadas" : "ventas_online_pagadas"}</p>
              <p>Ventas sujetas a comision: ${metrics.sold.toLocaleString("es-MX")}</p>
              <p>Comision acumulada estimada: ${metrics.commission.toLocaleString("es-MX")}</p>
            </>
          ) : (
            <p><strong>Comision sobre venta desactivada</strong></p>
          )}
        </article>

        <article className="card">
          <h3>Soporte por plan</h3>
          {supportChannel(commercialStatus?.support) === "correo" ? (
            <>
              <p>Canal principal: Correo</p>
              <p>Correo de atencion: soporte@comercia.mx</p>
            </>
          ) : (
            <>
              <p>Canal principal: Chat agente IA</p>
              <p>Escalamiento a persona: Base visual preparada (sin integracion Telegram en esta fase).</p>
            </>
          )}
          <Link className="button button-outline" to="/admin/channels/landing">
            Abrir soporte comercial
          </Link>
        </article>
      </article>

      <article className="card">
        <h3>Expandir capacidad</h3>
        <p>Recursos cerca del limite: {capacityCards.filter((item) => item.limit > 0 && item.used >= Math.ceil(item.limit * WARNING_RATIO)).map((x) => x.label).join(", ") || "Sin alertas de capacidad"}</p>
        <div className="card-grid">
          {addonsCatalog.map((addon) => (
            <article key={addon.id} className="card">
              <p><strong>{addon.display_name || addon.name}</strong></p>
              <p>${Number(addon.total_price_mxn || addon.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN</p>
              <button
                className="button button-outline"
                type="button"
                disabled={Boolean(loadingAction)}
                onClick={() => void handlePlanRequest({ request_type: "addon", addon_id: addon.id, notes: `Solicitud desde dashboard de marca: ${addon.id}` })}
              >
                {loadingAction === addon.id ? "Enviando..." : "Adquirir add-ons"}
              </button>
            </article>
          ))}
        </div>
        <div className="row-gap">
          <button
            className="button"
            type="button"
            disabled={Boolean(loadingAction)}
            onClick={() => void handlePlanRequest({ request_type: "upgrade", target_plan_key: "fixed_subscription_growth", notes: "Solicitud de mejora de plan desde dashboard de marca." })}
          >
            Mejorar plan
          </button>
        </div>
      </article>

      <article className="card">
        <h3>Configuracion internacional (base)</h3>
        <p>Pais activo: {brandSettings?.country_code ?? "MX"}</p>
        <p>Moneda base: {brandSettings?.currency_base_currency ?? "MXN"}</p>
        <p>Idioma principal: {brandSettings?.language_primary ?? "es"}</p>
        <p>Expansion habilitada: {brandSettings?.expansion_enabled ? "Si" : "No"}</p>
        <p>Operacion fuera de Mexico: {brandSettings?.cross_border_enabled ? "Si" : "No"}</p>
      </article>

      <div className="card-grid">
        <article className="card">
          <h3>Modulo avanzado: Logistica</h3>
          <p>{brandSettings?.feature_logistics_enabled ? "Habilitado por contrato" : "Deshabilitado por defecto. Requiere activacion global ComerCia."}</p>
        </article>
        <article className="card">
          <h3>Modulo avanzado: Jornada laboral</h3>
          <p>{brandSettings?.feature_workday_enabled ? "Habilitado por contrato" : "Deshabilitado por defecto. Requiere activacion global ComerCia."}</p>
        </article>
        <article className="card">
          <h3>Modulo avanzado: Programacion / Grabado / Impresion NFC</h3>
          <p>{brandSettings?.feature_nfc_operations_enabled ? "Habilitado por contrato" : "Deshabilitado por defecto. Requiere activacion global ComerCia."}</p>
        </article>
      </div>

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Trazabilidad de consumo IA</h3>
        <p>Se registra consumo por fuente para control operativo de creditos IA por marca.</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Accion</th>
                <th>Fuente</th>
                <th>Delta</th>
                <th>Saldo</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {aiMovements.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString("es-MX")}</td>
                  <td>{row.action}</td>
                  <td>{row.source}</td>
                  <td>{row.tokens_delta}</td>
                  <td>{row.balance_after}</td>
                  <td>{row.notes || "-"}</td>
                </tr>
              ))}
              {!aiMovements.length ? (
                <tr>
                  <td colSpan={6}>Sin consumos IA registrados para esta marca.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
