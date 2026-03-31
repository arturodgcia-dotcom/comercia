import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
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
  const deliveryTypeLabel: Record<string, string> = {
    public: "Publico",
    distributor: "Distribuidor",
    internal_pickup: "Recoleccion interna",
    franchise: "Franquicia",
  };

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

  const summary = useMemo(() => {
    const delivered = rows.filter((row) => row.status === "delivered").length;
    const pending = rows.filter((row) => row.status === "pending" || row.status === "scheduled").length;
    const inTransit = rows.filter((row) => row.status === "in_transit").length;
    return { total: rows.length, delivered, pending, inTransit };
  }, [rows]);

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
      <PageHeader title="Logistica" subtitle="Ordenes logisticas, programacion y tracking base." />
      <ModuleOnboardingCard
        moduleKey="logistics"
        title="Logistica y seguimiento"
        whatItDoes="Administra ordenes de entrega, reprogramaciones, tracking y eventos operativos."
        whyItMatters="Permite cumplir promesas de entrega y medir cuellos de botella en operacion."
        whatToCapture={["Tipo de servicio", "Direccion y origen", "Tracking/courier", "Fecha programada y estado"]}
        impact="Reduce incidencias y mejora la experiencia de entrega para cliente y distribuidor."
      />
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

      <section className="card-grid">
        <article className="card"><h3>Total ordenes</h3><p>{summary.total}</p></article>
        <article className="card"><h3>Pendientes</h3><p>{summary.pending}</p></article>
        <article className="card"><h3>En transito</h3><p>{summary.inTransit}</p></article>
        <article className="card"><h3>Entregadas</h3><p>{summary.delivered}</p></article>
      </section>

      <form className="inline-form" onSubmit={create}>
        <select value={createForm.delivery_type} onChange={(e) => setCreateForm((p) => ({ ...p, delivery_type: e.target.value }))}>
          <option value="public">Publico</option>
          <option value="distributor">Distribuidor</option>
          <option value="internal_pickup">Recoleccion interna</option>
          <option value="franchise">Franquicia</option>
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
              <td>{deliveryTypeLabel[row.delivery_type] ?? row.delivery_type}</td>
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

      {rows.length === 0 ? (
        <article className="card">
          <p>Aun no hay ordenes logisticas para esta marca. Aqui veras recoleccion, entrega y seguimiento operativo.</p>
        </article>
      ) : null}

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
