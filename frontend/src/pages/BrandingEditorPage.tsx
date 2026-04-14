import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { Tenant, TenantBranding, TenantCommercialUsage } from "../types/domain";

const emptyBranding: Partial<TenantBranding> = {
  primary_color: "#0447A6",
  secondary_color: "#DCE8FB",
};

function ratio(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return used / Math.max(limit, 1);
}

function healthLabel(usage: TenantCommercialUsage | null): string {
  if (!usage) return "Estable";
  const maxRatio = Math.max(
    ratio(usage.products_used, usage.products_limit),
    ratio(usage.users_used, usage.users_limit),
    ratio(usage.branches_used, usage.branches_limit)
  );
  const creditsRemainingPct = usage.ai_tokens_assigned > 0 ? (usage.ai_tokens_remaining / usage.ai_tokens_assigned) * 100 : 100;
  if (maxRatio >= 1 || creditsRemainingPct <= 10) return "Crítico";
  if (maxRatio >= 0.8 || creditsRemainingPct <= 30) return "Advertencia";
  return "Estable";
}

export function BrandingEditorPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Tenant[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [branding, setBranding] = useState<Partial<TenantBranding>>(emptyBranding);
  const [usage, setUsage] = useState<TenantCommercialUsage | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !scopedTenantId) return;
    setError("");
    Promise.all([api.getTenantById(token, scopedTenantId), api.getTenants(token)])
      .then(([anchor, allTenants]) => {
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

        const queryBrandId = Number(searchParams.get("brandId") ?? "");
        const validQueryBrand = Number.isFinite(queryBrandId) && sorted.some((row) => row.id === queryBrandId) ? queryBrandId : null;
        setSelectedBrandId(validQueryBrand ?? sorted[0]?.id ?? anchor.id);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No fue posible cargar marcas de la cuenta.");
      });
  }, [token, scopedTenantId, searchParams]);

  useEffect(() => {
    if (!token || !selectedBrandId) return;
    api.getTenantBranding(token, selectedBrandId).then(setBranding).catch(() => setBranding(emptyBranding));
    api.getTenantCommercialUsage(token, selectedBrandId).then(setUsage).catch(() => setUsage(null));
  }, [selectedBrandId, token]);

  const selectedBrand = useMemo(
    () => brands.find((row) => row.id === selectedBrandId) ?? null,
    [brands, selectedBrandId]
  );

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedBrandId) return;
    try {
      setSaving(true);
      setError("");
      const result = await api.upsertTenantBranding(token, selectedBrandId, branding);
      setBranding(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Ficha de marca activa"
        subtitle="Revisión rápida por marca hija: salud comercial, consumo y branding básico en contexto local."
      />
      {error ? <p className="error">{error}</p> : null}
      {!selectedBrandId ? <p className="error">No hay marca activa para revisar.</p> : null}
      <div className="row-gap">
        <label>
          Marca a revisar
          <select
            value={selectedBrandId ?? ""}
            onChange={(event) => {
              const nextBrandId = Number(event.target.value);
              setSelectedBrandId(nextBrandId);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set("brandId", String(nextBrandId));
              setSearchParams(nextParams);
            }}
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name} {brand.is_parent_brand ? "(principal)" : "(hija)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className="card">
        <h3>Resumen operativo de marca</h3>
        <p><strong>Marca:</strong> {selectedBrand?.name ?? "-"}</p>
        <p><strong>Estatus:</strong> {selectedBrand?.is_active ? "Activa" : "Inactiva"}</p>
        <p><strong>Estado comercial:</strong> {healthLabel(usage)}</p>
        <p><strong>Productos:</strong> {usage?.products_used ?? 0} / {usage?.products_limit ?? 0}</p>
        <p><strong>Usuarios:</strong> {usage?.users_used ?? 0} / {usage?.users_limit ?? 0}</p>
        <p><strong>Sucursales:</strong> {usage?.branches_used ?? 0} / {usage?.branches_limit ?? 0}</p>
        <p><strong>Créditos IA:</strong> {usage?.ai_tokens_used ?? 0} usados / {usage?.ai_tokens_remaining ?? 0} restantes</p>
      </article>

      <ModuleOnboardingCard
        moduleKey="landing_branding"
        title="Identidad de marca"
        whatItDoes="Define la identidad visual y mensajes base para los canales de esta marca."
        whyItMatters="Una identidad consistente mejora confianza y conversión."
        whatToCapture={["Colores principales", "Hero principal", "Logo y contactos", "Tono visual"]}
        impact="Alinea la experiencia comercial de esta marca en sus canales activos."
      />

      <form className="detail-form" onSubmit={handleSave}>
        <label>
          Color principal
          <input
            value={branding.primary_color ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, primary_color: e.target.value }))}
          />
        </label>
        <label>
          Color secundario
          <input
            value={branding.secondary_color ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))}
          />
        </label>
        <label>
          URL de logotipo
          <input value={branding.logo_url ?? ""} onChange={(e) => setBranding((prev) => ({ ...prev, logo_url: e.target.value }))} />
        </label>
        <label>
          Título hero
          <input
            value={branding.hero_title ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, hero_title: e.target.value }))}
          />
        </label>
        <label>
          Subtítulo hero
          <input
            value={branding.hero_subtitle ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, hero_subtitle: e.target.value }))}
          />
        </label>
        <label>
          WhatsApp
          <input
            value={branding.contact_whatsapp ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, contact_whatsapp: e.target.value }))}
          />
        </label>
        <label>
          Correo de contacto
          <input
            value={branding.contact_email ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, contact_email: e.target.value }))}
          />
        </label>
        <button className="button" type="submit" disabled={saving || !selectedBrandId}>
          {saving ? "Guardando..." : "Guardar branding"}
        </button>
      </form>
    </section>
  );
}
