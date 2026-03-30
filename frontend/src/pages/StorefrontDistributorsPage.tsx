import { useEffect, useMemo, useState } from "react";
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

  const stats = useMemo(() => {
    const total = data?.distributors.length ?? 0;
    return {
      total,
      activos: total,
      beneficios: ["Precios menudeo/mayoreo", "Pedidos recurrentes", "Atención comercial dedicada"],
    };
  }, [data]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando distribuidores...</p>;

  return (
    <main className="storefront distributors-store">
      <section className="store-hero premium-hero distributors-hero">
        <p className="marketing-eyebrow">Canal comercial para negocios</p>
        <h1>Canal distribuidores de {data.tenant.name}</h1>
        <p>
          Esta sección está diseñada para comercios y distribuidores que requieren precios de volumen, recompra y
          beneficios comerciales diferenciados.
        </p>
        <div className="store-actions">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            Volver a tienda pública
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
            Solicitar registro comercial
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/login-placeholder`}>
            Acceso distribuidores
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Reglas de volumen</h3>
          <p>Se aplican precios escalonados por menudeo/mayoreo y mínimos por operación comercial.</p>
        </article>
        <article className="card">
          <h3>Compra recurrente</h3>
          <p>El canal soporta pedidos programados para mantener continuidad de inventario.</p>
        </article>
        <article className="card">
          <h3>Beneficios comerciales</h3>
          <ul className="marketing-list">
            {stats.beneficios.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="store-layout">
        <article className="store-banner">
          <h2>Directorio comercial activo</h2>
          <div className="card-grid">
            {data.distributors.length === 0 ? <p>No hay distribuidores activos por el momento.</p> : null}
            {data.distributors.map((distributor) => (
              <article key={distributor.id} className="card">
                <h3>{distributor.full_name}</h3>
                <p>Email: {distributor.email ?? "No definido"}</p>
                <p>Teléfono: {distributor.phone ?? "No definido"}</p>
                <p className="muted">Estado: {distributor.is_active ? "Activo" : "Inactivo"}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="store-banner">
          <h2>Resumen del canal</h2>
          <p>Distribuidores activos: {stats.activos}</p>
          <p>Perfil de compra: menudeo y mayoreo.</p>
          <p>Recurrencia: disponible para reposición periódica.</p>
          <Link className="button" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
            Iniciar proceso de autorización
          </Link>
        </aside>
      </section>
    </main>
  );
}
