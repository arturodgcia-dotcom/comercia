import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { TenantBranding } from "../types/domain";

const emptyBranding: Partial<TenantBranding> = {
  primary_color: "#0447A6",
  secondary_color: "#DCE8FB"
};

export function BrandingEditorPage() {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const resolvedTenantId = Number(tenantId ?? scopedTenantId ?? 0);
  const [branding, setBranding] = useState<Partial<TenantBranding>>(emptyBranding);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!resolvedTenantId || !token) return;
    api
      .getTenantBranding(token, resolvedTenantId)
      .then((result) => setBranding(result))
      .catch(() => setBranding(emptyBranding));
  }, [resolvedTenantId, token]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !resolvedTenantId) return;
    try {
      setSaving(true);
      setError("");
      const result = await api.upsertTenantBranding(token, resolvedTenantId, branding);
      setBranding(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader title="Editor de branding" subtitle="Configuracion visual y de contacto por marca." />
      {!resolvedTenantId ? <p className="error">No hay marca activa para editar branding.</p> : null}
      <ModuleOnboardingCard
        moduleKey="landing_branding"
        title="Landing de marca"
        whatItDoes="Define la identidad visual y mensajes base que se reflejan en la landing y storefront."
        whyItMatters="Un branding consistente mejora conversion y reconocimiento de marca."
        whatToCapture={["Colores principales", "Hero principal", "Logo y contactos", "Tono visual"]}
        impact="Mejora la presentacion comercial y mantiene coherencia en todos los canales."
      />
      {error ? <p className="error">{error}</p> : null}
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
          Titulo hero
          <input
            value={branding.hero_title ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, hero_title: e.target.value }))}
          />
        </label>
        <label>
          Subtitulo hero
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
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar branding"}
        </button>
      </form>
    </section>
  );
}
