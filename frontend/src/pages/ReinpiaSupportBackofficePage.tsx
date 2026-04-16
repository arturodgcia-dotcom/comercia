import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { SupportBackofficeAssignee, SupportBackofficeSummary, SupportBackofficeTicket } from "../types/domain";

const STATUS_OPTIONS = ["nuevo", "pendiente", "en espera cliente", "resuelto", "escalado", "cerrado"];
const PRIORITY_OPTIONS = ["baja", "media", "alta", "urgente"];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function ReinpiaSupportBackofficePage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<SupportBackofficeSummary | null>(null);
  const [assignees, setAssignees] = useState<SupportBackofficeAssignee[]>([]);
  const [tickets, setTickets] = useState<SupportBackofficeTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState<{ estado: string; prioridad: string; responsable_user_id: string; q: string }>({
    estado: "",
    prioridad: "",
    responsable_user_id: "",
    q: "",
  });
  const [editDraft, setEditDraft] = useState<{ estado: string; prioridad: string; responsable_user_id: string; comentario_interno: string }>({
    estado: "pendiente",
    prioridad: "media",
    responsable_user_id: "",
    comentario_interno: "",
  });

  const selectedTicket = useMemo(() => tickets.find((item) => item.id === selectedTicketId) ?? null, [selectedTicketId, tickets]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [summaryData, assigneesData, ticketsData] = await Promise.all([
        api.getSupportBackofficeSummary(token),
        api.getSupportBackofficeAssignees(token),
        api.getSupportBackofficeTickets(token, {
          estado: filters.estado || undefined,
          prioridad: filters.prioridad || undefined,
          responsable_user_id: filters.responsable_user_id ? Number(filters.responsable_user_id) : undefined,
          q: filters.q || undefined,
        }),
      ]);
      setSummary(summaryData);
      setAssignees(assigneesData);
      setTickets(ticketsData);
      setSelectedTicketId((prev) => prev ?? ticketsData[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el centro operativo de soporte.");
      setSummary(null);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, filters.estado, filters.prioridad, filters.responsable_user_id, filters.q]);

  useEffect(() => {
    if (!selectedTicket) return;
    setEditDraft({
      estado: selectedTicket.estado,
      prioridad: selectedTicket.prioridad,
      responsable_user_id: selectedTicket.responsable_user_id ? String(selectedTicket.responsable_user_id) : "",
      comentario_interno: "",
    });
  }, [selectedTicket]);

  const applyUpdate = async () => {
    if (!token || !selectedTicket) return;
    try {
      setSaving(true);
      setError("");
      await api.updateSupportBackofficeTicket(token, selectedTicket.id, {
        estado: editDraft.estado,
        prioridad: editDraft.prioridad,
        responsable_user_id: editDraft.responsable_user_id ? Number(editDraft.responsable_user_id) : null,
        comentario_interno: editDraft.comentario_interno || undefined,
      });
      setMessage("Ticket actualizado correctamente.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar el ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Centro operativo de soporte REINPIA"
        subtitle="Bandeja global para atender clientes, marcas e incidencias con asignación interna y seguimiento SLA."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <div className="card-grid">
        <KpiCard label="Tickets totales" value={summary?.total ?? 0} />
        <KpiCard label="Nuevos" value={summary?.nuevos ?? 0} />
        <KpiCard label="Pendientes" value={summary?.pendientes ?? 0} />
        <KpiCard label="En espera cliente" value={summary?.en_espera_cliente ?? 0} />
        <KpiCard label="Escalados" value={summary?.escalados ?? 0} />
        <KpiCard label="Vencidos SLA" value={summary?.vencidos_sla ?? 0} />
      </div>

      <article className="card">
        <h3>Bandeja operativa</h3>
        <div className="row-gap" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: "12px" }}>
          <label>
            Estado
            <select value={filters.estado} onChange={(event) => setFilters((prev) => ({ ...prev, estado: event.target.value }))}>
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Prioridad
            <select value={filters.prioridad} onChange={(event) => setFilters((prev) => ({ ...prev, prioridad: event.target.value }))}>
              <option value="">Todas</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label>
            Responsable
            <select
              value={filters.responsable_user_id}
              onChange={(event) => setFilters((prev) => ({ ...prev, responsable_user_id: event.target.value }))}
            >
              <option value="">Todos</option>
              {assignees.map((assignee) => (
                <option key={assignee.user_id} value={assignee.user_id}>{assignee.full_name}</option>
              ))}
            </select>
          </label>
          <label>
            Buscar
            <input
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Folio, asunto, marca..."
            />
          </label>
        </div>

        {loading ? <p>Cargando tickets de soporte...</p> : null}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente principal</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Origen</th>
                <th>Abierto</th>
                <th>Sin respuesta</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  style={{ cursor: "pointer", background: selectedTicketId === ticket.id ? "#f4f9ff" : "transparent" }}
                >
                  <td>{ticket.folio ?? `SUP-${String(ticket.id).padStart(6, "0")}`}</td>
                  <td>{ticket.cliente_principal ?? "-"}</td>
                  <td>{ticket.marca ?? "-"}</td>
                  <td>{ticket.categoria}</td>
                  <td>{ticket.prioridad}</td>
                  <td>{ticket.estado}</td>
                  <td>{ticket.responsable ?? "-"}</td>
                  <td>{ticket.origen ?? "-"}</td>
                  <td>{formatMinutes(ticket.tiempo_abierto_min)}</td>
                  <td>{formatMinutes(ticket.tiempo_sin_respuesta_min)}</td>
                  <td>{ticket.vencido_sla ? "Vencido" : "OK"}</td>
                </tr>
              ))}
              {!tickets.length && !loading ? (
                <tr>
                  <td colSpan={11}>No hay tickets para los filtros seleccionados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      {selectedTicket ? (
        <article className="card">
          <h3>Detalle de ticket {selectedTicket.folio ?? `#${selectedTicket.id}`}</h3>
          <p><strong>Asunto:</strong> {selectedTicket.asunto}</p>
          <p><strong>Descripción:</strong> {selectedTicket.descripcion}</p>
          <p><strong>Cliente principal:</strong> {selectedTicket.cliente_principal ?? "-"}</p>
          <p><strong>Plan activo:</strong> {selectedTicket.plan_activo ?? "sin plan registrado"}</p>
          <p><strong>Tickets previos de la marca:</strong> {selectedTicket.total_tickets_previos_marca}</p>

          <div className="detail-form">
            <label>
              Estado
              <select value={editDraft.estado} onChange={(event) => setEditDraft((prev) => ({ ...prev, estado: event.target.value }))}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Prioridad
              <select value={editDraft.prioridad} onChange={(event) => setEditDraft((prev) => ({ ...prev, prioridad: event.target.value }))}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label>
              Responsable interno
              <select
                value={editDraft.responsable_user_id}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, responsable_user_id: event.target.value }))}
              >
                <option value="">Sin asignar</option>
                {assignees.map((assignee) => (
                  <option key={assignee.user_id} value={assignee.user_id}>
                    {assignee.full_name} ({assignee.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comentario interno
              <textarea
                rows={3}
                value={editDraft.comentario_interno}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, comentario_interno: event.target.value }))}
                placeholder="Agrega notas para el equipo interno..."
              />
            </label>
            <button className="button" type="button" onClick={applyUpdate} disabled={saving}>
              {saving ? "Guardando..." : "Actualizar ticket"}
            </button>
          </div>

          <h4>Historial del ticket</h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Actor</th>
                  <th>Nota</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {selectedTicket.timeline.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_type}</td>
                    <td>{event.actor_name ?? "sistema"}</td>
                    <td>{event.note ?? "-"}</td>
                    <td>{new Date(event.created_at).toLocaleString("es-MX")}</td>
                  </tr>
                ))}
                {!selectedTicket.timeline.length ? (
                  <tr>
                    <td colSpan={4}>Sin eventos registrados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <p className="muted">Operador activo: {user?.full_name ?? "N/A"}.</p>
    </section>
  );
}
