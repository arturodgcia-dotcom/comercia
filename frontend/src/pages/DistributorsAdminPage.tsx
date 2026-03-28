import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
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
      is_active: true
    });
    setEmployeeForm({ full_name: "", email: "", phone: "", role_name: "" });
    await loadEmployees(selectedProfileId);
  };

  return (
    <section>
      <PageHeader title="Distributors" subtitle="Perfiles autorizados por marca y gestion de empleados." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <select value={selectedProfileId ?? ""} onChange={(e) => setSelectedProfileId(Number(e.target.value))}>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.business_name}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Negocio</th>
            <th>Contacto</th>
            <th>Autorizado</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td>{profile.id}</td>
              <td>{profile.business_name}</td>
              <td>{profile.contact_name}</td>
              <td>{profile.is_authorized ? "Si" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="inline-form" onSubmit={addEmployee}>
        <input
          required
          placeholder="Nombre"
          value={employeeForm.full_name}
          onChange={(e) => setEmployeeForm((p) => ({ ...p, full_name: e.target.value }))}
        />
        <input required placeholder="Email" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} />
        <input placeholder="Telefono" value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} />
        <input placeholder="Rol" value={employeeForm.role_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, role_name: e.target.value }))} />
        <button className="button" type="submit">
          Agregar empleado
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
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
    </section>
  );
}

