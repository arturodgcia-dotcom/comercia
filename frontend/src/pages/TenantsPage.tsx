import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Tenant } from "../types/domain";

const defaultForm = { name: "", slug: "", subdomain: "", business_type: "mixed", is_active: true };

export function TenantsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    if (!token) return;
    try {
      setError("");
      setItems(await api.getTenants(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar tenants");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      await api.createTenant(token, form);
      setForm(defaultForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear el tenant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader title="Tenants" subtitle="Alta y consulta de marcas multitenant." />
      {error ? <p className="error">{error}</p> : null}
      <form className="inline-form" onSubmit={handleCreate}>
        <input
          required
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          required
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
        />
        <input
          required
          placeholder="Subdomain"
          value={form.subdomain}
          onChange={(e) => setForm((prev) => ({ ...prev, subdomain: e.target.value }))}
        />
        <select value={form.business_type} onChange={(e) => setForm((prev) => ({ ...prev, business_type: e.target.value }))}>
          <option value="products">products</option>
          <option value="services">services</option>
          <option value="mixed">mixed</option>
        </select>
        <button className="button" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Crear tenant"}
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Subdomain</th>
            <th>Business</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.id}</td>
              <td>{tenant.name}</td>
              <td>{tenant.slug}</td>
              <td>{tenant.subdomain}</td>
              <td>{tenant.business_type}</td>
              <td>{tenant.is_active ? "Yes" : "No"}</td>
              <td>
                <Link to={`/tenants/${tenant.id}`}>Detalle</Link> |{" "}
                <Link to={`/store/${tenant.slug}`} target="_blank" rel="noreferrer">
                  Ver Store
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
