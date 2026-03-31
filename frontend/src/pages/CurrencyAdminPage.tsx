import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CurrencySettings, ExchangeRate } from "../types/domain";

export function CurrencyAdminPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [settings, setSettings] = useState<CurrencySettings | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [error, setError] = useState("");
  const [manualRate, setManualRate] = useState({ base_currency: "MXN", target_currency: "USD", rate: "0.058" });

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getCurrencySettings(tenantId), api.getExchangeRates()])
      .then(([settingsData, ratesData]) => {
        setSettings(settingsData);
        setRates(ratesData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar configuracion monetaria"));
  }, [token, tenantId]);

  const applyRegionalPreset = (preset: "espana" | "europa" | "latam" | "brasil") => {
    const next = {
      espana: { base: "EUR", enabled: ["EUR"], localeHint: "es" },
      europa: { base: "EUR", enabled: ["EUR", "USD"], localeHint: "en" },
      latam: { base: "USD", enabled: ["USD", "MXN"], localeHint: "es" },
      brasil: { base: "USD", enabled: ["USD", "BRL"], localeHint: "pt" },
    }[preset];
    setSettings((previous) =>
      previous
        ? {
            ...previous,
            base_currency: next.base,
            enabled_currencies: next.enabled,
            display_mode: "converted_display",
          }
        : previous
    );
  };

  const previewRate = useMemo(
    () =>
      rates.find(
        (r) =>
          r.base_currency === (settings?.base_currency ?? "MXN") &&
          r.target_currency === ((settings?.enabled_currencies ?? ["MXN"])[1] ?? "USD")
      ),
    [rates, settings]
  );

  if (!settings) return <p>{error ? `Error: ${error}` : "Cargando configuracion de moneda..."}</p>;

  const handleSettingsSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setError("");
      const updated = await api.upsertCurrencySettings(token, tenantId, { ...settings });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar");
    }
  };

  const handleManualRate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      await api.createManualExchangeRate(token, {
        base_currency: manualRate.base_currency,
        target_currency: manualRate.target_currency,
        rate: Number(manualRate.rate),
        source_name: "manual_admin"
      });
      setRates(await api.getExchangeRates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar tipo de cambio");
    }
  };

  return (
    <section>
      <PageHeader title="Monedas y Tipo de Cambio" subtitle="Configura moneda base, conversion y modo de checkout por tenant." />
      {error ? <p className="error">{error}</p> : null}
      <form className="detail-form" onSubmit={handleSettingsSubmit}>
        <label>
          Moneda base
          <select
            value={settings.base_currency}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, base_currency: e.target.value } : prev))}
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label>
          Monedas habilitadas (coma separada)
          <input
            value={settings.enabled_currencies.join(",")}
            onChange={(e) =>
              setSettings((prev) =>
                prev
                  ? { ...prev, enabled_currencies: e.target.value.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean) }
                  : prev
              )
            }
          />
        </label>
        <label>
          Modo de visualizacion
          <select
            value={settings.display_mode}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, display_mode: e.target.value } : prev))}
          >
            <option value="base_only">base_only</option>
            <option value="converted_display">converted_display</option>
            <option value="localized_checkout">localized_checkout</option>
          </select>
        </label>
        <label>
          Modo de tipo de cambio
          <select
            value={settings.exchange_mode}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, exchange_mode: e.target.value } : prev))}
          >
            <option value="manual">manual</option>
            <option value="automatic">automatic</option>
          </select>
        </label>
        <label>
          Rounding
          <select
            value={settings.rounding_mode}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, rounding_mode: e.target.value } : prev))}
          >
            <option value="none">none</option>
            <option value=".99">.99</option>
            <option value="whole">whole</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.auto_update_enabled}
            onChange={(e) => setSettings((prev) => (prev ? { ...prev, auto_update_enabled: e.target.checked } : prev))}
          />
          Actualizacion automatica habilitada
        </label>
        <button className="button" type="submit">
          Guardar configuracion de moneda
        </button>
      </form>

      <section className="card">
        <h3>Preconfiguracion regional</h3>
        <div className="row-gap">
          <button className="button button-outline" type="button" onClick={() => applyRegionalPreset("espana")}>Espana (es + EUR)</button>
          <button className="button button-outline" type="button" onClick={() => applyRegionalPreset("europa")}>Europa general (en + EUR)</button>
          <button className="button button-outline" type="button" onClick={() => applyRegionalPreset("latam")}>Latam (es + USD)</button>
          <button className="button button-outline" type="button" onClick={() => applyRegionalPreset("brasil")}>Brasil (pt + USD)</button>
        </div>
        <p className="muted">Estas reglas quedan listas para automatizacion futura por region.</p>
      </section>

      <form className="inline-form" onSubmit={handleManualRate}>
        <select value={manualRate.base_currency} onChange={(e) => setManualRate((p) => ({ ...p, base_currency: e.target.value }))}>
          <option>MXN</option>
          <option>USD</option>
          <option>EUR</option>
        </select>
        <select value={manualRate.target_currency} onChange={(e) => setManualRate((p) => ({ ...p, target_currency: e.target.value }))}>
          <option>USD</option>
          <option>EUR</option>
          <option>MXN</option>
        </select>
        <input value={manualRate.rate} onChange={(e) => setManualRate((p) => ({ ...p, rate: e.target.value }))} />
        <button className="button" type="submit">
          Guardar tipo manual
        </button>
        <button className="button button-outline" type="button" onClick={() => token && api.refreshExchangeRates(token).then(setRates)}>
          Refrescar automatico (fallback local)
        </button>
      </form>

      <section className="card">
        <h3>Vista previa</h3>
        <p>
          100 {settings.base_currency} ={" "}
          {previewRate ? `${(100 * Number(previewRate.rate)).toFixed(2)} ${previewRate.target_currency}` : "sin conversion disponible"}
        </p>
        <p>
          Checkout mode:{" "}
          {settings.display_mode === "localized_checkout"
            ? "Intentara cobrar en moneda local cuando el flujo de pago lo soporte."
            : "Checkout permanece en moneda base y solo muestra conversion."}
        </p>
      </section>
    </section>
  );
}
