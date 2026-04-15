import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { CommercialAddon, TenantCommercialUsage } from "../types/domain";

type AddonCatalogItem = {
  code: string;
  label: string;
  benefit: string;
};

const REQUIRED_ADDONS: AddonCatalogItem[] = [
  { code: "extra_user", label: "Usuario extra", benefit: "Incrementa capacidad de usuarios activos en tu marca." },
  { code: "extra_ai_agent", label: "Agente IA extra", benefit: "Habilita un agente IA adicional para atención operativa." },
  { code: "extra_brand", label: "Marca extra", benefit: "Permite registrar una marca/submarca adicional." },
  { code: "extra_100_products", label: "100 productos extra", benefit: "Amplía tu capacidad de catálogo de productos." },
  { code: "extra_branch", label: "Sucursal extra", benefit: "Agrega capacidad para una sucursal adicional." },
  { code: "extra_500_ai_credits", label: "500 créditos IA extra", benefit: "Recarga tokens IA para evitar interrupciones." },
  { code: "premium_support", label: "Soporte premium", benefit: "Prioridad de atención y escalamiento operativo." },
];

function ratio(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return used / Math.max(limit, 1);
}

export function BrandCapacityExpansionPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [usage, setUsage] = useState<TenantCommercialUsage | null>(null);
  const [addons, setAddons] = useState<CommercialAddon[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !scopedTenantId) return;
    Promise.all([
      api.getTenantCommercialUsage(token, scopedTenantId).catch(() => null),
      api.getCommercialPlanCatalog(token).catch(() => null),
    ])
      .then(([usageData, catalog]) => {
        setUsage(usageData);
        setAddons(catalog?.addons ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar catálogo de expansión."));
  }, [scopedTenantId, token]);

  const resourceWarnings = useMemo(() => {
    if (!usage) return [];
    const rows = [
      { label: "Marcas", used: usage.brands_used, limit: usage.brands_limit, addon: "extra_brand" },
      { label: "Usuarios", used: usage.users_used, limit: usage.users_limit, addon: "extra_user" },
      { label: "Agentes IA", used: usage.ai_agents_used, limit: usage.ai_agents_limit, addon: "extra_ai_agent" },
      { label: "Productos", used: usage.products_used, limit: usage.products_limit, addon: "extra_100_products" },
      { label: "Sucursales", used: usage.branches_used, limit: usage.branches_limit, addon: "extra_branch" },
      { label: "Créditos IA", used: usage.ai_tokens_used, limit: usage.ai_tokens_assigned, addon: "extra_500_ai_credits" },
    ];
    return rows.filter((row) => ratio(row.used, row.limit) >= 0.8);
  }, [usage]);

  const mergedAddons = useMemo(() => (
    REQUIRED_ADDONS.map((base) => {
      const match = addons.find((row) => row.code === base.code || row.id === base.code);
      return {
        ...base,
        data: match ?? null,
      };
    })
  ), [addons]);

  const handleCheckout = async (addonCode: string) => {
    if (!token || !scopedTenantId) return;
    try {
      setLoadingCheckout(addonCode);
      setError("");
      const baseUrl = window.location.origin;
      const response = await api.createCommercialPlanCheckoutSession(token, {
        tenant_id: scopedTenantId,
        item_code: addonCode,
        add_on_code: addonCode,
        resource_origin: addonCode,
        ui_origin: "dashboard_brand",
        success_url: `${baseUrl}/admin/capacity-expand?checkout=success`,
        cancel_url: `${baseUrl}/admin/capacity-expand?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar checkout.");
    } finally {
      setLoadingCheckout("");
    }
  };

  const handleUpgrade = async () => {
    if (!token || !scopedTenantId) return;
    try {
      setLoadingAction(true);
      setError("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: scopedTenantId,
        request_type: "upgrade",
        target_plan_key: "growth_fixed",
        notes: "Solicitud de mejora de plan desde Expandir capacidad.",
      });
      setMessage("Solicitud de mejora de plan registrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible solicitar upgrade.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Expandir capacidad"
        subtitle="Catálogo de expansión con add-ons comprables, recursos en riesgo y recomendaciones."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {!scopedTenantId ? <p className="error">Selecciona una marca activa para gestionar expansión.</p> : null}

      <article className="card">
        <h3>Recursos por agotarse</h3>
        <p>
          {resourceWarnings.length
            ? resourceWarnings.map((row) => `${row.label} (${row.used}/${row.limit})`).join(" | ")
            : "Sin recursos en zona de riesgo."}
        </p>
        <div className="row-gap">
          <button className="button" type="button" onClick={handleUpgrade} disabled={loadingAction}>
            {loadingAction ? "Enviando..." : "Mejorar plan"}
          </button>
        </div>
      </article>

      <article className="card">
        <h3>Catálogo de add-ons</h3>
        <div className="card-grid">
          {mergedAddons.map((addon) => (
            <article key={addon.code} className="card">
              <h4>{addon.label}</h4>
              <p>{addon.benefit}</p>
              <p><strong>Precio final:</strong> {addon.data ? `$${Number(addon.data.total_price_mxn || addon.data.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN` : "No disponible"}</p>
              <button
                className="button button-outline"
                type="button"
                disabled={!addon.data || Boolean(loadingCheckout)}
                onClick={() => void handleCheckout(addon.code)}
              >
                {loadingCheckout === addon.code ? "Redirigiendo..." : "Comprar add-on"}
              </button>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
