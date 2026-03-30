import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { StripeConfig } from "../types/domain";

const initialState: StripeConfig = {
  id: 0,
  tenant_id: 0,
  publishable_key: "",
  secret_key: "",
  webhook_secret: "",
  is_reinpia_managed: true,
  stripe_account_id: ""
};

export function StripeSettingsPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [form, setForm] = useState<StripeConfig>({ ...initialState, tenant_id: tenantId });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getStripeConfigByTenant(token, tenantId)
      .then((row) => setForm(row))
      .catch(() => setForm((previous) => ({ ...previous, tenant_id: tenantId })));
  }, [token, tenantId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setError("");
      setSaved(false);
      const savedConfig = await api.upsertStripeConfig(token, {
        tenant_id: tenantId,
        publishable_key: form.publishable_key,
        secret_key: form.secret_key,
        webhook_secret: form.webhook_secret || undefined,
        is_reinpia_managed: form.is_reinpia_managed,
        stripe_account_id: form.stripe_account_id || undefined
      });
      setForm(savedConfig);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar Stripe");
    }
  };

  return (
    <section>
      <PageHeader
        title="Pagos online con Stripe"
        subtitle="Usa Stripe para ecommerce publico, ecommerce distribuidores, suscripciones y checkout online."
      />
      <p className="muted">
        Este modulo no aplica al POS. El POS/WebApp usa Mercado Pago.
      </p>
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p>Configuracion Stripe guardada correctamente.</p> : null}
      <form className="detail-form" onSubmit={handleSubmit}>
        <label>
          Publishable key
          <input
            value={form.publishable_key}
            onChange={(event) => setForm((prev) => ({ ...prev, publishable_key: event.target.value }))}
            placeholder="pk_live_xxx o pk_test_xxx"
          />
        </label>
        <label>
          Secret key
          <input
            value={form.secret_key}
            onChange={(event) => setForm((prev) => ({ ...prev, secret_key: event.target.value }))}
            placeholder="sk_live_xxx o sk_test_xxx"
          />
        </label>
        <label>
          Webhook secret
          <input
            value={form.webhook_secret ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, webhook_secret: event.target.value }))}
            placeholder="whsec_xxx"
          />
        </label>
        <label>
          Stripe account id (Connect)
          <input
            value={form.stripe_account_id ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, stripe_account_id: event.target.value }))}
            placeholder="acct_xxx"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_reinpia_managed}
            onChange={(event) => setForm((prev) => ({ ...prev, is_reinpia_managed: event.target.checked }))}
          />
          Gestionado por REINPIA
        </label>
        <button className="button" type="submit">Guardar Stripe</button>
      </form>
    </section>
  );
}
