import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { AddonModuleAccessCard } from "../components/AddonModuleAccessCard";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { Appointment, BrandAdminSettings, Tenant } from "../types/domain";

const STATUS_OPTIONS = [
  { value: "pending", label: "pendiente" },
  { value: "notified", label: "notificada" },
  { value: "confirmed", label: "confirmada" },
  { value: "attended", label: "asistio" },
  { value: "completed", label: "cerrada" },
  { value: "cancelled", label: "cancelada" },
];

export function AppointmentsAdminPage() {
  const { token, user } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const isSuperAdmin = user?.role === "reinpia_admin" || user?.role === "super_admin";
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandAdminSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      const preferred = scopedTenantId && list.some((item) => item.id === scopedTenantId) ? scopedTenantId : list[0]?.id ?? null;
      setTenantId((prev) => prev ?? preferred);
    });
  }, [token, scopedTenantId]);

  const load = async (selectedTenantId: number) => {
    if (!token) return;
    setAppointments(await api.getAppointmentsByTenant(token, selectedTenantId));
  };

  const loadBrand = async (selectedTenantId: number) => {
    if (!token) return;
    const settings = await api.getBrandAdminSettings(token, selectedTenantId).catch(() => null);
    setBrandSettings(settings);
  };

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([load(tenantId), loadBrand(tenantId)]).catch((err) =>
      setError(err instanceof Error ? err.message : "No fue posible cargar citas")
    );
  }, [tenantId, token]);

  const allowOperational = Boolean(isSuperAdmin || brandSettings?.feature_workday_enabled);

  const updateStatus = async (item: Appointment, status: string) => {
    if (!token || !tenantId || !allowOperational) return;
    await api.updateAppointmentStatus(token, item.id, { status });
    await load(tenantId);
  };

  const markNotified = async (item: Appointment) => {
    await updateStatus(item, "notified");
  };

  const confirmReceived = async (item: Appointment) => {
    if (!token || !tenantId || !allowOperational) return;
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
      <PageHeader title="Jornada laboral y citas" subtitle="Modulo add-on para operacion de agenda, seguimiento y cumplimiento." />
      <ModuleOnboardingCard
        moduleKey="appointments"
        title="Jornada laboral"
        whatItDoes="Centraliza citas normales y de regalo con su estado operativo."
        whyItMatters="Mejora confirmacion de asistencia y reduce cancelaciones por falta de seguimiento."
        whatToCapture={["Fecha y hora", "Solicitante y beneficiario", "Mensaje/instrucciones", "Estado de la cita"]}
        impact="Permite una experiencia de servicio mas ordenada y medible."
      />
      {error ? <p className="error">{error}</p> : null}
      {tenantId && brandSettings ? (
        <AddonModuleAccessCard
          tenantId={tenantId}
          moduleKey="workday"
          moduleName="Jornada laboral"
          description="Gestiona agenda operativa, seguimiento de citas y cumplimiento por equipo."
          benefits={[
            "Control de agenda por marca y equipo",
            "Seguimiento completo de estados de cita",
            "Mejor trazabilidad de atencion y servicio",
          ]}
          status={brandSettings.addon_workday_status}
          plan={brandSettings.addon_workday_plan}
          scopeBranchIds={brandSettings.addon_workday_scope_branch_ids}
          allowOperational={allowOperational}
          onUpdated={async () => {
            if (tenantId) await loadBrand(tenantId);
          }}
        />
      ) : null}
      <article className="card">
        <h3>Marca</h3>
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))} disabled={!isSuperAdmin}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </article>
      {!allowOperational ? (
        <article className="card">
          <h3>Modulo disponible con activacion comercial</h3>
          <p>
            Este modulo requiere contratacion para habilitar funciones operativas. Puedes solicitar activacion desde el CTA.
          </p>
        </article>
      ) : null}

      {allowOperational ? (
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
                    <select value={item.status} onChange={(e) => void updateStatus(item, e.target.value)}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="row-gap">
                    <button className="button button-outline" type="button" onClick={() => void markNotified(item)}>Marcar notificada</button>
                    <button className="button button-outline" type="button" onClick={() => void confirmReceived(item)}>Confirmar recibido</button>
                    <button className="button button-outline" type="button" onClick={() => void markAttended(item)}>Confirmar asistencia</button>
                    <button className="button button-outline" type="button" onClick={() => void closeAppointment(item)}>Cerrar cita</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
