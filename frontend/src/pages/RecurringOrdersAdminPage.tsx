import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { RecurringOrderSchedule, Tenant } from "../types/domain";

export function RecurringOrdersAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [rows, setRows] = useState<RecurringOrderSchedule[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ frequency: "monthly", next_run_at: "", notes: "" });
  const [itemForm, setItemForm] = useState({ schedule_id: "", product_id: "", quantity: "1", unit_price_snapshot: "0" });

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId((prev) => prev ?? list[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    setRows(await api.getRecurringOrdersByTenant(token, selectedTenantId));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar recurrencias"));
  }, [tenantId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    await api.createRecurringOrder(token, {
      tenant_id: tenantId,
      frequency: form.frequency,
      next_run_at: new Date(form.next_run_at).toISOString(),
      notes: form.notes || undefined,
      is_active: true
    });
    setForm({ frequency: "monthly", next_run_at: "", notes: "" });
    await load(tenantId);
  };

  const addItems = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !itemForm.schedule_id) return;
    await api.addRecurringOrderItems(token, Number(itemForm.schedule_id), [
      {
        product_id: Number(itemForm.product_id),
        quantity: Number(itemForm.quantity),
        unit_price_snapshot: Number(itemForm.unit_price_snapshot)
      }
    ]);
    setItemForm({ schedule_id: "", product_id: "", quantity: "1", unit_price_snapshot: "0" });
  };

  return (
    <section>
      <PageHeader title="Recurring Orders" subtitle="Programacion de pedidos recurrentes por tenant." />
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
        <select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}>
          <option value="weekly">weekly</option>
          <option value="biweekly">biweekly</option>
          <option value="monthly">monthly</option>
        </select>
        <input type="datetime-local" value={form.next_run_at} onChange={(e) => setForm((p) => ({ ...p, next_run_at: e.target.value }))} required />
        <input placeholder="Notas" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        <button className="button" type="submit">
          Crear schedule
        </button>
      </form>

      <form className="inline-form" onSubmit={addItems}>
        <input
          required
          placeholder="Schedule ID"
          value={itemForm.schedule_id}
          onChange={(e) => setItemForm((p) => ({ ...p, schedule_id: e.target.value }))}
        />
        <input
          required
          placeholder="Product ID"
          value={itemForm.product_id}
          onChange={(e) => setItemForm((p) => ({ ...p, product_id: e.target.value }))}
        />
        <input required placeholder="Cantidad" value={itemForm.quantity} onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))} />
        <input
          required
          placeholder="Precio snapshot"
          value={itemForm.unit_price_snapshot}
          onChange={(e) => setItemForm((p) => ({ ...p, unit_price_snapshot: e.target.value }))}
        />
        <button className="button button-outline" type="submit">
          Agregar item
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Frecuencia</th>
            <th>Proximo run</th>
            <th>Activo</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.frequency}</td>
              <td>{new Date(row.next_run_at).toLocaleString("es-MX")}</td>
              <td>{row.is_active ? "Si" : "No"}</td>
              <td>{row.notes ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

