import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { LogisticsEvent, LogisticsOrder, Tenant } from "../types/domain";

export function LogisticsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [rows, setRows] = useState<LogisticsOrder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [events, setEvents] = useState<LogisticsEvent[]>([]);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({
    delivery_type: "public",
    delivery_address: "",
    warehouse_address: "",
    tracking_reference: "",
    courier_name: "",
    delivery_notes: ""
  });
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId((prev) => prev ?? list[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    const data = await api.getLogisticsByTenant(token, selectedTenantId);
    setRows(data);
    setSelectedId((prev) => prev ?? data[0]?.id ?? null);
  };

  const loadEvents = async (logisticsId: number) => {
    if (!token) return;
    setEvents(await api.getLogisticsEvents(token, logisticsId));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar logistica"));
  }, [tenantId, token]);

  useEffect(() => {
    if (!selectedId) return;
    loadEvents(selectedId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar eventos"));
  }, [selectedId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    await api.createLogisticsOrder(token, { tenant_id: tenantId, ...createForm });
    setCreateForm({
      delivery_type: "public",
      delivery_address: "",
      warehouse_address: "",
      tracking_reference: "",
      courier_name: "",
      delivery_notes: ""
    });
    await load(tenantId);
  };

  const schedule = async (id: number) => {
    if (!token || !scheduleDate) return;
    await api.scheduleLogistics(token, id, { scheduled_delivery_at: new Date(scheduleDate).toISOString() });
    if (tenantId) await load(tenantId);
    await loadEvents(id);
  };

  const reschedule = async (id: number) => {
    if (!token || !scheduleDate) return;
    await api.rescheduleLogistics(token, id, { scheduled_delivery_at: new Date(scheduleDate).toISOString(), notes: "reprogramado desde panel" });
    if (tenantId) await load(tenantId);
    await loadEvents(id);
  };

  const markDelivered = async (id: number) => {
    if (!token) return;
    await api.markLogisticsDelivered(token, id);
    if (tenantId) await load(tenantId);
    await loadEvents(id);
  };

  return (
    <section>
      <PageHeader title="Logistics" subtitle="Ordenes logisticas, scheduling y tracking base." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
      </div>

      <form className="inline-form" onSubmit={create}>
        <select value={createForm.delivery_type} onChange={(e) => setCreateForm((p) => ({ ...p, delivery_type: e.target.value }))}>
          <option value="public">public</option>
          <option value="distributor">distributor</option>
          <option value="internal_pickup">internal_pickup</option>
          <option value="franchise">franchise</option>
        </select>
        <input
          required
          placeholder="Direccion entrega"
          value={createForm.delivery_address}
          onChange={(e) => setCreateForm((p) => ({ ...p, delivery_address: e.target.value }))}
        />
        <input
          placeholder="Almacen"
          value={createForm.warehouse_address}
          onChange={(e) => setCreateForm((p) => ({ ...p, warehouse_address: e.target.value }))}
        />
        <input
          placeholder="Tracking"
          value={createForm.tracking_reference}
          onChange={(e) => setCreateForm((p) => ({ ...p, tracking_reference: e.target.value }))}
        />
        <input placeholder="Courier" value={createForm.courier_name} onChange={(e) => setCreateForm((p) => ({ ...p, courier_name: e.target.value }))} />
        <input
          placeholder="Notas"
          value={createForm.delivery_notes}
          onChange={(e) => setCreateForm((p) => ({ ...p, delivery_notes: e.target.value }))}
        />
        <button className="button" type="submit">
          Crear logistica
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Tracking</th>
            <th>Courier</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.delivery_type}</td>
              <td>{row.status}</td>
              <td>{row.tracking_reference ?? "-"}</td>
              <td>{row.courier_name ?? "-"}</td>
              <td className="row-gap">
                <button className="button button-outline" type="button" onClick={() => schedule(row.id)}>
                  Programar
                </button>
                <button className="button button-outline" type="button" onClick={() => reschedule(row.id)}>
                  Reprogramar
                </button>
                <button className="button button-outline" type="button" onClick={() => markDelivered(row.id)}>
                  Entregado
                </button>
                <button className="button button-outline" type="button" onClick={() => setSelectedId(row.id)}>
                  Ver eventos
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Eventos</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.id}</td>
              <td>{event.event_type}</td>
              <td>{new Date(event.event_at).toLocaleString("es-MX")}</td>
              <td>{event.notes ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

