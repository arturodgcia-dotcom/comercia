import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Coupon, Tenant } from "../types/domain";

export function CouponsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: 10, applies_to: "all" });

  const load = async (id: number) => {
    if (!token) return;
    setItems(await api.getCoupons(token, id));
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
    await api.createCoupon(token, { tenant_id: tenantId, ...form, is_active: true });
    setForm({ code: "", discount_type: "percentage", discount_value: 10, applies_to: "all" });
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Coupons" subtitle="Gestion de cupones, vigencia y control de uso." />
      <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
      <form className="inline-form" onSubmit={create}>
        <input required placeholder="CODE" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
        <select value={form.discount_type} onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}>
          <option value="percentage">percentage</option>
          <option value="fixed">fixed</option>
        </select>
        <input
          type="number"
          value={form.discount_value}
          onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
        />
        <select value={form.applies_to} onChange={(e) => setForm((p) => ({ ...p, applies_to: e.target.value }))}>
          <option value="all">all</option>
          <option value="public">public</option>
          <option value="distributor">distributor</option>
        </select>
        <button className="button" type="submit">
          Crear cupon
        </button>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Used</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((coupon) => (
            <tr key={coupon.id}>
              <td>{coupon.code}</td>
              <td>{coupon.discount_type}</td>
              <td>{coupon.discount_value}</td>
              <td>
                {coupon.used_count}/{coupon.max_uses ?? "inf"}
              </td>
              <td>{coupon.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
