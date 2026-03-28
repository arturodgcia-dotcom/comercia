import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Banner, Tenant } from "../types/domain";

export function BannersAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<Banner[]>([]);
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    target_type: "promotion",
    target_value: "",
    position: "hero",
    priority: 1
  });

  const load = async (id: number) => {
    if (!token) return;
    setItems(await api.getBanners(token, id));
  };

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId(list[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch(() => undefined);
  }, [tenantId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    await api.createBanner(token, { tenant_id: tenantId, ...form, is_active: true });
    setForm({ title: "", image_url: "", target_type: "promotion", target_value: "", position: "hero", priority: 1 });
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Banners" subtitle="Banners dinamicos por posicion, prioridad y target." />
      <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <form className="inline-form" onSubmit={create}>
        <input required placeholder="Titulo" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} />
        <select value={form.target_type} onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value }))}>
          <option value="promotion">promotion</option>
          <option value="product">product</option>
          <option value="category">category</option>
          <option value="url">url</option>
        </select>
        <input placeholder="Target value" value={form.target_value} onChange={(e) => setForm((p) => ({ ...p, target_value: e.target.value }))} />
        <select value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}>
          <option value="hero">hero</option>
          <option value="store_top">store_top</option>
          <option value="distributors_top">distributors_top</option>
          <option value="checkout_upsell">checkout_upsell</option>
        </select>
        <input type="number" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
        <button className="button" type="submit">
          Crear banner
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Titulo</th>
            <th>Position</th>
            <th>Target</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {items.map((banner) => (
            <tr key={banner.id}>
              <td>{banner.id}</td>
              <td>{banner.title}</td>
              <td>{banner.position}</td>
              <td>
                {banner.target_type}: {banner.target_value}
              </td>
              <td>{banner.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
