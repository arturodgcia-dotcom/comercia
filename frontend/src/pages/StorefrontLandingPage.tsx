import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { StorefrontHomePayload } from "../types/domain";

export function StorefrontLandingPage() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar la landing de la marca."));
  }, [tenantSlug]);

  if (error) {
    return (
      <main className="storefront">
        <section className="store-banner">
          <h1>Landing de marca no disponible</h1>
          <p className="error">{error}</p>
          <Link className="button" to={`/store/${tenantSlug}`}>
            Ir al ecommerce publico
          </Link>
        </section>
      </main>
    );
  }

  if (!data) return <p>Cargando landing de marca...</p>;

  const isPreview = searchParams.get("preview") === "1";

  return (
    <main className="storefront premium-store">
      <section
        className="store-hero premium-hero"
        style={{
          background: `linear-gradient(130deg, ${data.branding?.primary_color ?? "#0d3e86"}, ${
            data.branding?.secondary_color ?? "#5f97e3"
          })`,
        }}
      >
        <p className="marketing-eyebrow">{isPreview ? "Preview landing" : "Landing publicada"}</p>
        <h1>{data.branding?.hero_title ?? `${data.tenant.name} en COMERCIA`}</h1>
        <p>
          {data.branding?.hero_subtitle ??
            "Landing comercial tenant-aware conectada con ecommerce publico, canal distribuidores y operacion POS."}
        </p>
        <div className="row-gap">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            Ir al ecommerce publico
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores`}>
            Ir al canal distribuidores
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Marca</h3>
          <p>{data.tenant.name}</p>
          <p className="muted">Slug: {data.tenant.slug}</p>
        </article>
        <article className="card">
          <h3>Catalogo listo</h3>
          <p>{data.featured_products.length + data.recent_products.length} productos visibles</p>
        </article>
        <article className="card">
          <h3>Canales conectados</h3>
          <p>Ecommerce publico + distribuidores + POS en el mismo tenant activo.</p>
        </article>
      </section>
    </main>
  );
}
