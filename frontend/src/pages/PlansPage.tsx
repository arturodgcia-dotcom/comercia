import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { Plan } from "../types/domain";

export function PlansPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Plan[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getPlans(token)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar planes"));
  }, [token]);

  return (
    <section>
      <PageHeader title="Planes Comerciales" subtitle="Plan 1 y Plan 2 para operacion inicial." />
      {error ? <p className="error">{error}</p> : null}
      <div className="card-grid">
        {items.map((plan) => (
          <article key={plan.id} className="card">
            <h3>
              {plan.name} ({plan.code})
            </h3>
            <p>Tipo: {plan.type}</p>
            <p>Mensual base: {Number(plan.monthly_price).toLocaleString("es-MX")}</p>
            <p>Mes 3+: {Number(plan.monthly_price_after_month_2).toLocaleString("es-MX")}</p>
            <p>Comision low/high: {Number(plan.commission_low_rate) * 100}% / {Number(plan.commission_high_rate) * 100}%</p>
            <p>Umbral: {Number(plan.commission_threshold).toLocaleString("es-MX")}</p>
            <p>{plan.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
