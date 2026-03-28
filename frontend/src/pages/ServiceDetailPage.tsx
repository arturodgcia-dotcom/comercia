import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { ServiceOffering, StorefrontHomePayload } from "../types/domain";

const DEMO_CUSTOMER_ID = 1;

export function ServiceDetailPage() {
  const { tenantSlug, serviceId } = useParams();
  const [home, setHome] = useState<StorefrontHomePayload | null>(null);
  const [service, setService] = useState<ServiceOffering | null>(null);
  const [error, setError] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [giftForm, setGiftForm] = useState({
    gift_sender_name: "",
    gift_sender_email: "",
    gift_is_anonymous: false,
    gift_message: "",
    gift_recipient_name: "",
    gift_recipient_email: "",
    gift_recipient_phone: ""
  });

  useEffect(() => {
    if (!tenantSlug || !serviceId) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then((data) => {
        setHome(data);
        const selected = data.services.find((item) => item.id === Number(serviceId));
        if (!selected) throw new Error("Servicio no encontrado");
        setService(selected);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar servicio"));
  }, [tenantSlug, serviceId]);

  const minDate = useMemo(() => new Date().toISOString().slice(0, 16), []);

  const handleCheckout = async (event: FormEvent) => {
    event.preventDefault();
    if (!home || !service || !scheduleAt) return;
    try {
      const response = await api.createCheckoutSession({
        tenant_id: home.tenant.id,
        items: [{ service_offering_id: service.id, quantity: 1 }],
        success_url: `${window.location.origin}/store/${home.tenant.slug}/services?checkout=success`,
        cancel_url: `${window.location.origin}/store/${home.tenant.slug}/services?checkout=cancel`,
        customer_id: DEMO_CUSTOMER_ID,
        applies_to: "public",
        is_gift: isGift,
        gift_sender_name: isGift ? giftForm.gift_sender_name : undefined,
        gift_sender_email: isGift ? giftForm.gift_sender_email : undefined,
        gift_is_anonymous: isGift ? giftForm.gift_is_anonymous : undefined,
        gift_message: isGift ? giftForm.gift_message : undefined,
        gift_recipient_name: isGift ? giftForm.gift_recipient_name : undefined,
        gift_recipient_email: isGift ? giftForm.gift_recipient_email : undefined,
        gift_recipient_phone: isGift ? giftForm.gift_recipient_phone : undefined,
        appointment_scheduled_for: new Date(scheduleAt).toISOString()
      });
      window.location.href = response.session_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar checkout de servicio");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!home || !service) return <p>Cargando servicio...</p>;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>{service.name}</h1>
        <p>{service.description}</p>
        <p>Duracion: {service.duration_minutes} min</p>
        <p>Precio: ${Number(service.price).toLocaleString("es-MX")}</p>
        <Link className="button button-outline" to={`/store/${home.tenant.slug}/services`}>
          Volver a servicios
        </Link>
      </section>
      <section className="store-banner">
        <h2>Reservar servicio</h2>
        <form className="detail-form" onSubmit={handleCheckout}>
          <label>
            Fecha y hora
            <input type="datetime-local" min={minDate} required value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
            Comprar como regalo
          </label>
          {isGift ? (
            <>
              <label>
                Remitente
                <input
                  required
                  value={giftForm.gift_sender_name}
                  onChange={(e) => setGiftForm((p) => ({ ...p, gift_sender_name: e.target.value }))}
                />
              </label>
              <label>
                Email remitente
                <input
                  required
                  value={giftForm.gift_sender_email}
                  onChange={(e) => setGiftForm((p) => ({ ...p, gift_sender_email: e.target.value }))}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={giftForm.gift_is_anonymous}
                  onChange={(e) => setGiftForm((p) => ({ ...p, gift_is_anonymous: e.target.checked }))}
                />
                Regalo anonimo
              </label>
              <label>
                Mensaje
                <textarea value={giftForm.gift_message} onChange={(e) => setGiftForm((p) => ({ ...p, gift_message: e.target.value }))} />
              </label>
              <label>
                Receptor
                <input
                  required
                  value={giftForm.gift_recipient_name}
                  onChange={(e) => setGiftForm((p) => ({ ...p, gift_recipient_name: e.target.value }))}
                />
              </label>
              <label>
                Email receptor
                <input
                  required
                  value={giftForm.gift_recipient_email}
                  onChange={(e) => setGiftForm((p) => ({ ...p, gift_recipient_email: e.target.value }))}
                />
              </label>
              <label>
                Telefono receptor
                <input value={giftForm.gift_recipient_phone} onChange={(e) => setGiftForm((p) => ({ ...p, gift_recipient_phone: e.target.value }))} />
              </label>
            </>
          ) : null}
          <button className="button" type="submit">
            Pagar y reservar
          </button>
        </form>
      </section>
    </main>
  );
}

