import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { ServiceOffering, Tenant } from "../types/domain";

export function ServicesAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<ServiceOffering[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    duration_minutes: "60",
    price: "0",
    is_featured: false
  });

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((rows) => {
      setTenants(rows);
      setTenantId((prev) => prev ?? rows[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    setItems(await api.getServicesByTenant(token, selectedTenantId));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar servicios"));
  }, [tenantId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      await api.createService(token, {
        tenant_id: tenantId,
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price),
        is_active: true,
        is_featured: form.is_featured,
        requires_schedule: true
      });
      setForm({ name: "", slug: "", description: "", duration_minutes: "60", price: "0", is_featured: false });
      await load(tenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear servicio");
    }
  };

  const toggle = async (service: ServiceOffering) => {
    if (!token || !tenantId) return;
    await api.updateService(token, service.id, { is_active: !service.is_active });
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Services" subtitle="Servicios por tenant con duracion, precio y estado." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <form className="inline-form" onSubmit={create}>
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
        <input placeholder="Descripcion" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <input
          type="number"
          min={1}
          placeholder="Duracion min"
          value={form.duration_minutes}
          onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
        />
        <input type="number" min={0} placeholder="Precio" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
        <label className="checkbox">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} />
          Destacado
        </label>
        <button className="button" type="submit">
          Crear servicio
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Servicio</th>
            <th>Duracion</th>
            <th>Precio</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.duration_minutes} min</td>
              <td>${Number(item.price).toLocaleString("es-MX")}</td>
              <td>
                <button className="button button-outline" type="button" onClick={() => toggle(item)}>
                  {item.is_active ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

