import { useEffect, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PosSale } from "../types/domain";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mercado_pago_link: "Mercado Pago Link",
  mercado_pago_qr: "Mercado Pago QR",
  mercado_pago_point_placeholder: "Mercado Pago Point",
  tarjeta_manual_placeholder: "Tarjeta manual",
};

export function PosSalesPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [sales, setSales] = useState<PosSale[]>([]);

  useEffect(() => {
    if (!token) return;
    api.getPosSalesByTenant(token, tenantId).then(setSales);
  }, [token, tenantId]);

  return (
    <section>
      <PageHeader title="POS Ventas" subtitle="Historial consolidado de ventas en punto de venta." />
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ubicacion</th>
            <th>Total</th>
            <th>Moneda</th>
            <th>Metodo</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{sale.pos_location_id}</td>
              <td>${Number(sale.total_amount).toLocaleString("es-MX")}</td>
              <td>{sale.currency}</td>
              <td>{PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method}</td>
              <td>{new Date(sale.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
