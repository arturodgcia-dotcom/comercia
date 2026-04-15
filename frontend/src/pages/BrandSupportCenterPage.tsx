import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { SupportOverview, SupportTicket, Tenant } from "../types/domain";

const STATUS_OPTIONS = ["nuevo", "en revision", "pendiente de cliente", "resuelto", "cerrado"];

export function BrandSupportCenterPage() {
  const { token } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const [overview, setOverview] = useState<SupportOverview | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [ticketForm, setTicketForm] = useState({
    asunto: "",
    descripcion: "",
    categoria: "operacion",
    prioridad: "media",
    correo_contacto: "",
    telefono_whatsapp: "",
  });
  const [statusDraft, setStatusDraft] = useState<{ estado: string; respuesta: string; responsable: string }>({
    estado: "nuevo",
    respuesta: "",
    responsable: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedBrand = useMemo(() => tenants.find((x) => x.id === scopedTenantId) ?? null, [scopedTenantId, tenants]);
  const selectedTicket = useMemo(() => tickets.find((x) => x.id === selectedTicketId) ?? null, [selectedTicketId, tickets]);

  const load = async (tenantId: number) => {
    if (!token) return;
    const [overviewData, ticketRows, tenantRows] = await Promise.all([
      api.getSupportOverview(token, tenantId),
      api.getSupportTickets(token, tenantId),
      api.getTenants(token).catch(() => []),
    ]);
    setOverview(overviewData);
    setTickets(ticketRows);
    setTenants(tenantRows);
    setSelectedTicketId((prev) => prev ?? ticketRows[0]?.id ?? null);
    if (!ticketForm.correo_contacto) {
      setTicketForm((prev) => ({ ...prev, correo_contacto: "soporte@cliente.com" }));
    }
  };

  useEffect(() => {
    if (!scopedTenantId) return;
    load(scopedTenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar soporte."));
  }, [scopedTenantId, token]);

  useEffect(() => {
    if (!selectedTicket) return;
    setStatusDraft({
      estado: selectedTicket.estado,
      respuesta: selectedTicket.respuesta || "",
      responsable: selectedTicket.responsable || "",
    });
  }, [selectedTicket]);

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !scopedTenantId) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.createSupportTicket(token, scopedTenantId, {
        tenant_id: scopedTenantId,
        asunto: ticketForm.asunto,
        descripcion: ticketForm.descripcion,
        categoria: ticketForm.categoria,
        prioridad: ticketForm.prioridad,
        marca_relacionada: selectedBrand?.name || `Marca #${scopedTenantId}`,
        correo_contacto: ticketForm.correo_contacto,
        telefono_whatsapp: ticketForm.telefono_whatsapp || null,
      });
      setTicketForm((prev) => ({ ...prev, asunto: "", descripcion: "", telefono_whatsapp: "" }));
      setMessage("Ticket creado correctamente.");
      await load(scopedTenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear ticket.");
    } finally {
      setSaving(false);
    }
  };

  const onUploadAttachment = async (file: File | null) => {
    if (!token || !selectedTicketId || !file || !scopedTenantId) return;
    try {
      setSaving(true);
      setError("");
      await api.uploadSupportTicketAttachment(token, selectedTicketId, file);
      setMessage("Adjunto cargado.");
      await load(scopedTenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible subir adjunto.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!token || !selectedTicketId || !scopedTenantId) return;
    try {
      setSaving(true);
      setError("");
      await api.updateSupportTicketStatus(token, selectedTicketId, statusDraft);
      setMessage("Estado de ticket actualizado.");
      await load(scopedTenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar ticket.");
    } finally {
      setSaving(false);
    }
  };

  const sendChat = async () => {
    if (!token || !selectedTicketId || !scopedTenantId || !chatMessage.trim()) return;
    try {
      setSaving(true);
      setError("");
      const result = await api.sendSupportChatMessage(token, selectedTicketId, chatMessage.trim());
      setChatMessage("");
      setMessage(result.response);
      await load(scopedTenantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar mensaje al chat IA.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader title="Soporte" subtitle="Tickets, adjuntos, historial y chat IA de soporte según tu plan." />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {!scopedTenantId ? <p className="error">Selecciona una marca activa para usar soporte.</p> : null}

      <article className="card">
        <h3>Soporte por plan</h3>
        <p><strong>Plan:</strong> {overview?.plan_tier || "basic"}</p>
        <p><strong>Canal:</strong> {overview?.support_channel || "ticket y correo"}</p>
        <p><strong>Correo oficial:</strong> {overview?.official_email || "soporte@comercia.mx"}</p>
        <p>{overview?.human_escalation_hint || "Escalamiento disponible según plan."}</p>
      </article>

      <article className="card">
        <h3>Crear ticket</h3>
        <form className="detail-form" onSubmit={createTicket}>
          <label>Asunto<input required value={ticketForm.asunto} onChange={(e) => setTicketForm((p) => ({ ...p, asunto: e.target.value }))} /></label>
          <label>Descripcion<textarea required rows={4} value={ticketForm.descripcion} onChange={(e) => setTicketForm((p) => ({ ...p, descripcion: e.target.value }))} /></label>
          <label>Categoria
            <select value={ticketForm.categoria} onChange={(e) => setTicketForm((p) => ({ ...p, categoria: e.target.value }))}>
              <option value="operacion">Operacion</option>
              <option value="pagos">Pagos</option>
              <option value="integraciones">Integraciones</option>
              <option value="respuestas_y_atencion">Respuestas y atencion</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label>Prioridad
            <select value={ticketForm.prioridad} onChange={(e) => setTicketForm((p) => ({ ...p, prioridad: e.target.value }))}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>
          <label>Correo de contacto<input required type="email" value={ticketForm.correo_contacto} onChange={(e) => setTicketForm((p) => ({ ...p, correo_contacto: e.target.value }))} /></label>
          <label>Telefono / WhatsApp<input value={ticketForm.telefono_whatsapp} onChange={(e) => setTicketForm((p) => ({ ...p, telefono_whatsapp: e.target.value }))} /></label>
          <button className="button" type="submit" disabled={saving}>Crear ticket</button>
        </form>
      </article>

      <article className="card">
        <h3>Historial de tickets</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Respuesta</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} style={{ cursor: "pointer", background: selectedTicketId === ticket.id ? "#f4f9ff" : "transparent" }}>
                  <td>{ticket.id}</td>
                  <td>{new Date(ticket.created_at).toLocaleString("es-MX")}</td>
                  <td>{ticket.asunto}</td>
                  <td>{ticket.estado}</td>
                  <td>{ticket.respuesta || "-"}</td>
                  <td>{ticket.responsable || "-"}</td>
                </tr>
              ))}
              {!tickets.length ? (
                <tr>
                  <td colSpan={6}>Sin tickets para esta marca.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      {selectedTicket ? (
        <article className="card">
          <h3>Detalle ticket #{selectedTicket.id}</h3>
          <p><strong>Asunto:</strong> {selectedTicket.asunto}</p>
          <p><strong>Descripcion:</strong> {selectedTicket.descripcion}</p>
          <label>Adjuntar evidencia (imagen, PDF, captura o archivo simple)
            <input type="file" onChange={(e) => onUploadAttachment(e.target.files?.[0] ?? null)} />
          </label>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Adjunto</th><th>Fecha</th></tr></thead>
              <tbody>
                {selectedTicket.attachments.map((item) => (
                  <tr key={item.id}><td>{item.file_name}</td><td>{new Date(item.uploaded_at).toLocaleString("es-MX")}</td></tr>
                ))}
                {!selectedTicket.attachments.length ? <tr><td colSpan={2}>Sin adjuntos.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <div className="detail-form">
            <label>Estado
              <select value={statusDraft.estado} onChange={(e) => setStatusDraft((p) => ({ ...p, estado: e.target.value }))}>
                {STATUS_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
            <label>Respuesta<textarea rows={3} value={statusDraft.respuesta} onChange={(e) => setStatusDraft((p) => ({ ...p, respuesta: e.target.value }))} /></label>
            <label>Responsable<input value={statusDraft.responsable} onChange={(e) => setStatusDraft((p) => ({ ...p, responsable: e.target.value }))} /></label>
            <button className="button button-outline" type="button" onClick={updateStatus} disabled={saving}>Actualizar estado</button>
          </div>

          {overview?.chat_enabled ? (
            <article className="card">
              <h4>Chat IA de soporte</h4>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Rol</th><th>Mensaje</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {selectedTicket.mensajes.map((row) => (
                      <tr key={row.id}>
                        <td>{row.role}</td>
                        <td>{row.message}</td>
                        <td>{new Date(row.created_at).toLocaleString("es-MX")}</td>
                      </tr>
                    ))}
                    {!selectedTicket.mensajes.length ? <tr><td colSpan={3}>Sin mensajes en chat.</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <div className="row-gap">
                <input placeholder="Escribe tu consulta..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                <button className="button" type="button" onClick={sendChat} disabled={saving || !chatMessage.trim()}>Enviar al chat IA</button>
              </div>
              <p className="muted">Si el chat no resuelve, se prepara escalamiento a humano.</p>
            </article>
          ) : (
            <p className="muted">Tu plan actual usa soporte por ticket/correo. Para chat IA de soporte considera Growth o Premium.</p>
          )}
        </article>
      ) : null}
    </section>
  );
}
