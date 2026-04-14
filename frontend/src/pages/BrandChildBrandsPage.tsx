import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { InternalAlert, Tenant, TenantBranding, TenantCommercialUsage } from "../types/domain";

type HealthState = "estable" | "advertencia" | "critico";

function ratio(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return used / Math.max(limit, 1);
}

function usagePct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min((used / total) * 100, 100));
}

function tokenGaugeColor(usedPct: number): string {
  if (usedPct >= 90) return "#ef4444";
  if (usedPct >= 70) return "#f59e0b";
  return "#22c55e";
}

function resolveHealth(usage: TenantCommercialUsage | null): HealthState {
  if (!usage) return "estable";
  const productRatio = ratio(usage.products_used, usage.products_limit);
  const userRatio = ratio(usage.users_used, usage.users_limit);
  const branchRatio = ratio(usage.branches_used, usage.branches_limit);
  const creditsRemainingPct = usage.ai_tokens_assigned > 0 ? (usage.ai_tokens_remaining / usage.ai_tokens_assigned) * 100 : 100;
  if (Math.max(productRatio, userRatio, branchRatio) >= 1 || creditsRemainingPct <= 10) return "critico";
  if (Math.max(productRatio, userRatio, branchRatio) >= 0.8 || creditsRemainingPct <= 30) return "advertencia";
  return "estable";
}

function healthColor(state: HealthState): string {
  if (state === "critico") return "#ef4444";
  if (state === "advertencia") return "#f59e0b";
  return "#22c55e";
}

function buildAlerts(usage: TenantCommercialUsage | null, alerts: InternalAlert[]): string[] {
  const rows = alerts.slice(0, 3).map((row) => row.title);
  if (!usage) return rows.length ? rows : ["Sin alertas activas"];
  if (usage.products_limit > 0 && usage.products_used >= usage.products_limit) rows.push("Limite de productos alcanzado");
  if (usage.users_limit > 0 && usage.users_used >= usage.users_limit) rows.push("Limite de usuarios alcanzado");
  if (usage.branches_limit > 0 && usage.branches_used >= usage.branches_limit) rows.push("Limite de sucursales alcanzado");
  if (usage.ai_tokens_assigned > 0 && usage.ai_tokens_remaining <= Math.ceil(usage.ai_tokens_assigned * 0.1)) rows.push("Tokens IA en nivel critico");
  return rows.length ? rows.slice(0, 4) : ["Sin alertas activas"];
}

