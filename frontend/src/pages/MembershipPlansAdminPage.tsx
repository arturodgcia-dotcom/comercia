import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { MembershipPlan, Tenant } from "../types/domain";

export function MembershipPlansAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<MembershipPlan[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_days: 30,
    price: 0,
    points_multiplier: 1,
    benefits_json: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId(list[0]?.id ?? null);
    });
  }, [token]);

  const load = async (id: number) => {
    if (!token) return;
    setItems(await api.getMembershipPlans(token, id));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "Error cargando memberships"));
  }, [tenantId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    await api.createMembershipPlan(token, { tenant_id: tenantId, ...form, is_active: true });
    setForm({ name: "", description: "", duration_days: 30, price: 0, points_multiplier: 1, benefits_json: "" });
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Membership Plans" subtitle="Gestion de planes de membresia y beneficios." />
      {error ? <p className="error">{error}</p> : null}
      <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <form className="inline-form" onSubmit={create}>
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input placeholder="Descripcion" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        <input type="number" value={form.duration_days} onChange={(e) => setForm((p) => ({ ...p, duration_days: Number(e.target.value) }))} />
        <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} />
        <input
          type="number"
          value={form.points_multiplier}
          onChange={(e) => setForm((p) => ({ ...p, points_multiplier: Number(e.target.value) }))}
        />
        <input
          placeholder="benefits_json"
          value={form.benefits_json}
          onChange={(e) => setForm((p) => ({ ...p, benefits_json: e.target.value }))}
        />
        <button className="button" type="submit">
          Crear plan
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Duracion</th>
            <th>Precio</th>
            <th>Multiplier</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.duration_days}</td>
              <td>{item.price}</td>
              <td>{item.points_multiplier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
