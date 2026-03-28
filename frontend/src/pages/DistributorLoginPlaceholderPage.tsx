import { Link, useParams } from "react-router-dom";

export function DistributorLoginPlaceholderPage() {
  const { tenantSlug } = useParams();
  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>Login de distribuidores (placeholder)</h1>
        <p>Base preparada para integrar autenticacion dedicada de distribuidores en siguiente fase.</p>
        <div className="store-actions">
          <Link className="button button-outline" to={`/store/${tenantSlug}/distribuidores/registro`}>
            Ir a registro
          </Link>
          <Link className="button button-outline" to={`/store/${tenantSlug}`}>
            Volver a tienda
          </Link>
        </div>
      </section>
    </main>
  );
}

