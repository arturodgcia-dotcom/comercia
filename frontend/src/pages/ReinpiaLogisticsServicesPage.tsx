import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { LogisticsAdditionalService, Tenant } from "../types/domain";

const defaultForm = {
  tenant_id: 0,
  service_type: "ambos",
  origin: "",
  destination: "",
  kilometers: 0,
  unit_cost: 0,
  iva: 0,
  currency: "MXN",
  observations: "",
  status: "pendiente",
  service_date: "",
  billing_summary: "",
};

export function ReinpiaLogisticsServicesPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<LogisticsAdditionalService[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState<{ total_services: number; subtotal: number; iva: number; total: number; by_status: Array<{ status: string; count: number }> } | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<LogisticsAdditionalService | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paymentLinkMessage, setPaymentLinkMessage] = useState("");
  const [filters, setFilters] = useState({
    tenant_id: 0,
    status: "",
    date_from: "",
    date_to: "",
  });

  const formSubtotal = useMemo(() => Number(form.kilometers) * Number(form.unit_cost), [form.kilometers, form.unit_cost]);
  const formTotal = useMemo(() => formSubtotal + Number(form.iva), [formSubtotal, form.iva]);

  const buildQuery = () => {
    const query = new URLSearchParams();
    if (filters.tenant_id) query.set("tenant_id", String(filters.tenant_id));
    if (filters.status) query.set("status", filters.status);
    if (filters.date_from) query.set("date_from", new Date(filters.date_from).toISOString());
    if (filters.date_to) query.set("date_to", new Date(filters.date_to).toISOString());
    return query.toString();
  };

  const load = async () => {
    if (!token) return;
    try {
      setError("");
      const query = buildQuery();
      const [tenantRows, rows, summaryRow] = await Promise.all([
        api.getTenants(token),
        api.getReinpiaLogisticsServices(token, query),
        api.getReinpiaLogisticsServiceSummary(token, query),
      ]);
      setTenants(tenantRows);
      setServices(rows);
      setSummary(summaryRow);
      if (!form.tenant_id && tenantRows.length > 0) {
        setForm((prev) => ({ ...prev, tenant_id: tenantRows[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar servicios logisticos adicionales.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters.tenant_id, filters.status, filters.date_from, filters.date_to]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        subtotal: formSubtotal,
        total: formTotal,
        service_date: form.service_date || new Date().toISOString(),
      };
      let result: LogisticsAdditionalService;
      if (editingId) {
        result = await api.updateReinpiaLogisticsService(token, editingId, payload);
      } else {
        result = await api.createReinpiaLogisticsService(token, payload);
      }
      setServices((prev) => (editingId ? prev.map((item) => (item.id === result.id ? result : item)) : [result, ...prev]));
      setForm((prev) => ({ ...defaultForm, tenant_id: prev.tenant_id || result.tenant_id, currency: "MXN" }));
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar el servicio logistico.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row: LogisticsAdditionalService) => {
    setEditingId(row.id);
    setForm({
      tenant_id: row.tenant_id,
      service_type: row.service_type,
      origin: row.origin,
      destination: row.destination,
      kilometers: Number(row.kilometers),
      unit_cost: Number(row.unit_cost),
      iva: Number(row.iva),
      currency: row.currency,
      observations: row.observations ?? "",
      status: row.status,
      service_date: row.service_date.slice(0, 16),
      billing_summary: row.billing_summary ?? "",
    });
  };

  const createCollectionLink = async (row: LogisticsAdditionalService, provider: "stripe" | "mercadopago") => {
    const tenant = tenants.find((item) => item.id === row.tenant_id);
    const base = provider === "stripe" ? "https://buy.stripe.com/" : "https://www.mercadopago.com.mx/checkout/v1/redirect";
    const reference = encodeURIComponent(`logistics-${row.id}-${tenant?.slug ?? row.tenant_id}`);
    const amount = Number(row.total).toFixed(2);
    const link =
      provider === "stripe"
        ? `${base}${reference}?amount=${amount}&currency=${row.currency}`
        : `${base}?external_reference=${reference}&amount=${amount}&description=Servicio%20logistico`;
    try {
      await navigator.clipboard.writeText(link);
      setPaymentLinkMessage(`Link de cobro (${provider}) copiado para servicio #${row.id}.`);
    } catch {
      setPaymentLinkMessage(`Link de cobro (${provider}): ${link}`);
    }
  };

  return (
    <section>
      <PageHeader
        title="Servicios logisticos adicionales"
        subtitle="Controla servicios de recoleccion, entrega y resguardo brindados a marcas para seguimiento operativo y facturacion."
      />
      {error ? <p className="error">{error}</p> : null}
      {paymentLinkMessage ? <p>{paymentLinkMessage}</p> : null}

      <div className="card-grid">
        <article className="card">
          <h3>Total servicios</h3>
          <p className="metric-value">{summary?.total_services ?? 0}</p>
        </article>
        <article className="card">
          <h3>Subtotal acumulado</h3>
          <p className="metric-value">${Number(summary?.subtotal ?? 0).toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h3>IVA acumulado</h3>
          <p className="metric-value">${Number(summary?.iva ?? 0).toLocaleString("es-MX")}</p>
        </article>
        <article className="card">
          <h3>Total facturable</h3>
          <p className="metric-value">${Number(summary?.total ?? 0).toLocaleString("es-MX")}</p>
        </article>
      </div>

      <article className="card">
        <h3>Filtros</h3>
        <form className="inline-form">
          <select value={filters.tenant_id} onChange={(e) => setFilters((prev) => ({ ...prev, tenant_id: Number(e.target.value) }))}>
            <option value={0}>Todas las marcas</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">Todos los estatus</option>
            <option value="pendiente">Pendiente</option>
            <option value="programado">Programado</option>
            <option value="facturable">Facturable</option>
            <option value="pendiente_pago">Pendiente pago</option>
            <option value="pagado">Pagado</option>
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))} />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))} />
          <button type="button" className="button button-outline" onClick={() => setFilters({ tenant_id: 0, status: "", date_from: "", date_to: "" })}>
            Limpiar filtros
          </button>
        </form>
      </article>

      <article className="card">
        <h3>Alta de servicio logistico</h3>
        <form className="inline-form" onSubmit={handleSubmit}>
          <select value={form.tenant_id} onChange={(e) => setForm((p) => ({ ...p, tenant_id: Number(e.target.value) }))} required>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
          <select value={form.service_type} onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}>
            <option value="recoleccion">Recoleccion</option>
            <option value="entrega">Entrega</option>
            <option value="ambos">Ambos</option>
            <option value="resguardo">Resguardo</option>
          </select>
          <input placeholder="Origen" value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} required />
          <input placeholder="Destino" value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} required />
          <input type="number" step="0.1" placeholder="Kilometros" value={form.kilometers} onChange={(e) => setForm((p) => ({ ...p, kilometers: Number(e.target.value) }))} />
          <input type="number" step="0.01" placeholder="Costo unitario" value={form.unit_cost} onChange={(e) => setForm((p) => ({ ...p, unit_cost: Number(e.target.value) }))} />
          <input type="number" step="0.01" placeholder="IVA" value={form.iva} onChange={(e) => setForm((p) => ({ ...p, iva: Number(e.target.value) }))} />
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="pendiente">Pendiente</option>
            <option value="programado">Programado</option>
            <option value="facturable">Facturable</option>
            <option value="pendiente_pago">Pendiente pago</option>
            <option value="pagado">Pagado</option>
          </select>
          <input type="datetime-local" value={form.service_date} onChange={(e) => setForm((p) => ({ ...p, service_date: e.target.value }))} />
          <input placeholder="Observaciones" value={form.observations} onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))} />
          <input placeholder="Resumen facturacion" value={form.billing_summary} onChange={(e) => setForm((p) => ({ ...p, billing_summary: e.target.value }))} />
          <p className="muted">Subtotal estimado: ${formSubtotal.toLocaleString("es-MX")} | Total estimado: ${formTotal.toLocaleString("es-MX")}</p>
          <button className="button" type="submit" disabled={saving || !form.tenant_id}>
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar servicio"}
          </button>
          {editingId ? (
            <button
              className="button button-outline"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm((prev) => ({ ...defaultForm, tenant_id: prev.tenant_id }));
              }}
            >
              Cancelar edicion
            </button>
          ) : null}
        </form>
      </article>

      <article className="card">
        <h3>Listado por marca</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Marca</th>
                <th>Tipo</th>
                <th>Ruta</th>
                <th>Kilometros</th>
                <th>Costo unitario</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Estatus</th>
                <th>Total</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {services.map((row) => {
                const tenant = tenants.find((item) => item.id === row.tenant_id);
                return (
                  <tr key={row.id} onClick={() => setSelected(row)}>
                    <td>{new Date(row.service_date).toLocaleString("es-MX")}</td>
                    <td>{tenant?.name ?? row.tenant_id}</td>
                    <td>{row.service_type}</td>
                    <td>{row.origin} {"->"} {row.destination}</td>
                    <td>{Number(row.kilometers).toLocaleString("es-MX")}</td>
                    <td>{row.currency} {Number(row.unit_cost).toLocaleString("es-MX")}</td>
                    <td>{row.currency} {Number(row.subtotal).toLocaleString("es-MX")}</td>
                    <td>{row.currency} {Number(row.iva).toLocaleString("es-MX")}</td>
                    <td>{row.status}</td>
                    <td>{row.currency} {Number(row.total).toLocaleString("es-MX")}</td>
                    <td className="row-gap">
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          startEdit(row);
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="button button-outline" onClick={() => createCollectionLink(row, "stripe")}>
                        Cobro Stripe Link
                      </button>
                      <button type="button" className="button button-outline" onClick={() => createCollectionLink(row, "mercadopago")}>
                        Cobro Mercado Pago
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {selected ? (
        <article className="card">
          <h3>Detalle de servicio #{selected.id}</h3>
          <p>Marca: {tenants.find((item) => item.id === selected.tenant_id)?.name ?? selected.tenant_id}</p>
          <p>Tipo: {selected.service_type}</p>
          <p>Origen: {selected.origin}</p>
          <p>Destino: {selected.destination}</p>
          <p>Kilometros: {Number(selected.kilometers).toLocaleString("es-MX")}</p>
          <p>Subtotal: {selected.currency} {Number(selected.subtotal).toLocaleString("es-MX")}</p>
          <p>IVA: {selected.currency} {Number(selected.iva).toLocaleString("es-MX")}</p>
          <p>Total: {selected.currency} {Number(selected.total).toLocaleString("es-MX")}</p>
          <p>Resumen facturacion: {selected.billing_summary || "Sin resumen"}</p>
          <p>Observaciones: {selected.observations || "Sin observaciones"}</p>
          <button className="button button-outline" type="button" onClick={() => setSelected(null)}>
            Cerrar detalle
          </button>
        </article>
      ) : null}
    </section>
  );
}
