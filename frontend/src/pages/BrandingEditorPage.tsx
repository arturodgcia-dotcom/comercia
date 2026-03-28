import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
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
  const [branding, setBranding] = useState<Partial<TenantBranding>>(emptyBranding);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId || !token) return;
    api
      .getTenantBranding(token, Number(tenantId))
      .then((result) => setBranding(result))
      .catch(() => setBranding(emptyBranding));
  }, [tenantId, token]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      setSaving(true);
      setError("");
      const result = await api.upsertTenantBranding(token, Number(tenantId), branding);
      setBranding(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader title="Branding Editor" subtitle="Configuracion visual y de contacto por tenant." />
      {error ? <p className="error">{error}</p> : null}
      <form className="detail-form" onSubmit={handleSave}>
        <label>
          Primary color
          <input
            value={branding.primary_color ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, primary_color: e.target.value }))}
          />
        </label>
        <label>
          Secondary color
          <input
            value={branding.secondary_color ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))}
          />
        </label>
        <label>
          Logo URL
          <input value={branding.logo_url ?? ""} onChange={(e) => setBranding((prev) => ({ ...prev, logo_url: e.target.value }))} />
        </label>
        <label>
          Hero title
          <input
            value={branding.hero_title ?? ""}
            onChange={(e) => setBranding((prev) => ({ ...prev, hero_title: e.target.value }))}
          />
        </label>
        <label>
          Hero subtitle
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
          Contact email
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
