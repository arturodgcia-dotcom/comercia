import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AiCreditMovement, BrandAdminSettings, CommercialAddon, CommercialPlan, InternalAlert, TenantCommercialStatus, TenantCommercialUsage } from "../types/domain";
import { resolveCapacitySuggestion, shouldSuggestUpgrade } from "../utils/capacityActions";

type CapacityCard = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

const PREVENTIVE_RATIO = 0.8;
const STRONG_RATIO = 0.9;

function statusLabel(used: number, limit: number): string {
  if (limit <= 0) return "Sin limite";
  if (used >= limit) return "Limite alcanzado";
  if (used >= Math.ceil(limit * STRONG_RATIO)) return "Alerta fuerte";
  if (used >= Math.ceil(limit * PREVENTIVE_RATIO)) return "Alerta preventiva";
  return "Disponible";
}

function statusColor(used: number, limit: number): string {
  if (limit <= 0) return "#22c55e";
  if (used >= limit) return "#ef4444";
  if (used >= Math.ceil(limit * PREVENTIVE_RATIO)) return "#f59e0b";
  return "#22c55e";
}

function usageRatio(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.max(0, Math.min((used / Math.max(limit, 1)) * 100, 100));
}

function usageMessage(label: string, used: number, limit: number): string {
  if (limit <= 0) return `No hay limite configurado para ${label.toLowerCase()}.`;
  return `Estas usando ${used} de ${limit} ${label.toLowerCase()} disponibles en tu plan.`;
}

function capacityCodeForCard(cardKey: string): string | null {
  if (cardKey === "products") return "capacity_products";
  if (cardKey === "users") return "capacity_users";
  if (cardKey === "ai_agents") return "capacity_ai_agents";
  if (cardKey === "branches") return "capacity_branches";
  if (cardKey === "brands") return "capacity_brands";
  return null;
}

function creditState(remainingPercentage: number): "ok" | "warning" | "critical" {
  if (remainingPercentage <= 10) return "critical";
  if (remainingPercentage <= 30) return "warning";
  return "ok";
}

