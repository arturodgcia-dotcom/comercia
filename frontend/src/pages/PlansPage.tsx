import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { CommercialAddon, CommercialPlan, Tenant, TenantCommercialStatus, TenantCommercialUsage } from "../types/domain";

function safePct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min((used / total) * 100, 100));
}

function gaugeColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#f59e0b";
  return "#22c55e";
}

function resolveTierRank(plan: CommercialPlan): number {
  const tier = String(plan.tier || "").toLowerCase();
  if (tier.includes("premium")) return 3;
  if (tier.includes("growth")) return 2;
  return 1;
}

export function PlansPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [status, setStatus] = useState<TenantCommercialStatus | null>(null);
  const [usage, setUsage] = useState<TenantCommercialUsage | null>(null);
  const [plansCatalog, setPlansCatalog] = useState<CommercialPlan[]>([]);
  const [addonsCatalog, setAddonsCatalog] = useState<CommercialAddon[]>([]);
  const [relatedBrands, setRelatedBrands] = useState<Tenant[]>([]);
  const [loadingAction, setLoadingAction] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !scopedTenantId) return;
    setError("");
    Promise.all([
      api.getTenantCommercialStatus(token, scopedTenantId).catch(() => null),
      api.getTenantCommercialUsage(token, scopedTenantId).catch(() => null),
      api.getCommercialPlanCatalog(token).catch(() => null),
      api.getTenantById(token, scopedTenantId).catch(() => null),
      api.getTenants(token).catch(() => []),
    ])
      .then(([statusData, usageData, catalogData, anchor, allTenants]) => {
        setStatus(statusData);
        setUsage(usageData);
        setPlansCatalog(catalogData?.plans ?? []);
        setAddonsCatalog(catalogData?.addons ?? []);
        if (!anchor) {
          setRelatedBrands([]);
          return;
        }
        const related = anchor.commercial_client_account_id
          ? allTenants.filter((row) => row.commercial_client_account_id === anchor.commercial_client_account_id)
          : [anchor];
        const hasAnchor = related.some((row) => row.id === anchor.id);
        const scoped = hasAnchor ? related : [anchor, ...related];
        const sorted = scoped.sort((a, b) => {
          if (a.is_parent_brand === b.is_parent_brand) return a.name.localeCompare(b.name, "es-MX");
          return a.is_parent_brand ? -1 : 1;
        });
        setRelatedBrands(sorted);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar el módulo de planes."));
  }, [scopedTenantId, token]);

  const activePlan = useMemo(
    () => plansCatalog.find((plan) => plan.id === status?.commercial_plan_key || plan.code === status?.commercial_plan_key) ?? null,
    [plansCatalog, status?.commercial_plan_key]
  );

  const upgradeCandidates = useMemo(() => {
    if (!activePlan) return [];
    return plansCatalog
      .filter((plan) => {
        if (plan.id === activePlan.id) return false;
        if (plan.billing_model !== activePlan.billing_model) return false;
        return resolveTierRank(plan) > resolveTierRank(activePlan);
      })
      .sort((a, b) => resolveTierRank(a) - resolveTierRank(b));
  }, [activePlan, plansCatalog]);

  const tokensTotal = Number(usage?.ai_tokens_assigned ?? 0);
  const tokensUsed = Number(usage?.ai_tokens_used ?? 0);
  const tokensRemaining = Number(usage?.ai_tokens_remaining ?? 0);
  const tokensUsedPct = safePct(tokensUsed, tokensTotal);
  const tokensRemainingPct = Math.max(0, 100 - tokensUsedPct);

  const handleUpgrade = async (targetPlanKey?: string) => {
    if (!token || !scopedTenantId || !targetPlanKey) return;
    try {
      setLoadingAction(targetPlanKey);
      setError("");
      setMessage("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: scopedTenantId,
        request_type: "upgrade",
        target_plan_key: targetPlanKey,
        notes: `Solicitud de mejora de plan desde módulo Planes (${targetPlanKey}).`,
      });
      setMessage("Solicitud de mejora registrada. El equipo comercial la revisará.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible solicitar mejora de plan.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleAddonCheckout = async (itemCode: string, resourceOrigin: string) => {
    if (!token || !scopedTenantId) return;
    try {
      setLoadingCheckout(itemCode);
      setError("");
      const baseUrl = window.location.origin;
      const response = await api.createCommercialPlanCheckoutSession(token, {
        tenant_id: scopedTenantId,
        item_code: itemCode,
        add_on_code: itemCode,
        resource_origin: resourceOrigin,
        ui_origin: "dashboard_brand",
        success_url: `${baseUrl}/plans?checkout=success`,
        cancel_url: `${baseUrl}/plans?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar la compra del add-on.");
    } finally {
      setLoadingCheckout("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Plan activo y soporte"
        subtitle="Tu paquete actual, consumo por capacidad y acciones de crecimiento sin salir del panel de marca."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {!scopedTenantId ? <p className="error">Selecciona una marca activa para ver su plan y consumo.</p> : null}

      <article className="card">
        <h3>Paquete contratado</h3>
        <p><strong>Plan:</strong> {activePlan?.display_name || status?.plan_display_name || status?.commercial_plan_key || "Sin plan asignado"}</p>
        <p><strong>Estado:</strong> {status?.commercial_plan_status || "not_purchased"}</p>
        <p><strong>Modelo:</strong> {status?.billing_model === "commission_based" ? "Comisión por venta" : "Cuota fija"}</p>
        <p><strong>Soporte incluido:</strong> {status?.support || activePlan?.support || "Soporte base"}</p>
      </article>

      <div className="card-grid">
        <article className="card">
          <h3>Marcas registradas según plan</h3>
          <p>
            <strong>Cupo de marcas:</strong> {usage?.brands_used ?? 0} / {usage?.brands_limit ?? 0}
          </p>
          <p>
            <strong>Disponibles:</strong> {Math.max((usage?.brands_limit ?? 0) - (usage?.brands_used ?? 0), 0)}
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Tipo</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {relatedBrands.map((brand) => (
                  <tr key={brand.id}>
                    <td>{brand.name}</td>
                    <td>{brand.is_parent_brand ? "Principal" : "Submarca"}</td>
                    <td>{brand.is_active ? "Activa" : "Inactiva"}</td>
                  </tr>
                ))}
                {!relatedBrands.length ? (
                  <tr>
                    <td colSpan={3}>No hay marcas relacionadas para esta cuenta.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h3>Tokens IA mensuales</h3>
          <p><strong>Total asignado:</strong> {tokensTotal}</p>
          <p><strong>Consumidos:</strong> {tokensUsed}</p>
          <p><strong>Disponibles:</strong> {tokensRemaining}</p>
          <div style={{ height: "14px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden", marginBottom: "8px" }}>
            <div
              style={{
                width: `${tokensRemainingPct}%`,
                background: gaugeColor(tokensUsedPct),
                height: "100%",
                transition: "width 250ms ease",
              }}
            />
          </div>
          <p style={{ color: gaugeColor(tokensUsedPct) }}>
            Indicador tipo gasolina: {tokensUsedPct.toFixed(1)}% consumido | {tokensRemainingPct.toFixed(1)}% disponible
          </p>
          <button
            className="button button-outline"
            type="button"
            disabled={Boolean(loadingCheckout)}
            onClick={() => void handleAddonCheckout("extra_500_ai_credits", "capacity_ai_credits")}
          >
            {loadingCheckout === "extra_500_ai_credits" ? "Redirigiendo..." : "Comprar más tokens IA"}
          </button>
        </article>
      </div>

      <article className="card">
        <h3>Escalar plan o adquirir add-ons</h3>
        <div className="card-grid">
          <article className="card">
            <h4>Escalar plan</h4>
            {upgradeCandidates.length ? (
              upgradeCandidates.map((plan) => (
                <div key={plan.id} className="row-gap" style={{ marginBottom: "10px" }}>
                  <p><strong>{plan.display_name || plan.name}</strong></p>
                  <p>${Number(plan.total_price_mxn || 0).toLocaleString("es-MX")} MXN</p>
                  <button
                    className="button"
                    type="button"
                    disabled={Boolean(loadingAction)}
                    onClick={() => void handleUpgrade(plan.id || plan.code)}
                  >
                    {loadingAction === (plan.id || plan.code) ? "Enviando..." : "Solicitar upgrade"}
                  </button>
                </div>
              ))
            ) : (
              <p>No hay un plan superior disponible en el mismo modelo comercial.</p>
            )}
          </article>

          <article className="card">
            <h4>Add-ons disponibles</h4>
            {addonsCatalog.length ? (
              addonsCatalog.map((addon) => (
                <div key={addon.id} className="row-gap" style={{ marginBottom: "10px" }}>
                  <p><strong>{addon.display_name || addon.name}</strong></p>
                  <p>${Number(addon.total_price_mxn || addon.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN</p>
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={Boolean(loadingCheckout)}
                    onClick={() => void handleAddonCheckout(addon.code, addon.code)}
                  >
                    {loadingCheckout === addon.code ? "Redirigiendo..." : "Comprar add-on"}
                  </button>
                </div>
              ))
            ) : (
              <p>No hay add-ons disponibles por el momento.</p>
            )}
          </article>
        </div>
      </article>
    </section>
  );
}
