import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { BrandAdminSettings, CurrencySettings, ExchangeRate, PlatformSettings } from "../types/domain";

function emptyCurrency(tenantId: number): CurrencySettings {
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
  const { token } = useAuth();
  const { mode, isGlobalAdmin, tenantId } = useAdminContextScope();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [brandAdmin, setBrandAdmin] = useState<BrandAdminSettings | null>(null);
  const [currency, setCurrency] = useState<CurrencySettings | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [manualRate, setManualRate] = useState({ base_currency: "MXN", target_currency: "USD", rate: "0.058" });

  const isGlobalView = mode === "global" && isGlobalAdmin;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      if (isGlobalView) {
        const [platformData, ratesData] = await Promise.all([api.getPlatformSettings(token), api.getExchangeRates()]);
        setPlatform(platformData);
        setRates(ratesData);
        setBrandAdmin(null);
        setCurrency(null);
        return;
      }
      if (!tenantId) {
        setError("No hay marca activa seleccionada para configurar moneda.");
        return;
      }
      const [platformData, brandData, currencyData, ratesData] = await Promise.all([
        api.getPlatformSettings(token).catch(() => null),
        api.getBrandAdminSettings(token, tenantId).catch(() => null),
        api.getCurrencySettings(tenantId).catch(() => emptyCurrency(tenantId)),
        api.getExchangeRates(),
      ]);
      setPlatform(platformData);
      setBrandAdmin(brandData);
      setCurrency(currencyData);
      setRates(ratesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar configuracion de monedas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, isGlobalView, tenantId]);

  const preview = useMemo(() => {
    const base = isGlobalView ? platform?.global_base_currency : currency?.base_currency;
    const enabled = isGlobalView ? platform?.global_enabled_currencies : currency?.enabled_currencies;
    if (!base || !enabled?.length) return null;
    const target = enabled.find((code) => code !== base) ?? base;
    const rate = rates.find((row) => row.base_currency === base && row.target_currency === target);
    return { base, target, rate: rate ? Number(rate.rate) : null };
  }, [isGlobalView, platform, currency, rates]);

  const saveGlobal = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !platform) return;
    try {
      setSaving(true);
      setError("");
      const updated = await api.updatePlatformSettings(token, {
        global_base_currency: platform.global_base_currency,
        global_enabled_currencies: platform.global_enabled_currencies,
        global_exchange_mode: platform.global_exchange_mode,
        global_auto_update_enabled: platform.global_auto_update_enabled,
      });
      setPlatform(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar configuración global.");
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId || !currency || !brandAdmin) return;
    try {
      setSaving(true);
      setError("");
      const inherit = brandAdmin.currency_inherit_global;
      const baseCurrency = inherit ? (platform?.global_base_currency ?? "MXN") : currency.base_currency;
      const visibleCurrencies = inherit ? (platform?.global_enabled_currencies ?? ["MXN", "USD"]) : currency.enabled_currencies;

      const updatedBrand = await api.updateBrandAdminSettings(token, tenantId, {
        currency_inherit_global: inherit,
        currency_base_currency: baseCurrency,
        currency_visible_currencies: visibleCurrencies,
        language_primary: brandAdmin.language_primary,
        language_visible: brandAdmin.language_visible,
        market_profile: brandAdmin.market_profile,
      });
      setBrandAdmin(updatedBrand);

      const updatedCurrency = await api.upsertCurrencySettings(token, tenantId, {
        ...currency,
        base_currency: baseCurrency,
        enabled_currencies: visibleCurrencies,
      });
      setCurrency(updatedCurrency);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar moneda de operación.");
    } finally {
      setSaving(false);
    }
  };

  const saveManualRate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      await api.createManualExchangeRate(token, {
        base_currency: manualRate.base_currency,
        target_currency: manualRate.target_currency,
        rate: Number(manualRate.rate),
        source_name: isGlobalView ? "manual_global_admin" : "manual_brand_admin",
      });
      setRates(await api.getExchangeRates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar tipo de cambio manual.");
    } finally {
      setSaving(false);
    }
  };

  const canEditBrandCurrency = !brandAdmin?.currency_inherit_global;

  return (
    <section>
      <PageHeader
        title={isGlobalView ? "Monedas y tipos de cambio" : "Moneda de operación"}
        subtitle={
          isGlobalView
            ? "Configuración global de monedas disponibles y tipo de cambio para toda la plataforma."
            : "Configuración monetaria de la marca activa, con opción de heredar valores globales."
        }
      />

      {loading ? <p className="muted">Cargando configuración monetaria...</p> : null}
      {error ? (
        <div className="card">
          <p className="error">{error}</p>
          <button className="button button-outline" type="button" onClick={() => void load()}>
            Reintentar conexión
          </button>
        </div>
      ) : null}

      {!loading && isGlobalView && platform ? (
        <form className="detail-form card" onSubmit={saveGlobal}>
          <h3>Configuración global de monedas</h3>
          <label>
            Moneda base global
            <select
              value={platform.global_base_currency}
              onChange={(event) => setPlatform((prev) => (prev ? { ...prev, global_base_currency: event.target.value } : prev))}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label>
            Monedas habilitadas (coma separada)
            <input
              value={platform.global_enabled_currencies.join(",")}
              onChange={(event) =>
                setPlatform((prev) =>
                  prev
                    ? {
                        ...prev,
                        global_enabled_currencies: event.target.value
                          .split(",")
                          .map((item) => item.trim().toUpperCase())
                          .filter(Boolean),
                      }
                    : prev
                )
              }
            />
          </label>
          <label>
            Modo de actualización
            <select
              value={platform.global_exchange_mode}
              onChange={(event) => setPlatform((prev) => (prev ? { ...prev, global_exchange_mode: event.target.value } : prev))}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automático (próximo)</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={platform.global_auto_update_enabled}
              onChange={(event) =>
                setPlatform((prev) => (prev ? { ...prev, global_auto_update_enabled: event.target.checked } : prev))
              }
            />
            Activar actualización automática cuando esté disponible
          </label>
          <button className="button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar configuración global"}
          </button>
        </form>
      ) : null}

      {!loading && !isGlobalView && brandAdmin && currency ? (
        <form className="detail-form card" onSubmit={saveBrand}>
          <h3>Moneda de operación por marca</h3>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={brandAdmin.currency_inherit_global}
              onChange={(event) =>
                setBrandAdmin((prev) => (prev ? { ...prev, currency_inherit_global: event.target.checked } : prev))
              }
            />
            Heredar configuración global de ComerCia
          </label>
          <label>
            Moneda base de la marca
            <select
              value={canEditBrandCurrency ? currency.base_currency : platform?.global_base_currency ?? currency.base_currency}
              disabled={!canEditBrandCurrency}
              onChange={(event) => setCurrency((prev) => (prev ? { ...prev, base_currency: event.target.value } : prev))}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label>
            Monedas visibles en tienda
            <input
              value={(canEditBrandCurrency ? currency.enabled_currencies : platform?.global_enabled_currencies ?? []).join(",")}
              disabled={!canEditBrandCurrency}
              onChange={(event) =>
                setCurrency((prev) =>
                  prev
                    ? {
                        ...prev,
                        enabled_currencies: event.target.value
                          .split(",")
                          .map((item) => item.trim().toUpperCase())
                          .filter(Boolean),
                      }
                    : prev
                )
              }
            />
          </label>
          {!canEditBrandCurrency ? (
            <p className="muted">Esta marca usa monedas globales. Desactiva “Heredar” para personalizar.</p>
          ) : null}
          <button className="button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar moneda de operación"}
          </button>
        </form>
      ) : null}

      {!loading && !isGlobalView && (!brandAdmin || !currency) ? (
        <div className="card">
          <h3>Configuración inicial pendiente</h3>
          <p className="muted">
            Aún no hay configuración de moneda para esta marca. Usa “Reintentar conexión” o guarda una configuración inicial.
          </p>
        </div>
      ) : null}

      <form className="inline-form card" onSubmit={saveManualRate}>
        <h3>Tipo de cambio manual</h3>
        <select value={manualRate.base_currency} onChange={(event) => setManualRate((prev) => ({ ...prev, base_currency: event.target.value }))}>
          <option value="MXN">MXN</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
        <select
          value={manualRate.target_currency}
          onChange={(event) => setManualRate((prev) => ({ ...prev, target_currency: event.target.value }))}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="MXN">MXN</option>
        </select>
        <input value={manualRate.rate} onChange={(event) => setManualRate((prev) => ({ ...prev, rate: event.target.value }))} />
        <button className="button" type="submit" disabled={saving}>
          Guardar tipo manual
        </button>
      </form>

      <section className="card">
        <h3>Resumen de moneda activa</h3>
        {preview ? (
          <>
            <p>
              100 {preview.base} = {preview.rate ? `${(100 * preview.rate).toFixed(2)} ${preview.target}` : `sin tasa disponible a ${preview.target}`}
            </p>
            <p className="muted">
              Tipos disponibles: {rates.length}. Modo actual:{" "}
              {isGlobalView ? platform?.global_exchange_mode ?? "manual" : currency?.exchange_mode ?? "manual"}.
            </p>
          </>
        ) : (
          <p className="muted">Sin datos para vista previa.</p>
        )}
      </section>
    </section>
  );
}
