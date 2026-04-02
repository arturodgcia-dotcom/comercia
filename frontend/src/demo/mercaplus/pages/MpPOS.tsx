import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MP_CATEGORIES, MP_PRODUCTS, formatMXN } from "../data";
import "../mercaplus.css";
import "../mp-additions.css";

interface TicketItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  publicPrice: number;
  wholesalePrice: number;
  qty: number;
}

type CustomerType = "publico" | "frecuente" | "distribuidor";
type PosView = "sale" | "paid";

interface PosCustomer {
  id: string;
  nombre: string;
  tipo: CustomerType;
  membresia: string;
  puntos: number;
  cupones: string[];
  descuentoExtra: number;
  expiraEnDias: number;
  nivelComercial?: string;
}

const PAYMENT_METHODS = [
  { id: "cash", icon: "💵", label: "Efectivo" },
  { id: "card", icon: "💳", label: "Tarjeta" },
  { id: "transfer", icon: "📱", label: "Transferencia" },
  { id: "mp_qr", icon: "🔷", label: "MP QR" },
  { id: "mp_link", icon: "🔗", label: "MP Link" },
  { id: "credit", icon: "📋", label: "Crédito" },
];

const POS_CUSTOMERS: PosCustomer[] = [
  {
    id: "publico-1",
    nombre: "María García",
    tipo: "publico",
    membresia: "Club Bienestar",
    puntos: 1240,
    cupones: ["BIENVENIDA-5"],
    descuentoExtra: 5,
    expiraEnDias: 88,
  },
  {
    id: "frecuente-1",
    nombre: "Laura Martínez",
    tipo: "frecuente",
    membresia: "Frecuente Plus",
    puntos: 2840,
    cupones: ["RECOMPRA-10"],
    descuentoExtra: 10,
    expiraEnDias: 21,
  },
  {
    id: "dist-1",
    nombre: "Distribuidora Del Norte",
    tipo: "distribuidor",
    membresia: "Comercial Oro",
    puntos: 12800,
    cupones: ["DIST-ORO-8"],
    descuentoExtra: 8,
    expiraEnDias: 19,
    nivelComercial: "Oro",
  },
];

const POS_PRODUCTS = MP_PRODUCTS.slice(0, 18).map((p) => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  category: p.category,
  pricePublic: p.pricePublic,
  priceWholesale: p.priceWholesale,
}));

function getCustomerPrice(item: TicketItem, customer: PosCustomer | null) {
  if (!customer) return item.publicPrice;
  const base = customer.tipo === "distribuidor" ? item.wholesalePrice : item.publicPrice;
  const afterDiscount = base * (1 - customer.descuentoExtra / 100);
  return Math.max(1, Math.round(afterDiscount));
}

