import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { AddonModuleAccessCard } from "../components/AddonModuleAccessCard";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { BrandAdminSettings, LogisticsEvent, LogisticsOrder, Tenant } from "../types/domain";

export function LogisticsAdminPage() {
  const { token, user } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const isSuperAdmin = user?.role === "reinpia_admin" || user?.role === "super_admin";

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
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
    delivery_notes: "",
  });
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      const preferred = scopedTenantId && list.some((item) => item.id === scopedTenantId) ? scopedTenantId : list[0]?.id ?? null;
      setSelectedTenantId((prev) => prev ?? preferred);
    });
  }, [token, scopedTenantId]);

  const loadBrand = async (tenantId: number) => {
    if (!token) return;
    const settings = await api.getBrandAdminSettings(token, tenantId).catch(() => null);
    setBrandSettings(settings);
  };

  const loadOrders = async (tenantId: number) => {
    if (!token) return;
    const data = await api.getLogisticsByTenant(token, tenantId);
    setRows(data);
    setSelectedId((prev) => prev ?? data[0]?.id ?? null);
  };

  const loadEvents = async (logisticsId: number) => {
    if (!token) return;
    setEvents(await api.getLogisticsEvents(token, logisticsId));
  };

  useEffect(() => {
    if (!selectedTenantId) return;
    Promise.all([loadBrand(selectedTenantId), loadOrders(selectedTenantId)]).catch((err) =>
      setError(err instanceof Error ? err.message : "No fue posible cargar logística.")
    );
  }, [selectedTenantId, token]);

  useEffect(() => {
    if (!selectedId) return;
    loadEvents(selectedId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar eventos."));
  }, [selectedId, token]);

  const allowOperational = Boolean(isSuperAdmin || brandSettings?.feature_logistics_enabled);

  const summary = useMemo(() => {
    const delivered = rows.filter((row) => row.status === "delivered").length;
    const pending = rows.filter((row) => row.status === "pending" || row.status === "scheduled").length;
    const inTransit = rows.filter((row) => row.status === "in_transit").length;
    return { total: rows.length, delivered, pending, inTransit };
  }, [rows]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedTenantId || !allowOperational) return;
    await api.createLogisticsOrder(token, { tenant_id: selectedTenantId, ...createForm });
    setCreateForm({
      delivery_type: "public",
      delivery_address: "",
      warehouse_address: "",
      tracking_reference: "",
      courier_name: "",
      delivery_notes: "",
    });
    await loadOrders(selectedTenantId);
  };

  const schedule = async (id: number) => {
    if (!token || !scheduleDate || !allowOperational) return;
    await api.scheduleLogistics(token, id, { scheduled_delivery_at: new Date(scheduleDate).toISOString() });
    if (selectedTenantId) await loadOrders(selectedTenantId);
    await loadEvents(id);
  };

  const reschedule = async (id: number) => {
    if (!token || !scheduleDate || !allowOperational) return;
    await api.rescheduleLogistics(token, id, { scheduled_delivery_at: new Date(scheduleDate).toISOString(), notes: "reprogramado desde panel" });
    if (selectedTenantId) await loadOrders(selectedTenantId);
    await loadEvents(id);
  };

  const markDelivered = async (id: number) => {
    if (!token || !allowOperational) return;
    await api.markLogisticsDelivered(token, id);
    if (selectedTenantId) await loadOrders(selectedTenantId);
    await loadEvents(id);
  };

  return (
    <section>
      <PageHeader title="Logística" subtitle="Módulo add-on para entregas, tracking y eventos operativos." />
      <ModuleOnboardingCard
        moduleKey="logistics"
        title="Logística y seguimiento"
        whatItDoes="Administra órdenes de entrega, reprogramaciones, tracking y eventos operativos."
        whyItMatters="Permite cumplir promesas de entrega y medir cuellos de botella."
        whatToCapture={["Tipo de servicio", "Dirección y origen", "Tracking/courier", "Fecha programada y estado"]}
        impact="Mejora la experiencia de entrega para cliente y distribuidor."
      />
      {error ? <p className="error">{error}</p> : null}

      {selectedTenantId && brandSettings ? (
        <AddonModuleAccessCard
          tenantId={selectedTenantId}
          moduleKey="logistics"
          moduleName="Logística"
          description="Módulo add-on para operación de entregas y control de ruta."
          benefits={[
            "Programación y reprogramación de entregas",
            "Seguimiento por eventos logísticos",
            "Control por sucursal y courier",
          ]}
          status={brandSettings.addon_logistics_status}
          plan={brandSettings.addon_logistics_plan}
          scopeBranchIds={brandSettings.addon_logistics_scope_branch_ids}
          allowOperational={allowOperational}
          onUpdated={async () => {
            if (selectedTenantId) await loadBrand(selectedTenantId);
          }}
        />
      ) : null}

      {!allowOperational ? (
        <article className="card">
          <p>
            Este módulo está visible como disponible, pero requiere contratación y activación para operar.
          </p>
        </article>
      ) : (
        <>
          <div className="row-gap">
            <select value={selectedTenantId ?? ""} onChange={(e) => setSelectedTenantId(Number(e.target.value))} disabled={!isSuperAdmin}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          </div>

          <section className="card-grid">
            <article className="card"><h3>Total órdenes</h3><p>{summary.total}</p></article>
            <article className="card"><h3>Pendientes</h3><p>{summary.pending}</p></article>
            <article className="card"><h3>En tránsito</h3><p>{summary.inTransit}</p></article>
            <article className="card"><h3>Entregadas</h3><p>{summary.delivered}</p></article>
          </section>

          <form className="inline-form" onSubmit={create}>
            <select value={createForm.delivery_type} onChange={(e) => setCreateForm((p) => ({ ...p, delivery_type: e.target.value }))}>
              <option value="public">Público</option>
              <option value="distributor">Distribuidor</option>
              <option value="internal_pickup">Recolección interna</option>
              <option value="franchise">Franquicia</option>
            </select>
            <input required placeholder="Dirección entrega" value={createForm.delivery_address} onChange={(e) => setCreateForm((p) => ({ ...p, delivery_address: e.target.value }))} />
            <input placeholder="Almacén" value={createForm.warehouse_address} onChange={(e) => setCreateForm((p) => ({ ...p, warehouse_address: e.target.value }))} />
            <input placeholder="Tracking" value={createForm.tracking_reference} onChange={(e) => setCreateForm((p) => ({ ...p, tracking_reference: e.target.value }))} />
            <input placeholder="Courier" value={createForm.courier_name} onChange={(e) => setCreateForm((p) => ({ ...p, courier_name: e.target.value }))} />
            <input placeholder="Notas" value={createForm.delivery_notes} onChange={(e) => setCreateForm((p) => ({ ...p, delivery_notes: e.target.value }))} />
            <button className="button" type="submit">Crear logística</button>
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
                    <button className="button button-outline" type="button" onClick={() => void schedule(row.id)}>Programar</button>
                    <button className="button button-outline" type="button" onClick={() => void reschedule(row.id)}>Reprogramar</button>
                    <button className="button button-outline" type="button" onClick={() => void markDelivered(row.id)}>Entregado</button>
                    <button className="button button-outline" type="button" onClick={() => setSelectedId(row.id)}>Ver eventos</button>
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
        </>
      )}
    </section>
  );
}

