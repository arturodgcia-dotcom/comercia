import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { AdminUser } from "../types/domain";

type UserForm = {
  email: string;
  full_name: string;
  role: string;
  password: string;
  preferred_language: string;
  is_active: boolean;
};

const emptyForm: UserForm = {
  email: "",
  full_name: "",
  role: "brand_operator",
  password: "",
  preferred_language: "es",
  is_active: true,
};

export function UsersAdminPage() {
  const { token, user } = useAuth();
  const { mode, isGlobalAdmin, tenantId } = useAdminContextScope();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<UserForm>>({});

  const isGlobalView = mode === "global" && isGlobalAdmin;
  const canManage = ["reinpia_admin", "super_admin", "tenant_admin", "brand_admin"].includes(user?.role ?? "");

  const roleOptions = useMemo(() => {
    if (isGlobalView) return ["super_admin", "contador", "soporte", "comercial", "operaciones"];
    return ["client_admin", "brand_admin", "brand_operator", "brand_support_viewer"];
  }, [isGlobalView]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, role: roleOptions[0] ?? "brand_operator" }));
  }, [roleOptions]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const scope = isGlobalView ? "global" : "brand";
      const data = await api.getAdminUsers(token, { scope, tenant_id: isGlobalView ? undefined : tenantId ?? undefined });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, isGlobalView, tenantId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !canManage) return;
    try {
      setSaving(true);
      setError("");
      const scope = isGlobalView ? "global" : "brand";
      await api.createAdminUser(token, { scope, tenant_id: isGlobalView ? undefined : tenantId ?? undefined }, form);
      setForm({ ...emptyForm, role: roleOptions[0] ?? "brand_operator" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: AdminUser) => {
    setEditingId(item.id);
    setEditDraft({
      full_name: item.full_name,
      role: item.role,
      preferred_language: item.preferred_language ?? "es",
      is_active: item.is_active,
      password: "",
    });
  };

  const saveEdit = async () => {
    if (!token || !editingId || !canManage) return;
    try {
      setSaving(true);
      setError("");
      const scope = isGlobalView ? "global" : "brand";
      await api.updateAdminUser(token, editingId, { scope, tenant_id: isGlobalView ? undefined : tenantId ?? undefined }, editDraft);
      setEditingId(null);
      setEditDraft({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible actualizar usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title={isGlobalView ? "Usuarios internos de plataforma" : "Usuarios de la marca"}
        subtitle={
          isGlobalView
            ? "Gestiona usuarios internos de ComerCia y su rol global."
            : "Administra usuarios de la marca activa sin exponer cuentas globales."
        }
      />
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Cargando usuarios...</p> : null}

      {!loading && canManage ? (
        <form className="detail-form card" onSubmit={handleCreate}>
          <h3>Alta de usuario</h3>
          <label>
            Nombre completo
            <input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} required />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Rol
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contraseña temporal
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <label>
            Idioma preferido
            <select value={form.preferred_language} onChange={(event) => setForm((prev) => ({ ...prev, preferred_language: event.target.value }))}>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Usuario activo
          </label>
          <button className="button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear usuario"}
          </button>
        </form>
      ) : null}

      {!loading && !items.length ? (
        <div className="card">
          <h3>Sin usuarios registrados</h3>
          <p className="muted">
            {isGlobalView
              ? "Aún no hay usuarios internos creados para la plataforma."
              : "Aún no hay usuarios creados para esta marca."}
          </p>
        </div>
      ) : null}

      {!loading && items.length ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Idioma</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const editing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      {editing ? (
                        <input
                          value={editDraft.full_name ?? ""}
                          onChange={(event) => setEditDraft((prev) => ({ ...prev, full_name: event.target.value }))}
                        />
                      ) : (
                        item.full_name
                      )}
                    </td>
                    <td>{item.email}</td>
                    <td>
                      {editing ? (
                        <select value={editDraft.role ?? item.role} onChange={(event) => setEditDraft((prev) => ({ ...prev, role: event.target.value }))}>
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        item.role
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={Boolean(editDraft.is_active)}
                            onChange={(event) => setEditDraft((prev) => ({ ...prev, is_active: event.target.checked }))}
                          />
                          Activo
                        </label>
                      ) : item.is_active ? (
                        "Activo"
                      ) : (
                        "Inactivo"
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <select
                          value={editDraft.preferred_language ?? item.preferred_language ?? "es"}
                          onChange={(event) => setEditDraft((prev) => ({ ...prev, preferred_language: event.target.value }))}
                        >
                          <option value="es">es</option>
                          <option value="en">en</option>
                          <option value="pt">pt</option>
                        </select>
                      ) : (
                        item.preferred_language
                      )}
                    </td>
                    <td>
                      {canManage ? (
                        editing ? (
                          <div className="row-gap">
                            <button className="button" type="button" onClick={saveEdit} disabled={saving}>
                              Guardar
                            </button>
                            <button className="button button-outline" type="button" onClick={() => setEditingId(null)}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button className="button button-outline" type="button" onClick={() => startEdit(item)}>
                            Editar
                          </button>
                        )
                      ) : (
                        <span className="muted">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
