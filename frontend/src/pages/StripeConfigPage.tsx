import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { apiGet } from "../services/api";
import { StripeConfig } from "../types/domain";

export function StripeConfigPage() {
  const [items, setItems] = useState<StripeConfig[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<StripeConfig[]>("/api/v1/stripe-config")
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <PageHeader
        title="Stripe Config"
        subtitle="Llaves por tenant y control de operacion gestionada por REINPIA."
      />
      {error ? <p className="error">{error}</p> : null}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tenant</th>
            <th>Publishable</th>
            <th>Managed</th>
          </tr>
        </thead>
        <tbody>
          {items.map((config) => (
            <tr key={config.id}>
              <td>{config.id}</td>
              <td>{config.tenant_id}</td>
              <td>{config.publishable_key}</td>
              <td>{config.is_reinpia_managed ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
