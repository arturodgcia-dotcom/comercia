import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { PosCustomer, PosLocation, PosSale, Product } from "../types/domain";

interface TicketItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export function PosPage() {
  const { token, user } = useAuth();
  const tenantId = user?.tenant_id ?? 1;
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [customerId, setCustomerId] = useState<number>(0);
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getPosLocations(token, tenantId),
      api.getPosCustomersByTenant(token, tenantId),
      api.getProductsByTenant(token, tenantId),
      api.getPosSalesByTenant(token, tenantId)
    ])
      .then(([locs, customersData, productsData, salesData]) => {
        setLocations(locs);
        setSelectedLocationId(locs[0]?.id ?? 0);
        setCustomers(customersData);
        setCustomerId(customersData[0]?.id ?? 0);
        setProducts(productsData);
        setSales(salesData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar POS"));
  }, [token, tenantId]);

  const total = useMemo(
    () => ticket.reduce((acc, item) => acc + item.quantity * item.unit_price, 0),
    [ticket]
  );

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
      const sale = await api.createPosSale(token, {
        tenant_id: tenantId,
        pos_location_id: selectedLocationId,
        customer_id: customerId || undefined,
        payment_method: "card",
        currency: "MXN",
        use_loyalty_points: true,
        register_membership: false,
        notes: "POS local demo",
        items: ticket
      });
      setSales((prev) => [sale, ...prev]);
      setTicket([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cerrar venta POS");
    }
  };

  return (
    <section>
      <PageHeader title="POS WebApp" subtitle="Venta en punto de venta con fidelizacion y control por ubicacion." />
      <div className="row-gap">
        <Link to="/pos/locations" className="button button-outline">Ubicaciones</Link>
        <Link to="/pos/customers" className="button button-outline">Clientes POS</Link>
        <Link to="/pos/sales" className="button button-outline">Historial POS</Link>
      </div>
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
          <ul>
            {ticket.map((item) => (
              <li key={item.product_id}>Producto #{item.product_id} x {item.quantity}</li>
            ))}
          </ul>
          <p>Total: ${total.toLocaleString("es-MX")}</p>
          <button className="button" onClick={closeSale} type="button">Cerrar venta POS</button>
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
              <th>Metodo</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 10).map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.pos_location_id}</td>
                <td>${Number(sale.total_amount).toLocaleString("es-MX")}</td>
                <td>{sale.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
