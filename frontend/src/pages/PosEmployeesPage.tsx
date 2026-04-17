import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PosEmployee, PosLocation } from "../types/domain";

export function PosEmployeesPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [locationId, setLocationId] = useState(0);
  const [employees, setEmployees] = useState<PosEmployee[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_name: "cajero",
  });

  const loadLocations = async () => {
    if (!token) return;
    const rows = await api.getPosLocations(token, tenantId);
    setLocations(rows);
    setLocationId((previous) => previous || rows[0]?.id || 0);
  };

  const loadEmployees = async (targetLocationId: number) => {
    if (!token || !targetLocationId) return;
    setEmployees(await api.getPosEmployeesByLocation(token, targetLocationId));
  };

  useEffect(() => {
    void loadLocations();
  }, [token, tenantId]);

  useEffect(() => {
    if (!locationId) return;
    void loadEmployees(locationId);
  }, [locationId, token]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !locationId) return;
    await api.createPosEmployee(token, {
      tenant_id: tenantId,
      pos_location_id: locationId,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      role_name: form.role_name,
      is_active: true,
    });
    setForm({ full_name: "", email: "", phone: "", role_name: "cajero" });
    await loadEmployees(locationId);
  };

  const update = async (employee: PosEmployee, payload: Record<string, unknown>) => {
    if (!token) return;
    setSavingId(employee.id);
    try {
      await api.updatePosEmployee(token, employee.id, payload);
      await loadEmployees(locationId);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section>
      <PageHeader title="POS Empleados" subtitle="Operacion de personal por ubicacion para caja y webapp." />
      <div className="inline-form">
        <label>
          Ubicacion
          <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="inline-form" onSubmit={create}>
        <input
          required
          placeholder="Nombre completo"
          value={form.full_name}
          onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
        />
        <input
          required
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          placeholder="Telefono"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <input
          placeholder="Rol"
          value={form.role_name}
          onChange={(e) => setForm((prev) => ({ ...prev, role_name: e.target.value }))}
        />
        <button className="button" type="submit" disabled={!locationId}>
          Crear empleado
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.full_name}</td>
              <td>{employee.email}</td>
              <td>{employee.role_name}</td>
              <td>{employee.is_active ? "Si" : "No"}</td>
              <td>
                <button
                  className="button button-outline"
                  type="button"
                  disabled={savingId === employee.id}
                  onClick={() => void update(employee, { is_active: !employee.is_active })}
                >
                  {employee.is_active ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
          {!employees.length ? (
            <tr>
              <td colSpan={6}>No hay empleados para la ubicacion seleccionada.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
