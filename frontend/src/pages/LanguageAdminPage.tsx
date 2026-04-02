import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { BrandAdminSettings, PlatformSettings } from "../types/domain";

export function LanguageAdminPage() {
  const { token } = useAuth();
  const { mode, isGlobalAdmin, tenantId } = useAdminContextScope();
  const isGlobalView = mode === "global" && isGlobalAdmin;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState<PlatformSettings | null>(null);
  const [brandAdmin, setBrandAdmin] = useState<BrandAdminSettings | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const platformData = await api.getPlatformSettings(token);
      setPlatform(platformData);
      if (!isGlobalView && tenantId) {
        const brandData = await api.getBrandAdminSettings(token, tenantId);
        setBrandAdmin(brandData);
      } else {
        setBrandAdmin(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar configuración de idioma.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, isGlobalView, tenantId]);

  const saveGlobal = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !platform) return;
    try {
      setSaving(true);
      setError("");
      const updated = await api.updatePlatformSettings(token, {
        platform_default_language: platform.platform_default_language,
        platform_enabled_languages: platform.platform_enabled_languages,
      });
      setPlatform(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar idiomas de plataforma.");
    } finally {
      setSaving(false);
    }
  };

  const saveBrand = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId || !brandAdmin) return;
    try {
      setSaving(true);
      setError("");
      const updated = await api.updateBrandAdminSettings(token, tenantId, {
        currency_inherit_global: brandAdmin.currency_inherit_global,
        currency_base_currency: brandAdmin.currency_base_currency,
        currency_visible_currencies: brandAdmin.currency_visible_currencies,
        language_primary: brandAdmin.language_primary,
        language_visible: brandAdmin.language_visible,
        market_profile: brandAdmin.market_profile,
      });
      setBrandAdmin(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar idioma de tienda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title={isGlobalView ? "Idiomas de plataforma" : "Idioma de tienda"}
        subtitle={
          isGlobalView
            ? "Define idiomas habilitados y el idioma por defecto del panel de administración."
            : "Configura idioma principal y visibilidad por mercado para la tienda de la marca activa."
        }
      />

      {loading ? <p className="muted">Cargando configuración de idioma...</p> : null}
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
          <h3>Configuración global de idioma</h3>
          <label>
            Idioma por defecto del panel
            <select
              value={platform.platform_default_language}
              onChange={(event) => setPlatform((prev) => (prev ? { ...prev, platform_default_language: event.target.value } : prev))}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </label>
          <label>
            Idiomas habilitados (coma separada)
            <input
              value={platform.platform_enabled_languages.join(",")}
              onChange={(event) =>
                setPlatform((prev) =>
                  prev
                    ? {
                        ...prev,
                        platform_enabled_languages: event.target.value
                          .split(",")
                          .map((item) => item.trim().toLowerCase())
                          .filter(Boolean),
                      }
                    : prev
                )
              }
            />
          </label>
          <p className="muted">
            Esta configuración aplica al panel global y sirve como base para idiomas por marca.
          </p>
          <button className="button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar idiomas de plataforma"}
          </button>
        </form>
      ) : null}

      {!loading && !isGlobalView && brandAdmin ? (
        <form className="detail-form card" onSubmit={saveBrand}>
          <h3>Idioma de tienda por marca</h3>
          <label>
            Idioma principal de la tienda
            <select
              value={brandAdmin.language_primary}
              onChange={(event) => setBrandAdmin((prev) => (prev ? { ...prev, language_primary: event.target.value } : prev))}
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </label>
          <label>
            Idiomas visibles al cliente (coma separada)
            <input
              value={brandAdmin.language_visible.join(",")}
              onChange={(event) =>
                setBrandAdmin((prev) =>
                  prev
                    ? {
                        ...prev,
                        language_visible: event.target.value
                          .split(",")
                          .map((item) => item.trim().toLowerCase())
                          .filter(Boolean),
                      }
                    : prev
                )
              }
            />
          </label>
          <label>
            Perfil regional
            <select
              value={brandAdmin.market_profile}
              onChange={(event) => setBrandAdmin((prev) => (prev ? { ...prev, market_profile: event.target.value } : prev))}
            >
              <option value="latam_es_usd">Español + dólares (LATAM)</option>
              <option value="es_eur">Español + euros (España)</option>
              <option value="en_eur_usd">Inglés + euros/dólares</option>
              <option value="pt_usd_future">Portugués + dólares (futuro)</option>
            </select>
          </label>
          <p className="muted">
            Esta base deja preparada la tienda para escenarios internacionales sin mezclar contexto global con marca.
          </p>
          <button className="button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar idioma de tienda"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
