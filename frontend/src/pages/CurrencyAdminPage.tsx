import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CurrencySettings, ExchangeRate } from "../types/domain";

function buildEmptySettings(tenantId: number): CurrencySettings {
  return {
    id: 0,
    tenant_id: tenantId,
    base_currency: "MXN",
    enabled_currencies: ["MXN", "USD"],
    display_mode: "base_only",
    exchange_mode: "manual",
    auto_update_enabled: false,
    rounding_mode: "none",
  };
}

export function CurrencyAdminPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [settings, setSettings] = useState<CurrencySettings>(buildEmptySettings(tenantId));
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingFallbackState, setUsingFallbackState] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [manualRate, setManualRate] = useState({ base_currency: "MXN", target_currency: "USD", rate: "0.058" });

  const loadCurrencyState = async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsData, ratesData] = await Promise.all([api.getCurrencySettings(tenantId), api.getExchangeRates()]);
      setSettings(settingsData);
      setRates(ratesData);
      setUsingFallbackState(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar configuracion monetaria.");
      setSettings(buildEmptySettings(tenantId));
      setRates([]);
      setUsingFallbackState(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadCurrencyState();
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
        : buildEmptySettings(tenantId)
    );
  };

  const previewRate = useMemo(
    () =>
      rates.find(
        (r) =>
          r.base_currency === (settings.base_currency ?? "MXN") &&
          r.target_currency === ((settings.enabled_currencies ?? ["MXN"])[1] ?? "USD")
      ),
    [rates, settings]
  );

  const handleSettingsSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Tu sesion expiro. Inicia sesion nuevamente para guardar cambios.");
      return;
    }
    try {
      setSavingSettings(true);
      setError("");
      const updated = await api.upsertCurrencySettings(token, tenantId, { ...settings });
      setSettings(updated);
      setUsingFallbackState(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleManualRate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Tu sesion expiro. Inicia sesion nuevamente para guardar tipos de cambio.");
      return;
    }
    try {
      setSavingRate(true);
      setError("");
      await api.createManualExchangeRate(token, {
        base_currency: manualRate.base_currency,
        target_currency: manualRate.target_currency,
        rate: Number(manualRate.rate),
        source_name: "manual_admin"
      });
      setRates(await api.getExchangeRates());
      setUsingFallbackState(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar tipo de cambio");
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <section>
      <PageHeader title="Monedas y Tipo de Cambio" subtitle="Configura moneda base, conversion y modo de checkout por tenant." />
      <ModuleOnboardingCard
        moduleKey="currency"
        title="Monedas"
        whatItDoes="Configura moneda base, monedas visibles y tipo de cambio manual o automatico."
        whyItMatters="Permite vender en distintos mercados sin perder control financiero."
        whatToCapture={["Moneda base", "Monedas habilitadas", "Modo de conversion", "Tasa manual cuando aplique"]}
        impact="Mejora claridad de precios para cliente y consistencia en reportes."
      />
      {loading ? <p className="muted">Cargando configuracion monetaria...</p> : null}
      {error ? (
        <section className="card">
          <p className="error">{error}</p>
          <p className="muted">
            Puedes revisar la configuracion base y volver a intentar la conexion cuando el backend este disponible.
          </p>
          <button className="button button-outline" type="button" onClick={() => void loadCurrencyState()}>
            Reintentar conexion
          </button>
        </section>
      ) : null}
      {usingFallbackState ? (
        <section className="card">
          <h3>Estado inicial de moneda</h3>
          <p className="muted">
            No se pudieron cargar datos del backend. Se muestra una configuracion inicial editable para que no se quede la pantalla en blanco.
          </p>
        </section>
      ) : null}
      <form className="detail-form" onSubmit={handleSettingsSubmit}>
        <label>
          Moneda base
          <select
            value={settings.base_currency}
            onChange={(e) => setSettings((prev) => ({ ...prev, base_currency: e.target.value }))}
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
                ({
                  ...prev,
                  enabled_currencies: e.target.value.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean)
                })
              )
            }
          />
        </label>
        <label>
          Modo de visualizacion
          <select
            value={settings.display_mode}
            onChange={(e) => setSettings((prev) => ({ ...prev, display_mode: e.target.value }))}
          >
            <option value="base_only">Solo moneda base</option>
            <option value="converted_display">Mostrar conversion</option>
            <option value="localized_checkout">Checkout localizado</option>
          </select>
        </label>
        <label>
          Modo de tipo de cambio
          <select
            value={settings.exchange_mode}
            onChange={(e) => setSettings((prev) => ({ ...prev, exchange_mode: e.target.value }))}
          >
            <option value="manual">Manual</option>
            <option value="automatic">Automatico</option>
          </select>
        </label>
        <label>
          Rounding
          <select
            value={settings.rounding_mode}
            onChange={(e) => setSettings((prev) => ({ ...prev, rounding_mode: e.target.value }))}
          >
            <option value="none">Sin redondeo</option>
            <option value=".99">.99</option>
            <option value="whole">Entero</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.auto_update_enabled}
            onChange={(e) => setSettings((prev) => ({ ...prev, auto_update_enabled: e.target.checked }))}
          />
          Actualizacion automatica habilitada
        </label>
        <button className="button" type="submit" disabled={savingSettings}>
          {savingSettings ? "Guardando..." : "Guardar configuracion de moneda"}
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
        <button className="button" type="submit" disabled={savingRate}>
          {savingRate ? "Guardando..." : "Guardar tipo manual"}
        </button>
        <button
          className="button button-outline"
          type="button"
          onClick={async () => {
            if (!token) {
              setError("Tu sesion expiro. Inicia sesion nuevamente para refrescar tipos.");
              return;
            }
            try {
              setError("");
              setRates(await api.refreshExchangeRates(token));
              setUsingFallbackState(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "No fue posible refrescar tipos de cambio.");
            }
          }}
        >
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
          Modo checkout:{" "}
          {settings.display_mode === "localized_checkout"
            ? "Intentara cobrar en moneda local cuando el flujo de pago lo soporte."
            : "Checkout permanece en moneda base y solo muestra conversion."}
        </p>
        {!rates.length ? <p className="muted">Aun no hay tipos de cambio cargados para esta marca.</p> : null}
      </section>
    </section>
  );
}
