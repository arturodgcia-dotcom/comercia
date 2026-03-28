import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiGet } from "../services/api";
import { Plan } from "../types/domain";

export function PlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<Plan[]>("/api/v1/plans")
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHeader title="Planes Comerciales" subtitle="Plan fijo y plan por comision configurados." />
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
            <p>
              Comision: {Number(plan.commission_low_rate) * 100}% / {Number(plan.commission_high_rate) * 100}%
            </p>
            <p>Umbral: {Number(plan.commission_threshold).toLocaleString("es-MX")}</p>
            <p>{plan.notes}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
