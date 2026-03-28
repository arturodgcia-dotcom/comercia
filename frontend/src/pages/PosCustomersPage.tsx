import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PosCustomer } from "../types/domain";

export function PosCustomersPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  const load = () => token && api.getPosCustomersByTenant(token, tenantId).then(setCustomers);
  useEffect(() => { load(); }, [token, tenantId]);

  const createCustomer = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    await api.createPosCustomer(token, { tenant_id: tenantId, ...form });
    setForm({ full_name: "", email: "", phone: "" });
    load();
  };

  return (
    <section>
      <PageHeader title="POS Clientes" subtitle="Registro rapido de clientes para fidelizacion." />
      <form className="inline-form" onSubmit={createCustomer}>
        <input placeholder="Nombre" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <input placeholder="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <button className="button" type="submit">Crear cliente</button>
      </form>
      <table className="table">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Telefono</th><th>Puntos</th></tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.full_name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>{customer.loyalty_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
