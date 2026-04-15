import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CommercialAddon, CommercialPlan } from "../types/domain";

export function BrandCapacityExpansionPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? null;
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [addons, setAddons] = useState<CommercialAddon[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingRequest, setLoadingRequest] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getCommercialPlanCatalog(token)
      .then((catalog) => {
        setPlans(catalog.plans ?? []);
        setAddons(catalog.addons ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar catálogo comercial."));
  }, [token]);

  const buyAddon = async (addonCode: string) => {
    if (!token) return;
    try {
      setLoadingCheckout(addonCode);
      setError("");
      const baseUrl = window.location.origin;
      const response = await api.createCommercialPlanCheckoutSession(token, {
        tenant_id: tenantId ?? undefined,
        item_code: addonCode,
        add_on_code: addonCode,
        resource_origin: addonCode,
        ui_origin: "dashboard_brand",
        success_url: `${baseUrl}/admin/capacity-expand?checkout=success`,
        cancel_url: `${baseUrl}/admin/capacity-expand?checkout=cancel`,
      });
      window.location.assign(response.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar checkout del add-on.");
    } finally {
      setLoadingCheckout("");
    }
  };

  const requestUpgrade = async (planKey: string) => {
    if (!token || !tenantId) return;
    try {
      setLoadingRequest(planKey);
      setError("");
      setMessage("");
      await api.createCommercialPlanRequest(token, {
        tenant_id: tenantId,
        request_type: "upgrade",
        target_plan_key: planKey,
        notes: `Solicitud de mejora al plan ${planKey} desde expansión de capacidad.`,
      });
      setMessage("Solicitud de upgrade registrada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar upgrade.");
    } finally {
      setLoadingRequest("");
    }
  };

  return (
    <section>
      <PageHeader
        title="Expandir capacidad y add-ons"
        subtitle="Compra de add-ons y solicitudes de mejora de plan sin duplicar métricas del dashboard."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <article className="card">
        <h3>Add-ons disponibles</h3>
        <div className="card-grid">
          {addons.map((addon) => (
            <article key={addon.id} className="card">
              <p><strong>{addon.display_name || addon.name}</strong></p>
              <p>${Number(addon.total_price_mxn || addon.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN</p>
              <button
                className="button"
                type="button"
                disabled={Boolean(loadingCheckout)}
                onClick={() => void buyAddon(addon.code)}
              >
                {loadingCheckout === addon.code ? "Redirigiendo..." : "Comprar add-on"}
              </button>
            </article>
          ))}
          {!addons.length ? <p>No hay add-ons disponibles en este momento.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Mejorar plan</h3>
        <div className="card-grid">
          {plans.map((plan) => (
            <article key={plan.id} className="card">
              <p><strong>{plan.display_name || plan.name}</strong></p>
              <p>${Number(plan.total_price_mxn || plan.price_with_tax_mxn || 0).toLocaleString("es-MX")} MXN</p>
              <button
                className="button button-outline"
                type="button"
                disabled={Boolean(loadingRequest)}
                onClick={() => void requestUpgrade(plan.code)}
              >
                {loadingRequest === plan.code ? "Enviando..." : "Solicitar upgrade"}
              </button>
            </article>
          ))}
          {!plans.length ? <p>No hay planes disponibles en este momento.</p> : null}
        </div>
      </article>

      <article className="card">
        <div className="row-gap">
          <Link className="button" to="/">
            Volver a Resumen de marca
          </Link>
          <Link className="button button-outline" to="/plans">
            Ver plan y límites
          </Link>
        </div>
      </article>
    </section>
  );
}
