import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { AdminUser, RoleCatalogEntry, UserRoleAssignmentEntry } from "../types/domain";

export function ReinpiaRolesPermissionsPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<RoleCatalogEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [assignments, setAssignments] = useState<UserRoleAssignmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState<number>(0);
  const [roleKey, setRoleKey] = useState<string>("");
  const [scope, setScope] = useState<"global" | "client" | "brand">("global");
  const [tenantId, setTenantId] = useState<number | "">("");

  const roleOptions = useMemo(
    () => roles.filter((role) => role.scope === scope || (scope === "brand" && role.scope === "client")),
    [roles, scope]
  );

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [rolesResponse, usersResponse, assignmentsResponse] = await Promise.all([
        api.getRoleCatalog(token),
        api.getAdminUsers(token, { scope: "global" }),
        api.getUserRoleAssignments(token),
      ]);
      setRoles(rolesResponse);
      setUsers(usersResponse);
      setAssignments(assignmentsResponse);
      if (!roleKey && rolesResponse.length) {
        const preferred = rolesResponse.find((item) => item.scope === "global") ?? rolesResponse[0];
        setRoleKey(preferred.role_key);
      }
      if (!userId && usersResponse.length) {
        setUserId(usersResponse[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el módulo de roles y permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  useEffect(() => {
    if (!roleOptions.length) return;
    if (!roleOptions.some((item) => item.role_key === roleKey)) {
      setRoleKey(roleOptions[0].role_key);
    }
  }, [roleOptions, roleKey]);

  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !userId || !roleKey) return;
    try {
      setSaving(true);
      setError("");
      await api.createUserRoleAssignment(token, {
        user_id: userId,
        role_key: roleKey,
        scope,
        tenant_id: scope === "global" ? null : Number(tenantId) || null,
        is_primary: true,
        is_active: true,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible asignar el rol.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Roles y permisos"
        subtitle="Gestiona el catálogo de roles y asignaciones base para acceso global y de marca."
      />
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Cargando roles y permisos...</p> : null}

      {!loading ? (
        <>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <article className="card">
              <h3>Catálogo de roles</h3>
              {!roles.length ? <p className="muted">No hay roles registrados.</p> : null}
              {roles.map((role) => (
                <div key={role.id} style={{ borderBottom: "1px solid #22324f", padding: "12px 0" }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{role.display_name} <span className="muted">({role.role_key})</span></p>
                  <p className="muted" style={{ marginTop: 4 }}>Alcance: {role.scope}</p>
                  <p className="muted" style={{ marginTop: 4 }}>
                    Permisos: {role.permissions.map((permission) => permission.display_name).join(", ") || "Sin permisos asociados"}
                  </p>
                </div>
              ))}
            </article>

            <article className="card">
              <h3>Asignar rol</h3>
              <form className="detail-form" onSubmit={handleAssign}>
                <label>
                  Usuario
                  <select value={userId} onChange={(event) => setUserId(Number(event.target.value))}>
                    {users.map((item) => (
                      <option key={item.id} value={item.id}>{item.full_name} ({item.email})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Alcance
                  <select value={scope} onChange={(event) => setScope(event.target.value as "global" | "client" | "brand")}>
                    <option value="global">Global</option>
                    <option value="client">Cliente principal</option>
                    <option value="brand">Marca</option>
                  </select>
                </label>
                {scope !== "global" ? (
                  <label>
                    ID de marca (tenant)
                    <input
                      type="number"
                      value={tenantId}
                      onChange={(event) => setTenantId(event.target.value === "" ? "" : Number(event.target.value))}
                      placeholder="Ejemplo: 12"
                    />
                  </label>
                ) : null}
                <label>
                  Rol
                  <select value={roleKey} onChange={(event) => setRoleKey(event.target.value)}>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.role_key}>{role.display_name}</option>
                    ))}
                  </select>
                </label>
                <button className="button" type="submit" disabled={saving || !userId || !roleKey}>
                  {saving ? "Asignando..." : "Asignar rol"}
                </button>
              </form>
            </article>
          </div>

          <article className="card" style={{ marginTop: "16px" }}>
            <h3>Asignaciones recientes</h3>
            {!assignments.length ? <p className="muted">No hay asignaciones registradas.</p> : null}
            {assignments.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Alcance</th>
                      <th>Tenant</th>
                      <th>Principal</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.slice(0, 50).map((row) => (
                      <tr key={row.id}>
                        <td>{row.user_full_name}</td>
                        <td>{row.role_display_name}</td>
                        <td>{row.scope}</td>
                        <td>{row.tenant_id ?? "-"}</td>
                        <td>{row.is_primary ? "Sí" : "No"}</td>
                        <td>{row.is_active ? "Activo" : "Inactivo"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        </>
      ) : null}
    </section>
  );
}
