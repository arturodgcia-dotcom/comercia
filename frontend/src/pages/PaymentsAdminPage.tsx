import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PaymentsDashboard } from "../types/domain";

export function PaymentsAdminPage() {
  const { token } = useAuth();
  const [data, setData] = useState<PaymentsDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .getPaymentsDashboard(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar pagos"));
  }, [token]);

  return (
    <section>
      <PageHeader title="Payments" subtitle="Resumen de ordenes y flujo de dinero por checkout Stripe." />
      {error ? <p className="error">{error}</p> : null}
      {!data ? (
        <p>Cargando pagos...</p>
      ) : (
        <>
          <div className="card-grid">
            <article className="card">
              <h3>Total vendido</h3>
              <p>${Number(data.total_sold).toLocaleString("es-MX")}</p>
            </article>
            <article className="card">
              <h3>Comision generada</h3>
              <p>${Number(data.total_commission).toLocaleString("es-MX")}</p>
            </article>
            <article className="card">
              <h3>Neto al comercio</h3>
              <p>${Number(data.total_net).toLocaleString("es-MX")}</p>
            </article>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tenant</th>
                <th>Total</th>
                <th>Comision</th>
                <th>Neto</th>
                <th>Modo</th>
                <th>Status</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.tenant_id}</td>
                  <td>{Number(order.total_amount).toLocaleString("es-MX")}</td>
                  <td>{Number(order.commission_amount).toLocaleString("es-MX")}</td>
                  <td>{Number(order.net_amount).toLocaleString("es-MX")}</td>
                  <td>{order.payment_mode}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.created_at).toLocaleString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
