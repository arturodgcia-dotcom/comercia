import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { LoyaltyProgram, Tenant } from "../types/domain";

export function LoyaltyProgramAdminPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [program, setProgram] = useState<Partial<LoyaltyProgram>>({
    name: "Programa Base",
    is_active: true,
    points_enabled: true,
    points_conversion_rate: 100,
    welcome_points: 0
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getTenants(token).then((list) => {
      setTenants(list);
      setTenantId(list[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !tenantId) return;
    api.getLoyaltyProgram(token, tenantId).then(setProgram).catch(() => undefined);
  }, [token, tenantId]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !tenantId) return;
    try {
      const updated = await api.upsertLoyaltyProgram(token, tenantId, program);
      setProgram(updated);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar programa");
    }
  };

  return (
    <section>
      <PageHeader title="Loyalty Program" subtitle="Configuracion de fidelizacion, welcome points y conversion." />
      {error ? <p className="error">{error}</p> : null}
      <div className="row-gap">
        <select value={tenantId ?? ""} onChange={(e) => setTenantId(Number(e.target.value))}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <form className="detail-form" onSubmit={save}>
        <label>
          Nombre
          <input value={program.name ?? ""} onChange={(e) => setProgram((p) => ({ ...p, name: e.target.value }))} />
        </label>
        <label>
          Conversion rate (puntos por 1 MXN)
          <input
            type="number"
            value={program.points_conversion_rate ?? 100}
            onChange={(e) => setProgram((p) => ({ ...p, points_conversion_rate: Number(e.target.value) }))}
          />
        </label>
        <label>
          Welcome points
          <input
            type="number"
            value={program.welcome_points ?? 0}
            onChange={(e) => setProgram((p) => ({ ...p, welcome_points: Number(e.target.value) }))}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={program.is_active ?? true}
            onChange={(e) => setProgram((p) => ({ ...p, is_active: e.target.checked }))}
          />
          Activo
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={program.points_enabled ?? true}
            onChange={(e) => setProgram((p) => ({ ...p, points_enabled: e.target.checked }))}
          />
          Puntos habilitados
        </label>
        <button className="button" type="submit">
          Guardar programa
        </button>
      </form>
    </section>
  );
}
