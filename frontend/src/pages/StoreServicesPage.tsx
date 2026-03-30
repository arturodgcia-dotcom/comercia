import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { ServiceOffering, Tenant } from "../types/domain";

export function StoreServicesPage() {
  const { tenantSlug } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontServices(tenantSlug)
      .then((response) => {
        setTenant(response.tenant);
        setServices(response.services);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar servicios"));
  }, [tenantSlug]);

  if (error) return <p className="error">{error}</p>;
  if (!tenant) return <p>Cargando servicios...</p>;

  return (
    <main className="storefront premium-store">
      <section className="store-hero premium-hero">
        <h1>{tenant.slug === "reinpia" ? "Ecommerce de servicios REINPIA" : `Servicios de ${tenant.name}`}</h1>
        <p>
          {tenant.slug === "reinpia"
            ? "Renta de plataformas, implementaciones y automatizacion comercial orientada a crecimiento."
            : "Reserva para ti o compra como regalo desde esta seccion."}
        </p>
        <Link className="button button-outline" to={`/store/${tenant.slug}`}>
          Volver a tienda
        </Link>
      </section>
      <section>
        <div className="card-grid">
          {services.map((service) => (
            <article key={service.id} className="card product-card-premium">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <p>Duración: {service.duration_minutes} min</p>
              <p className="product-price">${Number(service.price).toLocaleString("es-MX")}</p>
              <Link className="button" to={`/store/${tenant.slug}/service/${service.id}`}>
                Reservar
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
