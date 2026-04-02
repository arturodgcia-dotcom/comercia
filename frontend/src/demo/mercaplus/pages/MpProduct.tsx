import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMp } from "../MpContext";
import { MP_PRODUCTS, MP_REVIEWS, MP_SERVICES, formatMXN, getProductById } from "../data";

type GiftMode = "con-remitente" | "anonimo";
type BookingMode = "para-mi" | "regalo";

const STATUS_FLOW = ["Cita creada", "Cita notificada", "Cita confirmada", "Cita asistida", "Cita cerrada"];

function saveGiftMeta(productId: string, giftData: Record<string, string>) {
  const raw = localStorage.getItem("mpGiftMeta");
  const parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, string>>) : {};
  parsed[productId] = giftData;
  localStorage.setItem("mpGiftMeta", JSON.stringify(parsed));
}

export function MpProduct() {
  const { id } = useParams<{ id: string }>();
  const { addToCart, toggleWishlist, isWishlisted } = useMp();
  const navigate = useNavigate();

  const product = getProductById(id || "");
  const service = MP_SERVICES.find((item) => item.id === id);

  const [qty, setQty] = useState(1);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftMode, setGiftMode] = useState<GiftMode>("con-remitente");
  const [giftForm, setGiftForm] = useState({
    remitente: "Sofía Ramírez",
    destinatario: "",
    mensaje: "",
    correo: "",
    telefono: "",
    direccion: "",
  });
  const [wishlistName, setWishlistName] = useState("Mis favoritos");
  const [wishlistSaved, setWishlistSaved] = useState("");

  const [bookingMode, setBookingMode] = useState<BookingMode>("para-mi");
  const [bookingData, setBookingData] = useState({
    fecha: "2026-04-14",
    hora: "12:30",
    nombre: "María García",
    observaciones: "",
    destinatario: "",
    mensaje: "",
    correo: "",
    telefono: "",
    anonimo: "no",
  });
  const [bookingCreated, setBookingCreated] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(1);

  const publicPrice = product?.isPromo
    ? product.pricePublic * (1 - product.discountPct / 100)
    : product?.pricePublic ?? 0;

  const related = useMemo(
    () =>
      product
        ? MP_PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4)
        : MP_PRODUCTS.slice(0, 4),
    [product],
  );

  if (!product && !service) {
    return (
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
        <h1 style={{ marginBottom: "8px" }}>Producto o servicio no encontrado</h1>
        <p style={{ color: "var(--mp-muted)" }}>Regresa al catálogo para seleccionar otro artículo.</p>
        <Link to="/demo/mercaplus/catalogo" className="mp-btn mp-btn-primary" style={{ marginTop: "16px" }}>
          Ir al catálogo
        </Link>
      </div>
    );
  }

  if (service) {
    return (
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "26px 24px 44px" }}>
        <div className="mp-breadcrumb">
          <Link to="/demo/mercaplus">Inicio</Link>
          <span>›</span>
          <Link to="/demo/mercaplus/catalogo">Servicios</Link>
          <span>›</span>
          <span style={{ color: "var(--mp-text)" }}>{service.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "20px", alignItems: "start" }}>
          <section className="mp-panel">
            <div style={{ display: "grid", placeItems: "center", minHeight: "300px", borderRadius: "14px", background: service.bgColor, fontSize: "120px" }}>
              {service.icon}
            </div>
            <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "30px", lineHeight: 1.15 }}>{service.name}</h1>
              <p style={{ margin: 0, color: "var(--mp-muted)", lineHeight: 1.7 }}>{service.description}</p>
              <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2,minmax(120px,1fr))" }}>
                <div style={{ border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Duración</p>
                  <strong>{service.durationMin} minutos</strong>
                </div>
                <div style={{ border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Lugar de atención</p>
                  <strong>Sucursal Centro · CDMX</strong>
                </div>
                <div style={{ border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Disponibilidad</p>
                  <strong>Agenda abierta esta semana</strong>
                </div>
                <div style={{ border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)" }}>Precio</p>
                  <strong style={{ color: "var(--mp-accent)" }}>{formatMXN(service.price)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="mp-panel" style={{ display: "grid", gap: "12px" }}>
            <h2 style={{ margin: 0 }}>Reservar cita</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className={`mp-btn ${bookingMode === "para-mi" ? "mp-btn-primary" : "mp-btn-outline"}`} onClick={() => setBookingMode("para-mi")}>
                Para mí
              </button>
              <button type="button" className={`mp-btn ${bookingMode === "regalo" ? "mp-btn-primary" : "mp-btn-outline"}`} onClick={() => setBookingMode("regalo")}>
                Es regalo
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                Fecha
                <input className="mp-select" type="date" value={bookingData.fecha} onChange={(e) => setBookingData((v) => ({ ...v, fecha: e.target.value }))} />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                Hora
                <input className="mp-select" type="time" value={bookingData.hora} onChange={(e) => setBookingData((v) => ({ ...v, hora: e.target.value }))} />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)", gridColumn: "1/-1" }}>
                Datos del cliente
                <input className="mp-select" type="text" value={bookingData.nombre} onChange={(e) => setBookingData((v) => ({ ...v, nombre: e.target.value }))} />
              </label>

              {bookingMode === "regalo" && (
                <>
                  <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                    Destinatario
                    <input className="mp-select" type="text" value={bookingData.destinatario} onChange={(e) => setBookingData((v) => ({ ...v, destinatario: e.target.value }))} />
                  </label>
                  <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                    Regalo anónimo
                    <select className="mp-select" value={bookingData.anonimo} onChange={(e) => setBookingData((v) => ({ ...v, anonimo: e.target.value }))}>
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                    Correo destinatario
                    <input className="mp-select" type="email" value={bookingData.correo} onChange={(e) => setBookingData((v) => ({ ...v, correo: e.target.value }))} />
                  </label>
                  <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)" }}>
                    Teléfono destinatario
                    <input className="mp-select" type="tel" value={bookingData.telefono} onChange={(e) => setBookingData((v) => ({ ...v, telefono: e.target.value }))} />
                  </label>
                  <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)", gridColumn: "1/-1" }}>
                    Mensaje para regalo
                    <textarea className="mp-select" value={bookingData.mensaje} onChange={(e) => setBookingData((v) => ({ ...v, mensaje: e.target.value }))} />
                  </label>
                </>
              )}

              <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--mp-muted)", gridColumn: "1/-1" }}>
                Observaciones
                <textarea className="mp-select" value={bookingData.observaciones} onChange={(e) => setBookingData((v) => ({ ...v, observaciones: e.target.value }))} />
              </label>
            </div>

            <button type="button" className="mp-btn mp-btn-primary mp-btn-lg" onClick={() => setBookingCreated(true)}>
              Reservar cita
            </button>

            {bookingCreated && (
              <div style={{ border: "1px solid var(--mp-border)", borderRadius: "12px", padding: "12px", background: "#f8fbff" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: "16px" }}>Resumen de notificación servicio</h3>
                <p style={{ margin: "0 0 6px", fontSize: "13px" }}>
                  Se enviará correo y WhatsApp Bot con: servicio, fecha, hora, dirección, instrucciones previas y teléfono de contacto.
                </p>
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--mp-muted)" }}>
                  Dirección: Av. Insurgentes Sur 1234, CDMX · Qué llevar: identificación oficial.
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {STATUS_FLOW.map((label, idx) => (
                    <span
                      key={label}
                      style={{
                        borderRadius: "999px",
                        fontSize: "12px",
                        padding: "6px 10px",
                        border: "1px solid var(--mp-border)",
                        background: idx <= bookingStatus ? "#dcfce7" : "#fff",
                        color: idx <= bookingStatus ? "#166534" : "var(--mp-muted)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <button type="button" className="mp-btn mp-btn-ghost" onClick={() => setBookingStatus((v) => (v < STATUS_FLOW.length - 1 ? v + 1 : v))}>
                  Avanzar estatus demo
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const reviews = MP_REVIEWS[product.id] ?? [];
  const gallery = [product.icon, "🧾", "🚚", "🎁"];

  const addWithGift = (goCheckout: boolean) => {
    for (let i = 0; i < qty; i++) addToCart(product, "public");
    if (giftEnabled) {
      saveGiftMeta(product.id, {
        tipo: giftMode === "anonimo" ? "Anónimo" : "Con remitente",
        mensaje: giftForm.mensaje || "Sin mensaje",
        destinatario: giftForm.destinatario || "Sin destinatario",
        remitente: giftMode === "anonimo" ? "Oculto" : giftForm.remitente || "No definido",
      });
    }
    navigate(goCheckout ? "/demo/mercaplus/checkout" : "/demo/mercaplus/carrito");
  };

  const saveWishList = () => {
    toggleWishlist(product.id);
    setWishlistSaved(`Guardado en "${wishlistName}"`);
    setTimeout(() => setWishlistSaved(""), 2400);
  };

  return (
    <div style={{ maxWidth: "1220px", margin: "0 auto", padding: "24px" }}>
      <div className="mp-breadcrumb">
        <Link to="/demo/mercaplus">Inicio</Link>
        <span>›</span>
        <Link to="/demo/mercaplus/catalogo">Catálogo</Link>
        <span>›</span>
        <span style={{ color: "var(--mp-text)" }}>{product.name}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "22px" }}>
        <section className="mp-panel">
          <div style={{ display: "grid", gridTemplateColumns: "95px 1fr", gap: "12px" }}>
            <div style={{ display: "grid", gap: "8px", alignContent: "start" }}>
              {gallery.map((icon, idx) => (
                <button
                  key={`${icon}-${idx}`}
                  type="button"
                  onClick={() => setSelectedThumb(idx)}
                  style={{
                    height: "70px",
                    borderRadius: "10px",
                    border: idx === selectedThumb ? "2px solid var(--mp-accent)" : "1px solid var(--mp-border)",
                    background: idx === 0 ? product.bgColor : "#fff",
                    fontSize: "28px",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div style={{ borderRadius: "16px", minHeight: "370px", background: selectedThumb === 0 ? product.bgColor : "#f3f7ff", display: "grid", placeItems: "center", fontSize: "145px" }}>
              {gallery[selectedThumb]}
            </div>
          </div>
        </section>

        <section className="mp-panel" style={{ display: "grid", gap: "14px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--mp-muted)", fontWeight: 700 }}>
              {product.categoryName} · SKU {product.sku}
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: "31px", lineHeight: 1.15 }}>{product.name}</h1>
            <p style={{ margin: "0 0 8px", color: "var(--mp-muted)" }}>{product.shortDesc}</p>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7 }}>{product.longDesc}</p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {product.isPromo && <span className="mp-badge mp-badge-promo" style={{ position: "static" }}>Promoción</span>}
            {product.isNew && <span className="mp-badge mp-badge-new" style={{ position: "static" }}>Nuevo</span>}
            {product.isBestseller && <span className="mp-badge mp-badge-best" style={{ position: "static" }}>Más vendido</span>}
          </div>

          <div style={{ borderRadius: "12px", background: "var(--mp-accent-soft)", padding: "14px" }}>
            {product.isPromo && (
              <p style={{ margin: 0, fontSize: "13px", color: "var(--mp-muted)" }}>
                <s>{formatMXN(product.pricePublic)}</s> antes
              </p>
            )}
            <p style={{ margin: "2px 0", fontSize: "34px", color: "var(--mp-accent)", fontWeight: 900 }}>{formatMXN(publicPrice)}</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontWeight: 700 }}>
              Disponible: {product.stock} {product.unit}s · Entrega estimada 24-48 horas
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="button" className="mp-btn mp-btn-ghost" onClick={() => setQty((v) => Math.max(1, v - 1))}>-</button>
            <strong style={{ minWidth: "24px", textAlign: "center" }}>{qty}</strong>
            <button type="button" className="mp-btn mp-btn-ghost" onClick={() => setQty((v) => v + 1)}>+</button>
            <button type="button" className="mp-btn mp-btn-primary" style={{ flex: 1 }} onClick={() => addWithGift(false)}>
              Agregar al carrito
            </button>
          </div>
          <button type="button" className="mp-btn mp-btn-gold mp-btn-lg" onClick={() => addWithGift(true)}>
            Comprar ahora · {formatMXN(publicPrice * qty)}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
            <select className="mp-select" value={wishlistName} onChange={(e) => setWishlistName(e.target.value)}>
              <option>Mis favoritos</option>
              <option>Regalos pendientes</option>
              <option>Recompra mensual</option>
            </select>
            <button type="button" className={`mp-btn ${isWishlisted(product.id) ? "mp-btn-primary" : "mp-btn-outline"}`} onClick={saveWishList}>
              {isWishlisted(product.id) ? "En wishlist" : "Guardar wishlist"}
            </button>
          </div>
          {wishlistSaved && <p style={{ margin: 0, fontSize: "12px", color: "#166534" }}>{wishlistSaved}</p>}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" className="mp-btn mp-btn-ghost">Compartir producto</button>
            <button type="button" className="mp-btn mp-btn-ghost">Clientes también compraron</button>
            <button type="button" className="mp-btn mp-btn-ghost">Sugeridos para regalo</button>
          </div>

          <div style={{ border: "1px solid var(--mp-border)", borderRadius: "12px", padding: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <input type="checkbox" checked={giftEnabled} onChange={(e) => setGiftEnabled(e.target.checked)} />
              ¿Es un regalo?
            </label>
            {giftEnabled && (
              <div style={{ marginTop: "10px", display: "grid", gap: "8px", gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
                <select className="mp-select" value={giftMode} onChange={(e) => setGiftMode(e.target.value as GiftMode)} style={{ gridColumn: "1/-1" }}>
                  <option value="con-remitente">Regalo con remitente</option>
                  <option value="anonimo">Regalo anónimo</option>
                </select>
                {giftMode === "con-remitente" && (
                  <input className="mp-select" type="text" placeholder="Nombre de quien envía" value={giftForm.remitente} onChange={(e) => setGiftForm((f) => ({ ...f, remitente: e.target.value }))} />
                )}
                <input className="mp-select" type="text" placeholder="Nombre de quien recibe" value={giftForm.destinatario} onChange={(e) => setGiftForm((f) => ({ ...f, destinatario: e.target.value }))} />
                <input className="mp-select" type="email" placeholder="Correo destinatario" value={giftForm.correo} onChange={(e) => setGiftForm((f) => ({ ...f, correo: e.target.value }))} />
                <input className="mp-select" type="tel" placeholder="Teléfono destinatario" value={giftForm.telefono} onChange={(e) => setGiftForm((f) => ({ ...f, telefono: e.target.value }))} />
                <input className="mp-select" type="text" placeholder="Dirección de entrega (si cambia)" value={giftForm.direccion} onChange={(e) => setGiftForm((f) => ({ ...f, direccion: e.target.value }))} style={{ gridColumn: "1/-1" }} />
                <textarea className="mp-select" placeholder="Mensaje personalizado" value={giftForm.mensaje} onChange={(e) => setGiftForm((f) => ({ ...f, mensaje: e.target.value }))} style={{ gridColumn: "1/-1" }} />
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--mp-border)", paddingTop: "10px", display: "grid", gap: "4px", fontSize: "13px", color: "var(--mp-muted)" }}>
            <span>Envío estimado: 1-2 días hábiles CDMX, 2-4 días resto del país</span>
            <span>Devoluciones: 30 días en productos sin usar</span>
            <span>Fidelización: 1 punto por cada $10 y bono por recompra</span>
          </div>
        </section>
      </div>

      <section className="mp-panel" style={{ marginTop: "18px" }}>
        <h2 style={{ marginTop: 0 }}>Reseñas y prueba social</h2>
        {reviews.length === 0 ? (
          <p style={{ color: "var(--mp-muted)" }}>Aún no hay reseñas para este producto.</p>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {reviews.slice(0, 3).map((review, idx) => (
              <div key={`${review.author}-${idx}`} style={{ border: "1px solid var(--mp-border)", borderRadius: "10px", padding: "10px" }}>
                <strong>{review.author}</strong>
                <p style={{ margin: "3px 0", fontSize: "13px", color: "var(--mp-muted)" }}>{review.date}</p>
                <p style={{ margin: 0 }}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: "18px" }}>
        <h2 style={{ marginBottom: "12px" }}>Productos relacionados</h2>
        <div className="mp-product-grid">
          {related.map((p) => (
            <div key={p.id} className="mp-product-card">
              <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-img-wrap">
                <div className="mp-product-img" style={{ background: p.bgColor }}>
                  <span style={{ fontSize: "68px" }}>{p.icon}</span>
                </div>
              </Link>
              <div className="mp-product-body">
                <p className="mp-product-category">{p.categoryName}</p>
                <Link to={`/demo/mercaplus/producto/${p.id}`} className="mp-product-name">{p.name}</Link>
                <span className="mp-price-main">{formatMXN(p.pricePublic)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