export function MpPOS() {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [payMethod, setPayMethod] = useState("card");
  const [customerId, setCustomerId] = useState("");
  const [view, setView] = useState<PosView>("sale");
  const [lastTotal, setLastTotal] = useState(0);

  const customer = POS_CUSTOMERS.find((c) => c.id === customerId) ?? null;

  const catOptions = [
    { id: "all", label: "Todos" },
    ...MP_CATEGORIES.slice(0, 7).map((c) => ({ id: c.slug, label: `${c.icon} ${c.name}` })),
  ];

  const filteredProducts = POS_PRODUCTS.filter((p) => {
    const matchCat = cat === "all" || p.category === cat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addProduct = (p: typeof POS_PRODUCTS[0]) => {
    setTicket((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) return prev.map((item) => (item.id === p.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { id: p.id, name: p.name, icon: p.icon, category: p.category, publicPrice: p.pricePublic, wholesalePrice: p.priceWholesale, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setTicket((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const subtotalBase = ticket.reduce((sum, item) => sum + item.publicPrice * item.qty, 0);
  const subtotalApplied = ticket.reduce((sum, item) => sum + getCustomerPrice(item, customer) * item.qty, 0);
  const discountAmount = subtotalBase - subtotalApplied;
  const total = subtotalApplied;

  const handlePay = () => {
    setLastTotal(total);
    setView("paid");
    setTimeout(() => {
      setTicket([]);
      setView("sale");
    }, 3000);
  };

  if (view === "paid") {
    return (
      <div className="mp-pos-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>✅</div>
          <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 8px" }}>¡Cobro exitoso!</h2>
          <p style={{ fontSize: "48px", fontWeight: 900, color: "#fbbf24", margin: "0 0 16px" }}>{formatMXN(lastTotal)}</p>
          <p style={{ fontSize: "16px", opacity: 0.8 }}>Método: {PAYMENT_METHODS.find((m) => m.id === payMethod)?.label}</p>
          <p style={{ fontSize: "14px", opacity: 0.6, marginTop: "20px" }}>Regresando en 3 segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-pos-shell">
      <div className="mp-pos-topbar">
        <Link to="/demo/mercaplus" className="mp-pos-logo">
          Merca<span>Plus</span> <span style={{ fontSize: "12px", fontWeight: 400, color: "#94a3b8" }}>POS</span>
        </Link>
        <div className="mp-pos-topbar-info">
          <span className="mp-pos-location">Sucursal Centro</span>
          <span>Cajero: Ana López</span>
          <span style={{ color: "#334155" }}>|</span>
          <span>{new Date().toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="mp-pos-action-btn">Resumen</button>
          <button type="button" className="mp-pos-action-btn">Config</button>
        </div>
      </div>

      <div className="mp-pos-layout">
        <div className="mp-pos-catalog">
          <div className="mp-pos-search-row">
            <input className="mp-pos-search" type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="mp-pos-cats">
            {catOptions.map((option) => (
              <button key={option.id} type="button" className={`mp-pos-cat${cat === option.id ? " active" : ""}`} onClick={() => setCat(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="mp-pos-products">
            {filteredProducts.map((p) => (
              <button key={p.id} type="button" className="mp-pos-product" onClick={() => addProduct(p)}>
                <span className="mp-pos-product-icon">{p.icon}</span>
                <span className="mp-pos-product-name">{p.name}</span>
                <span className="mp-pos-product-price">{formatMXN(customer?.tipo === "distribuidor" ? p.priceWholesale : p.pricePublic)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mp-pos-ticket">
          <div className="mp-pos-ticket-header">
            <span className="mp-pos-ticket-title">
              Ticket
              {ticket.length > 0 && (
                <span style={{ fontSize: "12px", fontWeight: 400, color: "#64748b", marginLeft: "8px" }}>
                  ({ticket.reduce((sum, item) => sum + item.qty, 0)} ítems)
                </span>
              )}
            </span>
            {ticket.length > 0 && (
              <button className="mp-pos-clear" type="button" onClick={() => setTicket([])}>
                Limpiar
              </button>
            )}
          </div>

          <div className="mp-pos-customer-row">
            <span style={{ fontSize: "16px" }}>👤</span>
            <select className="mp-pos-customer-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Sin cliente identificado</option>
              {POS_CUSTOMERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.tipo === "distribuidor" ? "Distribuidor" : c.tipo === "frecuente" ? "Cliente frecuente" : "Cliente público"}
                </option>
              ))}
            </select>
          </div>

          {customer && (
            <div style={{ margin: "10px 12px 0", border: "1px solid #334155", borderRadius: "10px", padding: "10px", background: "#0f172a", color: "#cbd5e1" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{customer.nombre}</p>
              <p style={{ margin: "0 0 6px", fontSize: "12px" }}>
                Tipo: {customer.tipo === "distribuidor" ? "Distribuidor" : customer.tipo === "frecuente" ? "Cliente frecuente" : "Público"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px" }}>
                <span>Membresía: {customer.membresia}</span>
                <span>Puntos: {customer.puntos}</span>
                <span>Cupón: {customer.cupones[0]}</span>
                <span>Descuento: {customer.descuentoExtra}%</span>
                {customer.tipo === "distribuidor" && <span>Nivel comercial: {customer.nivelComercial}</span>}
                <span style={{ color: customer.expiraEnDias <= 30 ? "#fbbf24" : "#94a3b8" }}>
                  {customer.expiraEnDias <= 30 ? "Membresía por vencer pronto" : `Vigencia: ${customer.expiraEnDias} días`}
                </span>
              </div>
            </div>
          )}

          <div className="mp-pos-items">
            {ticket.length === 0 ? (
              <div className="mp-pos-empty">
                <span style={{ fontSize: "40px" }}>🛒</span>
                <span style={{ fontSize: "14px", color: "#64748b" }}>Toca un producto para agregarlo</span>
              </div>
            ) : (
              ticket.map((item) => {
                const appliedPrice = getCustomerPrice(item, customer);
                const basePrice = customer?.tipo === "distribuidor" ? item.wholesalePrice : item.publicPrice;
                return (
                  <div key={item.id} className="mp-pos-item">
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
                    <span className="mp-pos-item-name">{item.name}</span>
                    <div className="mp-pos-item-qty">
                      <button className="mp-pos-qty-btn" type="button" onClick={() => changeQty(item.id, -1)}>−</button>
                      <span className="mp-pos-qty-num">{item.qty}</span>
                      <button className="mp-pos-qty-btn" type="button" onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                    <div style={{ minWidth: "86px", textAlign: "right" }}>
                      <span className="mp-pos-item-price">{formatMXN(appliedPrice * item.qty)}</span>
                      {appliedPrice < basePrice && (
                        <p style={{ margin: 0, fontSize: "11px", color: "#22c55e" }}>Ahorro {formatMXN((basePrice - appliedPrice) * item.qty)}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mp-pos-totals">
            <div className="mp-pos-total-row">
              <span>Subtotal base</span><span>{formatMXN(subtotalBase)}</span>
            </div>
            <div className="mp-pos-total-row">
              <span>Beneficios aplicados</span>
              <span style={{ color: "#22c55e" }}>-{formatMXN(discountAmount)}</span>
            </div>
            <div className="mp-pos-total-row">
              <span>IVA incluido</span>
              <span>{formatMXN(total * 0.16 / 1.16)}</span>
            </div>
            <div className="mp-pos-total-row mp-pos-grand-total">
              <span>TOTAL</span><span>{formatMXN(total)}</span>
            </div>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#94a3b8" }}>
              {customer
                ? `Precio aplicado automáticamente para ${customer.tipo === "distribuidor" ? "distribuidor" : "cliente"} con membresía y cupón activo.`
                : "Sin identificación de cliente: precio público estándar."}
            </div>
          </div>

          <div className="mp-pos-payment">
            <p className="mp-pos-payment-label">Método de pago</p>
            <div className="mp-pos-payment-methods">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.id} type="button" className={`mp-pos-method${payMethod === m.id ? " selected" : ""}`} onClick={() => setPayMethod(m.id)}>
                  <span className="mp-pos-method-icon">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <button className="mp-pos-pay-btn" type="button" disabled={ticket.length === 0} onClick={handlePay}>
              {ticket.length === 0 ? "Agrega productos al ticket" : `Cobrar ${formatMXN(total)} · ${PAYMENT_METHODS.find((m) => m.id === payMethod)?.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
