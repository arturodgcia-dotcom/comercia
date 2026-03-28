import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { CommissionAgentCard } from "../components/CommissionAgentCard";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { SalesCommissionAgent } from "../types/domain";

export function ReinpiaCommissionAgentsPage() {
  const { token } = useAuth();
  const [agents, setAgents] = useState<SalesCommissionAgent[]>([]);
  const [summaries, setSummaries] = useState<Record<number, Record<string, number | string>>>({});
  const [editing, setEditing] = useState<SalesCommissionAgent | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    commission_percentage: "30",
    is_active: true,
    notes: ""
  });

  const load = async () => {
    if (!token) return;
    const rows = await api.getReinpiaCommissionAgents(token);
    setAgents(rows);
    const mapped: Record<number, Record<string, number | string>> = {};
    for (const row of rows) {
      mapped[row.id] = await api.getReinpiaCommissionAgentSummary(token, row.id);
    }
    setSummaries(mapped);
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar comisionistas"));
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
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
    setForm({ full_name: "", email: "", phone: "", commission_percentage: "30", is_active: true, notes: "" });
    await load();
  };

  return (
    <section>
      <PageHeader title="REINPIA Commission Agents" subtitle="Alta, edición, claves y resumen comercial por comisionista." />
      {error ? <p className="error">{error}</p> : null}
      <form className="inline-form" onSubmit={submit}>
        <input required placeholder="Nombre" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
        <input required placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <input placeholder="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <input
          required
          type="number"
          min={0}
          max={100}
          placeholder="% comision"
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
      <div className="card-grid">
        {agents.map((agent) => (
          <CommissionAgentCard
            key={agent.id}
            agent={agent}
            summary={summaries[agent.id]}
            onEdit={(row) => {
              setEditing(row);
              setForm({
                full_name: row.full_name,
                email: row.email,
                phone: row.phone ?? "",
                commission_percentage: String(row.commission_percentage),
                is_active: row.is_active,
                notes: row.notes ?? ""
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}

