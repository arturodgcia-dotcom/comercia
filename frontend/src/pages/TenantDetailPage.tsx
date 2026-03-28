import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Tenant } from "../types/domain";

export function TenantDetailPage() {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token || !tenantId) return;
    try {
      setError("");
      setTenant(await api.getTenantById(token, Number(tenantId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar tenant");
    }
  };

  useEffect(() => {
    void load();
  }, [token, tenantId]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenant || !token) return;
    try {
      setSaving(true);
      setError("");
      await api.updateTenant(token, tenant.id, tenant);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar tenant");
    } finally {
      setSaving(false);
    }
  };

  if (!tenantId) return <p>Tenant invalido.</p>;

  return (
    <section>
      <PageHeader title="Tenant Detail" subtitle="Edicion base de tenant y acceso a branding/storefront." />
      {error ? <p className="error">{error}</p> : null}
      {!tenant ? (
        <p>Cargando tenant...</p>
      ) : (
        <form className="detail-form" onSubmit={handleSave}>
          <label>
            Name
            <input value={tenant.name} onChange={(e) => setTenant((prev) => (prev ? { ...prev, name: e.target.value } : prev))} />
          </label>
          <label>
            Slug
            <input value={tenant.slug} onChange={(e) => setTenant((prev) => (prev ? { ...prev, slug: e.target.value } : prev))} />
          </label>
          <label>
            Subdomain
            <input
              value={tenant.subdomain}
              onChange={(e) => setTenant((prev) => (prev ? { ...prev, subdomain: e.target.value } : prev))}
            />
          </label>
          <label>
            Business type
            <select
              value={tenant.business_type}
              onChange={(e) => setTenant((prev) => (prev ? { ...prev, business_type: e.target.value } : prev))}
            >
              <option value="products">products</option>
              <option value="services">services</option>
              <option value="mixed">mixed</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={tenant.is_active}
              onChange={(e) => setTenant((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))}
            />
            Activo
          </label>
          <div className="row-gap">
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link className="button button-outline" to={`/tenants/${tenant.id}/branding`}>
              Editar branding
            </Link>
            <Link className="button button-outline" to={`/store/${tenant.slug}`} target="_blank" rel="noreferrer">
              Ver storefront
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
