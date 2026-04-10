import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { CommercialAccountUsage, CommercialClientAccount, Tenant } from "../types/domain";

type NewAccountForm = {
  legal_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_model: "fixed_subscription" | "commission_based";
  commercial_plan_key: string;
};

const DEFAULT_FORM: NewAccountForm = {
  legal_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  billing_model: "fixed_subscription",
  commercial_plan_key: "fixed_subscription_basic",
};

export function ReinpiaCommercialClientsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<CommercialClientAccount[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [usage, setUsage] = useState<Record<number, CommercialAccountUsage>>({});
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [assignTenantId, setAssignTenantId] = useState<number>(0);
  const [assignAsParent, setAssignAsParent] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [accounts, tenantList] = await Promise.all([
        api.getReinpiaCommercialClientAccounts(token),
        api.getTenants(token),
      ]);
      setRows(accounts);
      setTenants(tenantList);
      const usagePairs = await Promise.all(
        accounts.map(async (account) => [account.id, await api.getReinpiaCommercialClientAccountUsage(token, account.id)] as const)
      );
      setUsage(Object.fromEntries(usagePairs));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar clientes comerciales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const createAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.createReinpiaCommercialClientAccount(token, {
        ...form,
        status: "active",
        commercial_limits_json: "{}",
        addons_json: "{}",
      });
      setForm(DEFAULT_FORM);
      setMessage("Cliente comercial creado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear cliente comercial.");
    } finally {
      setSaving(false);
    }
  };

  const assignTenant = async () => {
    if (!token || !selectedAccount || !assignTenantId) return;
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.assignTenantToCommercialClientAccount(token, selectedAccount, {
        tenant_id: assignTenantId,
        is_parent_brand: assignAsParent,
      });
      setMessage("Marca asignada al cliente comercial.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible asignar marca.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="Clientes Comerciales"
        subtitle="Control de cliente, marca padre/hijas, limites por plan y uso real de recursos."
      />
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {loading ? <p className="muted">Cargando...</p> : null}

      <div className="card-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <article className="card">
          <h3>Alta de cliente comercial</h3>
          <form className="detail-form" onSubmit={createAccount}>
            <label>Razon social / cliente
              <input required value={form.legal_name} onChange={(e) => setForm((p) => ({ ...p, legal_name: e.target.value }))} />
            </label>
            <label>Contacto
              <input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
            </label>
            <label>Correo
              <input type="email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} />
            </label>
            <label>Telefono
              <input value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
            </label>
            <label>Modelo comercial
              <select value={form.billing_model} onChange={(e) => setForm((p) => ({ ...p, billing_model: e.target.value as NewAccountForm["billing_model"] }))}>
                <option value="fixed_subscription">Cuota fija (sin comision)</option>
                <option value="commission_based">Comision por venta</option>
              </select>
            </label>
            <label>Plan comercial
              <select value={form.commercial_plan_key} onChange={(e) => setForm((p) => ({ ...p, commercial_plan_key: e.target.value }))}>
                <option value="fixed_subscription_basic">Basico sin comision</option>
                <option value="fixed_subscription_growth">Growth sin comision</option>
                <option value="fixed_subscription_premium">Premium sin comision</option>
                <option value="commission_based_basic">Basico con comision</option>
                <option value="commission_based_growth">Growth con comision</option>
                <option value="commission_based_premium">Premium con comision</option>
              </select>
            </label>
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear cliente comercial"}
            </button>
          </form>
        </article>

        <article className="card">
          <h3>Asignar marca padre/hija</h3>
          <label>
            Cliente comercial
            <select value={selectedAccount ?? ""} onChange={(e) => setSelectedAccount(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Selecciona...</option>
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.legal_name}</option>
              ))}
            </select>
          </label>
          <label>
            Marca
            <select value={assignTenantId || ""} onChange={(e) => setAssignTenantId(Number(e.target.value || 0))}>
              <option value="">Selecciona...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={assignAsParent} onChange={(e) => setAssignAsParent(e.target.checked)} />
            Marcar como marca padre
          </label>
          <button className="button" type="button" disabled={saving || !selectedAccount || !assignTenantId} onClick={() => void assignTenant()}>
            {saving ? "Asignando..." : "Asignar marca"}
          </button>
        </article>
      </div>

      <article className="card" style={{ marginTop: "12px" }}>
        <h3>Control de uso por cliente</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plan</th>
                <th>Marcas</th>
                <th>Usuarios</th>
                <th>Productos</th>
                <th>Sucursales</th>
                <th>Tokens IA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const u = usage[row.id];
                return (
                  <tr key={row.id}>
                    <td>{row.legal_name}</td>
                    <td>{row.commercial_plan_key ?? "-"}</td>
                    <td>{u ? `${u.brands_used}/${u.brands_limit}` : "-"}</td>
                    <td>{u ? `${u.users_used}/${u.users_limit}` : "-"}</td>
                    <td>{u ? `${u.products_used}/${u.products_limit}` : "-"}</td>
                    <td>{u ? `${u.branches_used}/${u.branches_limit}` : "-"}</td>
                    <td>{u ? `${u.ai_tokens_balance} disp / ${u.ai_tokens_included}` : "-"}</td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={7}>No hay clientes comerciales registrados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
