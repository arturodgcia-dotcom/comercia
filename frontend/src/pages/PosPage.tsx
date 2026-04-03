import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { buildBrandTheme, tokensToCssVars } from "../branding/multibrandTemplates";
import { AppInstallHelp } from "../components/AppInstallHelp";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { ModuleOnboardingCard } from "../components/ModuleOnboardingCard";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { PosCustomer, PosLocation, PosPaymentTransaction, PosSale, Product, TenantBranding, TenantConfig } from "../types/domain";
import { calculatePlanTotals } from "../utils/monetization";

interface TicketItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  mercado_pago_link: "Mercado Pago Link",
  mercado_pago_qr: "Mercado Pago QR",
  mercado_pago_point_placeholder: "Mercado Pago Point (placeholder)",
  tarjeta_manual_placeholder: "Tarjeta manual (placeholder)",
};

export function PosPage() {
  const { token, user } = useAuth();
  const { tenantId: scopedTenantId } = useAdminContextScope();
  const tenantId = scopedTenantId ?? user?.tenant_id ?? 0;
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [payments, setPayments] = useState<PosPaymentTransaction[]>([]);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [customerId, setCustomerId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("mercado_pago_qr");
  const [pendingPayment, setPendingPayment] = useState<PosPaymentTransaction | null>(null);
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    if (!tenantId) {
      setError("No hay marca activa seleccionada para operar POS.");
      return;
    }
    Promise.all([
      api.getPosLocations(token, tenantId),
      api.getPosCustomersByTenant(token, tenantId),
      api.getProductsByTenant(token, tenantId),
      api.getPosSalesByTenant(token, tenantId),
      api.getPosPaymentsByTenant(token, tenantId)
    ])
      .then(([locs, customersData, productsData, salesData, paymentsData]) => {
        setLocations(locs);
        setSelectedLocationId(locs[0]?.id ?? 0);
        setCustomers(customersData);
        setCustomerId(customersData[0]?.id ?? 0);
        setProducts(productsData);
        setSales(salesData);
        setPayments(paymentsData);
        api.getTenantBranding(token, tenantId).then(setBranding).catch(() => setBranding(null));
        api.getTenantConfig({ tenantId }).then(setTenantConfig).catch(() => setTenantConfig(null));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar POS"));
  }, [token, tenantId]);

  const total = useMemo(
    () => ticket.reduce((acc, item) => acc + item.quantity * item.unit_price, 0),
    [ticket]
  );
  const posTotals = useMemo(
    () => calculatePlanTotals({ subtotal: total }, tenantConfig?.plan_type ?? "subscription", tenantConfig?.commission_rules),
    [total, tenantConfig]
  );

  const posThemeStyle = useMemo(() => {
    const theme = buildBrandTheme(
      {
        key: `tenant-${tenantId}`,
        name: "POS de marca",
        slug: `tenant-${tenantId}`,
        logoText: "POS",
        logoAccent: "COMERCIA",
        primaryColor: branding?.primary_color ?? "#0d3e86",
        secondaryColor: branding?.secondary_color ?? "#5f97e3",
        supportColor: "#7fb8ff",
        bgSoft: "#eff4ff",
        promptMaster: "",
        businessType: "mixed",
        tone: "corporativo",
        baseImages: [],
        hasExistingLanding: true,
        monetizationPlan: tenantConfig?.plan_type === "commission" ? "commission" : "subscription",
        copy: {
          headline: "POS WebApp",
          subtitle: "Opera caja fisica con identidad de marca unificada.",
          ctaPrimary: "Cobrar",
          ctaSecondary: "Ver historial",
          valueProp: "POS integrado con ecommerce y distribuidores."
        }
      },
      "pos"
    );
    return tokensToCssVars(theme);
  }, [branding, tenantId, tenantConfig]);

  const addItem = (product: Product) => {
    setTicket((prev) => {
      const found = prev.find((item) => item.product_id === product.id);
      if (found) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, quantity: 1, unit_price: Number(product.price_public) }];
    });
  };

  const closeSale = async () => {
    if (!token || !selectedLocationId || ticket.length === 0) return;
    try {
      setError("");
      if (paymentMethod === "mercado_pago_link" || paymentMethod === "mercado_pago_qr") {
        const payload = {
          tenant_id: tenantId,
          pos_location_id: selectedLocationId,
          customer_id: customerId || undefined,
          amount: posTotals.total,
          currency: "MXN",
          sale_payload: {
            pos_location_id: selectedLocationId,
            customer_id: customerId || undefined,
            use_loyalty_points: true,
            register_membership: false,
            notes: "POS local demo",
            items: ticket
          },
          notes: "Pago POS con Mercado Pago"
        };
        const tx =
          paymentMethod === "mercado_pago_link"
            ? await api.createPosMercadoPagoLink(token, payload)
            : await api.createPosMercadoPagoQr(token, payload);
        setPendingPayment(tx);
        setPayments((previous) => [tx, ...previous]);
        return;
      }

      const sale = await api.createPosSale(token, {
        tenant_id: tenantId,
        pos_location_id: selectedLocationId,
        customer_id: customerId || undefined,
        payment_method: paymentMethod,
        currency: "MXN",
        use_loyalty_points: true,
        register_membership: false,
        notes: "POS local demo",
        items: ticket
      });
      setSales((previous) => [sale, ...previous]);
      setTicket([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cerrar venta POS");
    }
  };

  const confirmPendingPayment = async () => {
    if (!token || !pendingPayment) return;
    try {
      const tx = await api.confirmPosMercadoPagoPayment(token, {
        external_reference: pendingPayment.external_reference,
        paid: true,
        provider_payload: { source: "pos_ui_demo_confirm" },
        notes: "Pago confirmado manualmente en POS demo"
      });
      setPendingPayment(tx);
      const salesData = await api.getPosSalesByTenant(token, tenantId);
      const paymentsData = await api.getPosPaymentsByTenant(token, tenantId);
      setSales(salesData);
      setPayments(paymentsData);
      setTicket([]);
      setPendingPayment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible confirmar pago Mercado Pago");
    }
  };

  return (
    <section style={posThemeStyle}>
      <PageHeader title="POS WebApp" subtitle="Venta en punto de venta con fidelizacion y control por ubicacion." />
      <ModuleOnboardingCard
        moduleKey="pos"
        title="POS / Caja POS"
        whatItDoes="Permite registrar ventas en punto fisico, elegir metodo de pago y asociar cliente."
        whyItMatters="Conecta operacion de tienda con fidelizacion, reportes y control de caja."
        whatToCapture={["Ubicacion", "Cliente", "Productos del ticket", "Metodo de pago"]}
        impact="Da visibilidad real de ventas presenciales por marca y por punto."
      />
      <InstallAppPrompt />
      <AppInstallHelp context="POS" />
      <div className="row-gap">
        <Link to="/pos/locations" className="button button-outline">Ubicaciones</Link>
        <Link to="/pos/customers" className="button button-outline">Clientes POS</Link>
        <Link to="/pos/sales" className="button button-outline">Historial POS</Link>
      </div>
      <p className="chip">{tenantConfig?.plan_type === "commission" ? "Modelo comision" : "Sin comision"}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="card-grid">
        <article className="card">
          <h3>Ticket</h3>
          <label>
            Ubicacion
            <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(Number(e.target.value))}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
          <label>
            Cliente
            <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.full_name}</option>
              ))}
            </select>
          </label>
          <label>
            Metodo de pago
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="mercado_pago_link">Mercado Pago Link</option>
              <option value="mercado_pago_qr">Mercado Pago QR</option>
              <option value="mercado_pago_point_placeholder">Mercado Pago Point (placeholder)</option>
              <option value="tarjeta_manual_placeholder">Tarjeta manual (placeholder)</option>
            </select>
          </label>
          <ul>
            {ticket.map((item) => (
              <li key={item.product_id}>Producto #{item.product_id} x {item.quantity}</li>
            ))}
          </ul>
          <p>Subtotal: ${posTotals.subtotal.toLocaleString("es-MX")}</p>
          {tenantConfig?.plan_type === "commission" ? (
            <>
              <p>Comision estimada: ${posTotals.commission.toLocaleString("es-MX")}</p>
              <p>Total: ${posTotals.total.toLocaleString("es-MX")}</p>
            </>
          ) : (
            <p className="muted">Precio final directo. Sin comision por venta.</p>
          )}
          <button className="button" onClick={closeSale} type="button">Cerrar venta POS</button>
          {pendingPayment ? (
            <article className="card" style={{ marginTop: "1rem" }}>
              <h4>Cobro pendiente con Mercado Pago</h4>
              <p>Referencia: {pendingPayment.external_reference}</p>
              {pendingPayment.payment_url ? (
                <p>
                  Link de pago:{" "}
                  <a href={pendingPayment.payment_url} target="_blank" rel="noreferrer">
                    {pendingPayment.payment_url}
                  </a>
                </p>
              ) : null}
              {pendingPayment.qr_payload ? <p>QR payload generado para cobro: {pendingPayment.qr_payload}</p> : null}
              <button className="button" type="button" onClick={confirmPendingPayment}>
                Confirmar pago y registrar venta
              </button>
            </article>
          ) : null}
        </article>
        <article className="card">
          <h3>Catalogo rapido</h3>
          <div className="card-grid">
            {products.slice(0, 10).map((product) => (
              <button className="button button-outline" key={product.id} onClick={() => addItem(product)} type="button">
                {product.name} (${Number(product.price_public).toLocaleString("es-MX")})
              </button>
            ))}
          </div>
        </article>
      </div>
      <section className="card">
        <h3>Ventas recientes POS</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ubicacion</th>
              <th>Total</th>
              <th>Comision</th>
              <th>Neto</th>
              <th>Metodo</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 10).map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.pos_location_id}</td>
                <td>${Number(sale.total_amount).toLocaleString("es-MX")}</td>
                <td>${Number(sale.commission_amount ?? 0).toLocaleString("es-MX")}</td>
                <td>${Number(sale.net_amount ?? sale.total_amount).toLocaleString("es-MX")}</td>
                <td>{sale.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h3>Pagos POS recientes</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Metodo</th>
              <th>Status</th>
              <th>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 10).map((payment) => (
              <tr key={payment.id}>
                <td>{payment.external_reference}</td>
                <td>{PAYMENT_LABELS[payment.payment_method] ?? payment.payment_method}</td>
                <td>{payment.status}</td>
                <td>${Number(payment.amount).toLocaleString("es-MX")}</td>
                <td>{new Date(payment.created_at).toLocaleString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
