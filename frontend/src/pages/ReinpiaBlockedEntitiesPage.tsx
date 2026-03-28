import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { BlockedEntityTable } from "../components/BlockedEntityTable";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { BlockedEntity } from "../types/domain";

export function ReinpiaBlockedEntitiesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<BlockedEntity[]>([]);
  const [form, setForm] = useState({ entity_type: "ip", entity_key: "", reason: "", blocked_until: "" });
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    setRows(await api.getBlockedEntities(token));
  };

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar bloqueos"));
  }, [token]);

  const createBlocked = async () => {
    if (!token) return;
    await api.createBlockedEntity(token, {
      ...form,
      blocked_until: form.blocked_until ? new Date(form.blocked_until).toISOString() : null
    });
    setForm({ entity_type: "ip", entity_key: "", reason: "", blocked_until: "" });
    await load();
  };

  const onUnblock = async (id: number) => {
    if (!token) return;
    await api.unblockEntity(token, id);
    await load();
  };

  return (
    <section>
      <PageHeader title="Blocked Entities" subtitle="Bloqueos activos por IP, usuario, cupon o referral." />
      {error ? <p className="error">{error}</p> : null}
      <div className="panel">
        <h3>Nuevo bloqueo</h3>
        <div className="inline-form">
          <select value={form.entity_type} onChange={(e) => setForm((p) => ({ ...p, entity_type: e.target.value }))}>
            <option value="ip">ip</option>
            <option value="user">user</option>
            <option value="coupon">coupon</option>
            <option value="referral_code">referral_code</option>
          </select>
          <input
            placeholder="entity_key"
            value={form.entity_key}
            onChange={(e) => setForm((p) => ({ ...p, entity_key: e.target.value }))}
          />
          <input
            placeholder="reason"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          />
          <input
            type="datetime-local"
            value={form.blocked_until}
            onChange={(e) => setForm((p) => ({ ...p, blocked_until: e.target.value }))}
          />
          <button type="button" className="button" onClick={createBlocked}>
            Bloquear
          </button>
        </div>
      </div>
      <BlockedEntityTable rows={rows} onUnblock={onUnblock} />
    </section>
  );
}