export function BrandChildBrandsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [anchorBrand, setAnchorBrand] = useState<Tenant | null>(null);
  const [brands, setBrands] = useState<Tenant[]>([]);
  const [usageByBrand, setUsageByBrand] = useState<Record<number, TenantCommercialUsage | null>>({});
  const [brandingByBrand, setBrandingByBrand] = useState<Record<number, TenantBranding | null>>({});
  const [alertsByBrand, setAlertsByBrand] = useState<Record<number, InternalAlert[]>>({});
  const [loadingAction, setLoadingAction] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !scopedTenantId) return;
    setError("");
    Promise.all([api.getTenantById(token, scopedTenantId), api.getTenants(token)])
      .then(async ([anchor, allTenants]) => {
        setAnchorBrand(anchor);
        const related = anchor.commercial_client_account_id
          ? allTenants.filter((row) => row.commercial_client_account_id === anchor.commercial_client_account_id)
          : [anchor];
        const hasAnchor = related.some((row) => row.id === anchor.id);
        const scoped = hasAnchor ? related : [anchor, ...related];
        const sorted = scoped.sort((a, b) => {
          if (a.is_parent_brand === b.is_parent_brand) return a.name.localeCompare(b.name, "es-MX");
          return a.is_parent_brand ? -1 : 1;
        });
        setBrands(sorted);

        const details = await Promise.all(
          sorted.map(async (brand) => {
            const [usage, branding, alerts] = await Promise.all([
              api.getTenantCommercialUsage(token, brand.id).catch(() => null),
              api.getTenantBranding(token, brand.id).catch(() => null),
              api.getTenantOperationalAlerts(token, brand.id, "is_read=false").catch(() => []),
            ]);
            return { brandId: brand.id, usage, branding, alerts };
          })
        );

        const usageMap: Record<number, TenantCommercialUsage | null> = {};
        const brandingMap: Record<number, TenantBranding | null> = {};
        const alertMap: Record<number, InternalAlert[]> = {};
        details.forEach((row) => {
          usageMap[row.brandId] = row.usage;
          brandingMap[row.brandId] = row.branding;
          alertMap[row.brandId] = row.alerts;
        });
        setUsageByBrand(usageMap);
        setBrandingByBrand(brandingMap);
        setAlertsByBrand(alertMap);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar marcas hijas.");
      });
  }, [token, scopedTenantId]);

  const rootUsage = useMemo(() => {
    if (!anchorBrand) return null;
    return usageByBrand[anchorBrand.id] ?? null;
  }, [anchorBrand, usageByBrand]);

  const maxBrandsReached = useMemo(() => {
    if (!rootUsage) return false;
    if (rootUsage.brands_limit <= 0) return false;
    return rootUsage.brands_used >= rootUsage.brands_limit;
  }, [rootUsage]);

  const handlePlanRequest = async (requestType: "upgrade" | "addon", addonId?: string) => {
    if (!token || !scopedTenantId) return;
    try {
      setLoadingAction(requestType === "upgrade" ? "upgrade" : addonId ?? "addon");
      setError("");
      setMessage("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: scopedTenantId,
        request_type: requestType,
        addon_id: addonId,
        target_plan_key: requestType === "upgrade" ? "growth_fixed" : undefined,
        notes: requestType === "upgrade"
          ? "Solicitud de mejora de plan desde marcas hijas."
          : `Solicitud de add-on ${addonId} desde marcas hijas.`,
      });
      setMessage("Solicitud registrada. ComerCia revisara la activacion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar la solicitud.");
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
        success_url: `${baseUrl}/admin/brands/children?checkout=success`,
        cancel_url: `${baseUrl}/admin/brands/children?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar la compra.");
    } finally {
      setLoadingCheckout("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Marcas hijas"
        subtitle="Vista operativa local del cliente principal y sus marcas hijas, sin salir al panel global."
      />
      {!scopedTenantId ? <p className="error">Selecciona una marca activa para revisar marcas hijas y consumo.</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <article className="card">
        <h3>Capacidad de marcas por plan</h3>
        <p><strong>Marcas registradas:</strong> {rootUsage?.brands_used ?? 0} / {rootUsage?.brands_limit ?? 0}</p>
        <p><strong>Disponibles:</strong> {Math.max((rootUsage?.brands_limit ?? 0) - (rootUsage?.brands_used ?? 0), 0)}</p>
      </article>

      {maxBrandsReached ? (
        <article className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <h3>Limite de marcas alcanzado</h3>
          <p>
            Tu plan alcanzo el maximo de marcas ({rootUsage?.brands_used ?? 0}/{rootUsage?.brands_limit ?? 0}).
            Puedes mejorar plan o comprar add-on de marca extra.
          </p>
          <div className="row-gap">
            <button className="button" type="button" disabled={Boolean(loadingAction)} onClick={() => void handlePlanRequest("upgrade")}>
              {loadingAction === "upgrade" ? "Enviando..." : "Mejorar plan"}
            </button>
            <button
              className="button button-outline"
              type="button"
              disabled={Boolean(loadingCheckout) || Boolean(loadingAction)}
              onClick={() => void handleAddonCheckout("extra_brand", "capacity_brands")}
            >
              {loadingCheckout === "extra_brand" ? "Redirigiendo..." : "Comprar add-on de marca"}
            </button>
          </div>
        </article>
      ) : null}

      <div className="card-grid">
        {brands.map((brand) => {
          const usage = usageByBrand[brand.id] ?? null;
          const branding = brandingByBrand[brand.id] ?? null;
          const health = resolveHealth(usage);
          const healthText = health === "critico" ? "Critico" : health === "advertencia" ? "Advertencia" : "Estable";
          const alerts = buildAlerts(usage, alertsByBrand[brand.id] ?? []);
          const totalTokens = Number(usage?.ai_tokens_assigned ?? 0);
          const consumedTokens = Number(usage?.ai_tokens_used ?? 0);
          const remainingTokens = Number(usage?.ai_tokens_remaining ?? 0);
          const consumedPct = usagePct(consumedTokens, totalTokens);
          const remainingPct = Math.max(0, 100 - consumedPct);
          return (
            <article key={brand.id} className="card">
              <h3>{brand.name}</h3>
              <p><strong>Estatus:</strong> {brand.is_active ? "Activa" : "Inactiva"}</p>
              <p><strong>Tipo:</strong> {brand.is_parent_brand ? "Marca principal" : "Submarca"}</p>
              <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong>Color base:</strong>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    display: "inline-block",
                    background: branding?.primary_color ?? "#cbd5e1",
                    border: "1px solid #94a3b8",
                  }}
                />
                {branding?.primary_color ?? "Sin definir"}
              </p>
              <p>
                <strong>Estado comercial:</strong>{" "}
                <span style={{ color: healthColor(health) }}>{healthText}</span>
              </p>
              <p><strong>Productos:</strong> {usage?.products_used ?? 0} / {usage?.products_limit ?? 0}</p>
              <p><strong>Usuarios:</strong> {usage?.users_used ?? 0} / {usage?.users_limit ?? 0}</p>
              <p><strong>Sucursales:</strong> {usage?.branches_used ?? 0} / {usage?.branches_limit ?? 0}</p>
              <p><strong>Tokens IA:</strong> {consumedTokens} usados / {remainingTokens} restantes</p>
              <div style={{ height: "12px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden", marginBottom: "6px" }}>
                <div
                  style={{
                    width: `${remainingPct}%`,
                    background: tokenGaugeColor(consumedPct),
                    height: "100%",
                  }}
                />
              </div>
              <p style={{ color: tokenGaugeColor(consumedPct) }}>
                Gasolina IA: {consumedPct.toFixed(1)}% consumido | {remainingPct.toFixed(1)}% disponible
              </p>
              <p><strong>Alertas principales:</strong> {alerts.join(" | ")}</p>
              <div className="row-gap">
                <button className="button button-outline" type="button" onClick={() => navigate(`/admin/branding?brandId=${brand.id}`)}>
                  Revisar ficha de marca
                </button>
                <button
                  className="button button-outline"
                  type="button"
                  disabled={Boolean(loadingCheckout)}
                  onClick={() => void handleAddonCheckout("extra_500_ai_credits", "capacity_ai_credits")}
                >
                  {loadingCheckout === "extra_500_ai_credits" ? "Redirigiendo..." : "Comprar mas tokens IA"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <article className="card">
        <h3>Acciones de crecimiento</h3>
        <div className="row-gap">
          <button className="button" type="button" disabled={Boolean(loadingAction)} onClick={() => void handlePlanRequest("upgrade")}>
            {loadingAction === "upgrade" ? "Enviando..." : "Mejorar plan"}
          </button>
          <button
            className="button button-outline"
            type="button"
            disabled={Boolean(loadingCheckout) || Boolean(loadingAction)}
            onClick={() => void handleAddonCheckout("extra_brand", "capacity_brands")}
          >
            {loadingCheckout === "extra_brand" ? "Redirigiendo..." : "Comprar add-on de marca"}
          </button>
          <button
            className="button button-outline"
            type="button"
            disabled={Boolean(loadingCheckout)}
            onClick={() => void handleAddonCheckout("extra_500_ai_credits", "capacity_ai_credits")}
          >
            {loadingCheckout === "extra_500_ai_credits" ? "Redirigiendo..." : "Comprar mas tokens IA"}
          </button>
        </div>
      </article>
    </section>
  );
}
