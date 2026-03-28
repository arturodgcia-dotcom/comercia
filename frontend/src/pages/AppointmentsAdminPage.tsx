import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Appointment, Tenant } from "../types/domain";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

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

  const confirmReceived = async (item: Appointment) => {
    if (!token || !tenantId) return;
    await api.confirmAppointmentReceived(token, item.id);
    await load(tenantId);
  };

  return (
    <section>
      <PageHeader title="Appointments" subtitle="Citas por tenant, estado y confirmacion de instrucciones." />
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
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Regalo</th>
            <th>Instrucciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.scheduled_for ? new Date(item.scheduled_for).toLocaleString("es-MX") : "-"}</td>
              <td>{item.status}</td>
              <td>{item.is_gift ? "Si" : "No"}</td>
              <td>{item.instructions_sent_at ? "Enviadas" : "Pendiente"}</td>
              <td className="row-gap">
                <select value={item.status} onChange={(e) => updateStatus(item, e.target.value)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button className="button button-outline" type="button" onClick={() => confirmReceived(item)}>
                  Confirmar recibido
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