function creditStateColor(state: "ok" | "warning" | "critical"): string {
  if (state === "critical") return "#ef4444";
  if (state === "warning") return "#f59e0b";
  return "#22c55e";
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
  const [operationalAlerts, setOperationalAlerts] = useState<InternalAlert[]>([]);
  const [metrics, setMetrics] = useState<{ sold: number; commission: number; net: number }>({ sold: 0, commission: 0, net: 0 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState("");

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
      api.getTenantOperationalAlerts(token, tenantId, "is_read=false").catch(() => []),
    ]).then(([status, usage, catalog, adminSettings, payments, movements, alerts]) => {
      setCommercialStatus(status);
      setCommercialUsage(usage);
      setPlanCatalog(catalog?.plans ?? []);
      setAddonsCatalog(catalog?.addons ?? []);
      setBrandSettings(adminSettings);
      setAiMovements(movements ?? []);
      setOperationalAlerts(alerts ?? []);
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
      if (addon.addon_id === "extra_500_ai_credits") return acc + (addon.quantity * 500);
      return acc;
    }, 0);
  }, [commercialUsage]);

  const aiCreditsTotal = useMemo(() => {
    if (!commercialUsage) return 0;
    return Math.max(
      Number(commercialUsage.ai_tokens_assigned ?? 0),
      Number((commercialUsage.ai_tokens_included ?? 0) + (commercialUsage.ai_tokens_extra ?? 0)),
    );
  }, [commercialUsage]);

  const aiCreditsUsed = Number(commercialUsage?.ai_tokens_used ?? 0);
  const aiCreditsRemaining = Number(commercialUsage?.ai_tokens_remaining ?? commercialUsage?.ai_tokens_balance ?? 0);
  const aiCreditsRemainingPercentage = aiCreditsTotal > 0 ? Math.max(0, (aiCreditsRemaining / aiCreditsTotal) * 100) : 0;
  const aiCreditVisualState = creditState(aiCreditsRemainingPercentage);
  const aiCreditVisualColor = creditStateColor(aiCreditVisualState);
  const aiCreditsLocked = aiCreditsRemaining <= 0 || commercialUsage?.ai_key_state === "bloqueada";

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

  const handleAddonCheckout = async (
    itemCode: string,
    context?: {
      resourceOrigin?: string | null;
      uiOrigin?: "alert" | "dashboard_brand" | "dashboard_global";
    },
  ) => {
    if (!token) return;
    try {
      setLoadingCheckout(itemCode);
      setError("");
      const baseUrl = window.location.origin;
      const response = await api.createCommercialPlanCheckoutSession(token, {
        tenant_id: tenantId ?? undefined,
        item_code: itemCode,
        add_on_code: itemCode,
        resource_origin: context?.resourceOrigin || undefined,
        ui_origin: context?.uiOrigin || "dashboard_brand",
        success_url: `${baseUrl}/?checkout=success`,
        cancel_url: `${baseUrl}/?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar la compra en este momento. Intenta nuevamente.");
    } finally {
      setLoadingCheckout("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Resumen de marca"
        subtitle="Operación y consumo del plan: canales, límites, soporte, add-ons y alertas."
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
            const color = statusColor(item.used, item.limit);
            const capacityCode = capacityCodeForCard(item.key);
            const suggestion = resolveCapacitySuggestion(capacityCode);
            const ratio = item.limit > 0 ? item.used / Math.max(item.limit, 1) : 0;
            const showAction = ratio >= PREVENTIVE_RATIO;
            const showUpgrade = shouldSuggestUpgrade(item.used, item.limit, suggestion?.thresholdUpgradeRatio ?? 0.95);
            return (
              <article key={item.key} className="card">
                <h4>{item.label}</h4>
                <p>Usados: {item.used}</p>
                <p>Permitidos: {item.limit}</p>
                <p>Disponibles: {available}</p>
                <p><strong>Estatus:</strong> <span style={{ color }}>{statusLabel(item.used, item.limit)}</span></p>
                <p>{usageMessage(item.label, item.used, item.limit)}</p>
                <div style={{ height: "10px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden" }}>
                  <div style={{ width: `${usageRatio(item.used, item.limit)}%`, background: color, height: "100%" }} />
                </div>
                {showAction && suggestion ? (
                  <div className="row-gap" style={{ marginTop: "8px" }}>
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={Boolean(loadingCheckout)}
                      onClick={() => void handleAddonCheckout(suggestion.addonCode, { resourceOrigin: suggestion.resource, uiOrigin: "dashboard_brand" })}
                    >
                      {loadingCheckout === suggestion.addonCode ? "Redirigiendo..." : suggestion.addonLabel}
                    </button>
                    {showUpgrade ? (
                      <button
                        className="button"
                        type="button"
                        disabled={Boolean(loadingAction)}
                        onClick={() => void handlePlanRequest({ request_type: "upgrade", target_plan_key: "growth_fixed", notes: `Solicitud de upgrade por limite en ${item.label.toLowerCase()}.` })}
                      >
                        {loadingAction === "growth_fixed" ? "Enviando..." : "Mejorar plan"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
          <article className="card">
            <h4>Creditos IA</h4>
            <p>Creditos totales: {aiCreditsTotal}</p>
            <p>Creditos consumidos: {aiCreditsUsed}</p>
            <p>Creditos restantes: {aiCreditsRemaining}</p>
            <p>Te quedan {aiCreditsRemaining} de {aiCreditsTotal} creditos este mes.</p>
            <p>Incluidos por plan: {commercialUsage?.ai_tokens_included ?? 0}</p>
            <p>Extra comprados: {commercialUsage?.ai_tokens_extra ?? creditsExtra}</p>
            <p>Asignados a la marca: {commercialUsage?.ai_tokens_assigned ?? aiCreditsTotal}</p>
            <p>Reservados: {commercialUsage?.ai_tokens_reserved ?? 0}</p>
            <p>Consumidos: {aiCreditsUsed}</p>
            <p>Restantes: {aiCreditsRemaining}</p>
            <p><strong>Estado llave IA:</strong> {commercialUsage?.ai_key_state ?? "abierta"}</p>
            <p><strong>Consumo:</strong> {Number(commercialUsage?.ai_tokens_consumption_percentage ?? 0).toFixed(2)}%</p>
            {aiCreditVisualState === "warning" ? (
              <p style={{ color: "#f59e0b" }}><strong>Advertencia:</strong> te queda menos del 30% de créditos IA.</p>
            ) : null}
            {aiCreditVisualState === "critical" ? (
              <p style={{ color: "#ef4444" }}><strong>Alerta crítica:</strong> te queda menos del 10% de créditos IA.</p>
            ) : null}
            <div style={{ height: "12px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, 100 - Number(commercialUsage?.ai_tokens_consumption_percentage ?? 0)))}%`,
                  background: aiCreditVisualColor,
                  height: "100%",
                }}
              />
            </div>
            <p>{usageMessage("creditos IA", aiCreditsUsed, Math.max(aiCreditsTotal, 0))}</p>
            <button
              className="button"
              type="button"
              disabled={Boolean(loadingCheckout)}
              onClick={() => void handleAddonCheckout("extra_500_ai_credits", { resourceOrigin: "capacity_ai_credits", uiOrigin: "dashboard_brand" })}
            >
              {loadingCheckout === "extra_500_ai_credits" ? "Redirigiendo..." : "Comprar más créditos"}
            </button>
            {aiCreditsLocked ? (
              <p style={{ color: "#ef4444", marginTop: "8px" }}>
                Has alcanzado tu límite de uso de IA. Puedes adquirir más créditos para continuar.
              </p>
            ) : null}
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
        <p>Recursos cerca del limite: {capacityCards.filter((item) => item.limit > 0 && item.used >= Math.ceil(item.limit * PREVENTIVE_RATIO)).map((x) => x.label).join(", ") || "Sin alertas de capacidad"}</p>
        <div className="card-grid">
          {addonsCatalog.map((addon) => (
            <article key={addon.id} className="card">
              <p><strong>{addon.display_name || addon.name}</strong></p>
              <p>${Number(addon.total_price_mxn || addon.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN</p>
              <button
                className="button button-outline"
                type="button"
                disabled={Boolean(loadingCheckout)}
                onClick={() => void handleAddonCheckout(addon.code, { resourceOrigin: addon.code, uiOrigin: "dashboard_brand" })}
              >
                {loadingCheckout === addon.code ? "Redirigiendo..." : "Adquirir add-ons"}
              </button>
            </article>
          ))}
        </div>
        <div className="row-gap">
          <button
            className="button"
            type="button"
            disabled={Boolean(loadingAction)}
            onClick={() => void handlePlanRequest({ request_type: "upgrade", target_plan_key: "growth_fixed", notes: "Solicitud de mejora de plan desde dashboard de marca." })}
          >
            Mejorar plan
          </button>
        </div>
      </article>

      <article className="card">
        <h3>Configuracion internacional (base)</h3>
        <p>Pais activo: {brandSettings?.country_code ?? "MX"}</p>
        <p>Paises habilitados: {brandSettings?.countries_enabled?.join(", ") || "MX"}</p>
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
        <h3>Add-ons contratables y estado comercial</h3>
        <p>Estos módulos permanecen deshabilitados por defecto y solo ComerCia global puede activarlos.</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Add-on</th>
                <th>Estado</th>
                <th>Plan</th>
                <th>Sucursales scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Logística</td>
                <td>{brandSettings?.addon_logistics_status ?? "deshabilitado"}</td>
                <td>{brandSettings?.addon_logistics_plan || "-"}</td>
                <td>{brandSettings?.addon_logistics_scope_branch_ids?.join(", ") || "-"}</td>
              </tr>
              <tr>
                <td>Jornada laboral</td>
                <td>{brandSettings?.addon_workday_status ?? "deshabilitado"}</td>
                <td>{brandSettings?.addon_workday_plan || "-"}</td>
                <td>{brandSettings?.addon_workday_scope_branch_ids?.join(", ") || "-"}</td>
              </tr>
              <tr>
                <td>NFC</td>
                <td>{brandSettings?.addon_nfc_status ?? "deshabilitado"}</td>
                <td>{brandSettings?.addon_nfc_plan || "-"}</td>
                <td>{brandSettings?.addon_nfc_scope_branch_ids?.join(", ") || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Alertas operativas centinela</h3>
        <p>Alertas internas por límites, consumo IA y módulos críticos de esta marca.</p>
        <div className="card-grid">
          {operationalAlerts.map((alert) => (
            (() => {
              const suggestion = resolveCapacitySuggestion(alert.related_entity_type);
              const severity = String(alert.severity || "").toLowerCase();
              const mustSuggestUpgrade = severity === "high" || severity === "warning";
              return (
                <article key={alert.id} className="card">
                  <p className="marketing-tag">{alert.severity}</p>
                  <h4>{alert.title}</h4>
                  <p>{alert.message}</p>
                  <p>{new Date(alert.created_at).toLocaleString("es-MX")}</p>
                  <div className="row-gap">
                    {suggestion ? (
                      <button
                        className="button button-outline"
                        type="button"
                        disabled={Boolean(loadingCheckout)}
                        onClick={() => void handleAddonCheckout(suggestion.addonCode, { resourceOrigin: suggestion.resource, uiOrigin: "alert" })}
                      >
                        {loadingCheckout === suggestion.addonCode ? "Redirigiendo..." : suggestion.addonLabel}
                      </button>
                    ) : null}
                    {mustSuggestUpgrade ? (
                      <button
                        className="button"
                        type="button"
                        disabled={Boolean(loadingAction)}
                        onClick={() => void handlePlanRequest({ request_type: "upgrade", target_plan_key: "growth_fixed", notes: "Solicitud de upgrade desde alerta de capacidad." })}
                      >
                        {loadingAction === "growth_fixed" ? "Enviando..." : "Mejorar plan"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })()
          ))}
          {!operationalAlerts.length ? <p>Sin alertas operativas activas.</p> : null}
        </div>
      </article>

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
