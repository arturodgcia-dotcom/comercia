import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Appointment, Tenant } from "../types/domain";

const STATUS_OPTIONS = [
  { value: "pending", label: "pendiente" },
  { value: "notified", label: "notificada" },
  { value: "confirmed", label: "confirmada" },
  { value: "attended", label: "asistio" },
  { value: "completed", label: "cerrada" },
  { value: "cancelled", label: "cancelada" },
];

export function AppointmentsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId((prev) => prev ?? list[0]?.id ?? null);
    });
  }, [token]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    setAppointments(await api.getAppointmentsByTenant(token, selectedTenantId));
  };

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar citas"));
  }, [tenantId, token]);

  const updateStatus = async (item: Appointment, status: string) => {
    if (!token || !tenantId) return;
    await api.updateAppointmentStatus(token, item.id, { status });
    await load(tenantId);
  };

  const markNotified = async (item: Appointment) => {
    await updateStatus(item, "notified");
  };

  const confirmReceived = async (item: Appointment) => {
    if (!token || !tenantId) return;
    await api.confirmAppointmentReceived(token, item.id);
    await load(tenantId);
  };

  const markAttended = async (item: Appointment) => {
    await updateStatus(item, "attended");
  };

  const closeAppointment = async (item: Appointment) => {
    await updateStatus(item, "completed");
  };

  return (
    <section>
      <PageHeader title="Citas y servicios" subtitle="Seguimiento de solicitudes, regalos y confirmaciones operativas." />
      {error ? <p className="error">{error}</p> : null}
      <article className="card">
        <h3>Marca</h3>
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </article>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Solicitante</th>
              <th>Regalo</th>
              <th>Mensaje</th>
              <th>Instrucciones</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((item) => (
              <tr key={item.id}>
                <td>{item.scheduled_for ? new Date(item.scheduled_for).toLocaleString("es-MX") : "Sin fecha"}</td>
                <td>
                  Cliente #{item.customer_id ?? "N/A"}
                  <br />
                  {item.gift_sender_name ? `Remitente: ${item.gift_sender_name}` : "Compra para si mismo"}
                  <br />
                  {item.gift_recipient_name ? `Destinatario: ${item.gift_recipient_name}` : "Sin destinatario"}
                </td>
                <td>
                  {item.is_gift ? "Si" : "No"}
                  {item.gift_is_anonymous ? " (anonimo)" : ""}
                </td>
                <td>{item.gift_message ?? "Sin mensaje"}</td>
                <td>{item.instructions_sent_at ? "Enviadas" : "Pendiente"}</td>
                <td>
                  <select value={item.status} onChange={(e) => updateStatus(item, e.target.value)}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="row-gap">
                  <button className="button button-outline" type="button" onClick={() => markNotified(item)}>Marcar notificada</button>
                  <button className="button button-outline" type="button" onClick={() => confirmReceived(item)}>Confirmar recibido</button>
                  <button className="button button-outline" type="button" onClick={() => markAttended(item)}>Confirmar asistencia</button>
                  <button className="button button-outline" type="button" onClick={() => closeAppointment(item)}>Cerrar cita</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
