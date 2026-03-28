import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { StorefrontDistributorsPayload } from "../types/domain";

export function StorefrontDistributorsPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontDistributorsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontDistributors(tenantSlug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [tenantSlug]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando distribuidores...</p>;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>Distribuidores de {data.tenant.name}</h1>
        <p>Directorio publico base para canal de distribuidores.</p>
        <div className="store-actions">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            Volver a tienda
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
            Solicitar registro
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/login-placeholder`}>
            Login placeholder
          </Link>
        </div>
      </section>

      <section>
        <h2>Listado</h2>
        <div className="card-grid">
          {data.distributors.length === 0 ? <p>No hay distribuidores activos.</p> : null}
          {data.distributors.map((distributor) => (
            <article key={distributor.id} className="card">
              <h3>{distributor.full_name}</h3>
              <p>{distributor.email}</p>
              <p>{distributor.phone}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
