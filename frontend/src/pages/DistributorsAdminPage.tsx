import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { DistributorEmployee, DistributorProfile, Tenant } from "../types/domain";

export function DistributorsAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<DistributorProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<DistributorEmployee[]>([]);
  const [error, setError] = useState("");
  const [employeeForm, setEmployeeForm] = useState({ full_name: "", email: "", phone: "", role_name: "" });

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((rows) => {
      setTenants(rows);
      setTenantId((prev) => prev ?? rows[0]?.id ?? null);
    });
  }, [token]);

  const loadProfiles = async (selectedTenantId: number) => {
    if (!token) return;
    const rows = await api.getDistributorsByTenant(token, selectedTenantId);
    setProfiles(rows);
    setSelectedProfileId((prev) => prev ?? rows[0]?.id ?? null);
  };

  const loadEmployees = async (profileId: number) => {
    if (!token) return;
    setEmployees(await api.getDistributorEmployees(token, profileId));
  };

  useEffect(() => {
    if (!tenantId) return;
    loadProfiles(tenantId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [tenantId, token]);

  useEffect(() => {
    if (!selectedProfileId) return;
    loadEmployees(selectedProfileId).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar empleados"));
  }, [selectedProfileId, token]);

  const selectedProfile = useMemo(() => profiles.find((item) => item.id === selectedProfileId) ?? null, [profiles, selectedProfileId]);

  const addEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId || !selectedProfileId) return;
    await api.createDistributorEmployee(token, {
      tenant_id: tenantId,
      distributor_profile_id: selectedProfileId,
      full_name: employeeForm.full_name,
      email: employeeForm.email,
      phone: employeeForm.phone || undefined,
      role_name: employeeForm.role_name || undefined,
      is_active: true,
    });
    setEmployeeForm({ full_name: "", email: "", phone: "", role_name: "" });
    await loadEmployees(selectedProfileId);
  };

  return (
    <section>
      <PageHeader title="Distribuidores" subtitle="Canal comercial por marca con empleados, autorizacion y estatus operativo." />
      <ModuleOnboardingCard
        moduleKey="distributors"
        title="Canal distribuidores"
        whatItDoes="Controla distribuidores autorizados, su estatus comercial y equipo asignado."
        whyItMatters="Permite separar el canal B2B del publico y escalar ventas con control."
        whatToCapture={["Datos de contacto", "Autorizacion comercial", "Empleados del distribuidor", "Notas de entrega"]}
        impact="Mejora seguimiento comercial y reduce errores en pedidos de canal mayorista."
      />
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

      <article className="card">
        <h3>Distribuidores registrados</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Distribuidor</th>
                <th>Contacto</th>
                <th>Autorizacion</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  style={{ cursor: "pointer", background: selectedProfileId === profile.id ? "#f4f9ff" : "transparent" }}
                >
                  <td>{profile.id}</td>
                  <td>{profile.business_name}</td>
                  <td>
                    {profile.contact_name}
                    <br />
                    {profile.email}
                    <br />
                    {profile.phone}
                  </td>
                  <td>{profile.is_authorized ? "Autorizado" : "Pendiente"}</td>
                  <td>{profile.can_purchase_wholesale ? "Compra mayorista activa" : "Sin compra mayorista"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.length === 0 ? <p>Aun no hay distribuidores para esta marca. Aqui veras altas, autorizaciones y equipo asociado.</p> : null}
      </article>

      {selectedProfile ? (
        <>
          <article className="card">
            <h3>Detalle de distribuidor seleccionado</h3>
            <p>Negocio: {selectedProfile.business_name}</p>
            <p>Contacto: {selectedProfile.contact_name} | {selectedProfile.email}</p>
            <p>Telefono: {selectedProfile.phone ?? "Sin telefono"}</p>
            <p>Autorizacion: {selectedProfile.is_authorized ? "Activa" : "Pendiente"}</p>
            <p>Notas entrega: {selectedProfile.delivery_notes ?? "Sin notas"}</p>
          </article>

          <article className="card">
            <h3>Agregar empleado asociado</h3>
            <form className="inline-form" onSubmit={addEmployee}>
              <input required placeholder="Nombre" value={employeeForm.full_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, full_name: e.target.value }))} />
              <input required placeholder="Correo" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} />
              <input placeholder="Telefono" value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} />
              <input placeholder="Puesto" value={employeeForm.role_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, role_name: e.target.value }))} />
              <button className="button" type="submit">Agregar empleado</button>
            </form>
          </article>

          <article className="card">
            <h3>Empleados del distribuidor</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Puesto</th>
                    <th>Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.full_name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.role_name ?? "-"}</td>
                      <td>{employee.is_active ? "Si" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
