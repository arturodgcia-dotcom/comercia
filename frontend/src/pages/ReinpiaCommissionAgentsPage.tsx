import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { CommissionAgentCard } from "../components/CommissionAgentCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { SalesCommissionAgent } from "../types/domain";

export function ReinpiaCommissionAgentsPage() {
  const { token, user } = useAuth();
  const [agents, setAgents] = useState<SalesCommissionAgent[]>([]);
  const [summaries, setSummaries] = useState<Record<number, Record<string, number | string>>>({});
  const [editing, setEditing] = useState<SalesCommissionAgent | null>(null);
  const [tenantOptions, setTenantOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [accountOptions, setAccountOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    agent_type: "externo",
    commercial_client_account_id: "",
    tenant_id: "",
    commission_percentage: "30",
    is_active: true,
    notes: ""
  });

  const canEdit = user?.role === "reinpia_admin" || user?.role === "super_admin";

  const load = async () => {
    if (!token) return;
    const [rows, tenants, accounts] = await Promise.all([
      api.getReinpiaFinanceCommissionAgents(token),
      api.getReinpiaFinanceTenantsSummary(token),
      api.getReinpiaFinanceCommercialClientAccounts(token),
    ]);
    setAgents(rows);
    setTenantOptions(tenants.map((row) => ({ id: row.tenant_id, name: row.tenant_name })));
    setAccountOptions(accounts.map((row) => ({ id: row.id, name: row.legal_name })));
    const mapped: Record<number, Record<string, number | string>> = {};
    for (const row of rows) {
      mapped[row.id] = await api.getReinpiaFinanceCommissionAgentSummary(token, row.id);
    }
    setSummaries(mapped);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar comisionistas"));
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !canEdit) return;
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      agent_type: form.agent_type,
      commercial_client_account_id: form.commercial_client_account_id ? Number(form.commercial_client_account_id) : undefined,
      tenant_id: form.tenant_id ? Number(form.tenant_id) : undefined,
      commission_percentage: Number(form.commission_percentage),
      is_active: form.is_active,
      notes: form.notes || undefined
    };
    if (editing) {
      await api.updateReinpiaCommissionAgent(token, editing.id, payload);
    } else {
      await api.createReinpiaCommissionAgent(token, payload);
    }
    setEditing(null);
    setForm({
      full_name: "",
      email: "",
      phone: "",
      agent_type: "externo",
      commercial_client_account_id: "",
      tenant_id: "",
      commission_percentage: "30",
      is_active: true,
      notes: ""
    });
    await load();
  };

  return (
    <section>
      <PageHeader title="Comisionistas" subtitle="Gestión de comisionistas internos/externos y visibilidad de su desempeño financiero." />
      {error ? <p className="error">{error}</p> : null}

      {canEdit ? (
        <form className="inline-form" onSubmit={submit}>
          <input required placeholder="Nombre" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
          <input required placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <select value={form.agent_type} onChange={(e) => setForm((p) => ({ ...p, agent_type: e.target.value }))}>
            <option value="interno">Interno</option>
            <option value="externo">Externo</option>
          </select>
          <select value={form.commercial_client_account_id} onChange={(e) => setForm((p) => ({ ...p, commercial_client_account_id: e.target.value }))}>
            <option value="">Cliente principal (opcional)</option>
            {accountOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <select value={form.tenant_id} onChange={(e) => setForm((p) => ({ ...p, tenant_id: e.target.value }))}>
            <option value="">Marca (opcional)</option>
            {tenantOptions.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={0}
            max={100}
            placeholder="% comisión"
            value={form.commission_percentage}
            onChange={(e) => setForm((p) => ({ ...p, commission_percentage: e.target.value }))}
          />
          <input placeholder="Notas" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Activo
          </label>
          <button className="button" type="submit">
            {editing ? "Actualizar comisionista" : "Crear comisionista"}
          </button>
        </form>
      ) : (
        <section className="card">
          <p>Vista solo lectura para rol contador. La edición está restringida a super admin.</p>
        </section>
      )}

      <div className="card-grid">
        {agents.map((agent) => (
          <CommissionAgentCard
            key={agent.id}
            agent={agent}
            summary={summaries[agent.id]}
            onEdit={canEdit
              ? (row) => {
                  setEditing(row);
                  setForm({
                    full_name: row.full_name,
                    email: row.email,
                    phone: row.phone ?? "",
                    agent_type: row.agent_type || "externo",
                    commercial_client_account_id: row.commercial_client_account_id ? String(row.commercial_client_account_id) : "",
                    tenant_id: row.tenant_id ? String(row.tenant_id) : "",
                    commission_percentage: String(row.commission_percentage),
                    is_active: row.is_active,
                    notes: row.notes ?? ""
                  });
                }
              : undefined}
          />
        ))}
      </div>
    </section>
  );
}
