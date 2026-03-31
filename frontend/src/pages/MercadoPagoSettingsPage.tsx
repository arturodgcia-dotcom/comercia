import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { MercadoPagoSettings } from "../types/domain";

const initialSettings: MercadoPagoSettings = {
  id: 0,
  tenant_id: 0,
  mercadopago_enabled: false,
  mercadopago_public_key: "",
  mercadopago_access_token: "",
  mercadopago_qr_enabled: true,
  mercadopago_payment_link_enabled: true,
  mercadopago_point_enabled: false,
  mercadopago_active_for_pos_only: true,
  created_at: "",
  updated_at: ""
};

export function MercadoPagoSettingsPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [settings, setSettings] = useState<MercadoPagoSettings>({ ...initialSettings, tenant_id: tenantId });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getMercadoPagoSettings(token, tenantId)
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar Mercado Pago"));
  }, [token, tenantId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setError("");
      setSaved(false);
      const row = await api.upsertMercadoPagoSettings(token, tenantId, {
        mercadopago_enabled: settings.mercadopago_enabled,
        mercadopago_public_key: settings.mercadopago_public_key || undefined,
        mercadopago_access_token: settings.mercadopago_access_token || undefined,
        mercadopago_qr_enabled: settings.mercadopago_qr_enabled,
        mercadopago_payment_link_enabled: settings.mercadopago_payment_link_enabled,
        mercadopago_point_enabled: settings.mercadopago_point_enabled,
        mercadopago_active_for_pos_only: settings.mercadopago_active_for_pos_only
      });
      setSettings(row);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar Mercado Pago");
    }
  };

  return (
    <section>
      <PageHeader
        title="Pagos POS/WebApp con Mercado Pago"
        subtitle="Links de pago y QR para punto de venta, con preparacion para Point."
      />
      <ModuleOnboardingCard
        moduleKey="payments_mercadopago"
        title="Pagos POS con Mercado Pago"
        whatItDoes="Configura cobro por link y QR para ventas en punto de venta."
        whyItMatters="Permite cobrar digitalmente en operacion presencial sin depender de Stripe."
        whatToCapture={["Public key", "Access token", "Modo QR/link", "Uso exclusivo POS"]}
        impact="Mejora velocidad de cobro y control de transacciones en caja."
      />
      <p className="muted">
        Este modulo aplica al POS/WebApp. El ecommerce online sigue usando Stripe.
      </p>
      {error ? <p className="error">{error}</p> : null}
      {saved ? <p>Configuracion Mercado Pago guardada correctamente.</p> : null}
      <form className="detail-form" onSubmit={handleSubmit}>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.mercadopago_enabled}
            onChange={(event) => setSettings((prev) => ({ ...prev, mercadopago_enabled: event.target.checked }))}
          />
          Habilitar Mercado Pago
        </label>
        <label>
          Public key
          <input
            value={settings.mercadopago_public_key ?? ""}
            onChange={(event) => setSettings((prev) => ({ ...prev, mercadopago_public_key: event.target.value }))}
            placeholder="APP_USR_xxx"
          />
        </label>
        <label>
          Access token
          <input
            value={settings.mercadopago_access_token ?? ""}
            onChange={(event) => setSettings((prev) => ({ ...prev, mercadopago_access_token: event.target.value }))}
            placeholder="TEST-xxx o APP_USR-xxx"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.mercadopago_payment_link_enabled}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, mercadopago_payment_link_enabled: event.target.checked }))
            }
          />
          Habilitar link de pago
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.mercadopago_qr_enabled}
            onChange={(event) => setSettings((prev) => ({ ...prev, mercadopago_qr_enabled: event.target.checked }))}
          />
          Habilitar cobro por QR
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.mercadopago_point_enabled}
            onChange={(event) => setSettings((prev) => ({ ...prev, mercadopago_point_enabled: event.target.checked }))}
          />
          Preparar Point (placeholder)
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.mercadopago_active_for_pos_only}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, mercadopago_active_for_pos_only: event.target.checked }))
            }
          />
          Activo solo para POS/WebApp
        </label>
        <button className="button" type="submit">Guardar Mercado Pago</button>
      </form>
    </section>
  );
}
