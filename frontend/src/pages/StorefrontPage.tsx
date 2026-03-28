import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { StorefrontPayload } from "../types/domain";

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefront(tenantSlug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar storefront"));
  }, [tenantSlug]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando storefront...</p>;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>{data.branding?.hero_title ?? data.tenant.name}</h1>
        <p>{data.branding?.hero_subtitle ?? "Landing base multitenant de COMERCIA"}</p>
        <div className="store-actions">
          <Link to={`/store/${data.tenant.slug}/distribuidores`} className="button">
            Distribuidores
          </Link>
        </div>
      </section>

      <section className="store-banner">
        <h2>Banner principal</h2>
        <p>{data.storefront_config?.promotion_text ?? "Placeholder para promociones"}</p>
      </section>

      <section>
        <h2>Categorias</h2>
        <div className="chip-row">
          {data.categories.map((category) => (
            <span key={category.id} className="chip">
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Productos destacados</h2>
        <div className="card-grid">
          {data.featured_products.map((product) => (
            <article key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${Number(product.price_public).toLocaleString("es-MX")}</strong>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Productos recientes</h2>
        <div className="card-grid">
          {data.recent_products.map((product) => (
            <article key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="store-promo-placeholder">
        <h2>Productos en promocion</h2>
        <p>Espacio base para modulo de promociones por tenant.</p>
      </section>
    </main>
  );
}
