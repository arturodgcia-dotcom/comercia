import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function BrandCapacityExpansionPage() {
  return (
    <section>
      <PageHeader
        title="Expandir capacidad"
        subtitle="Las compras de add-ons y solicitudes de upgrade se centralizaron en Resumen de marca."
      />

      <article className="card">
        <h3>Gestión centralizada</h3>
        <p>
          Para evitar vistas duplicadas, el catálogo de add-ons, consumo por capacidad y acciones de crecimiento ahora se
          gestiona desde <strong>Resumen de marca</strong>.
        </p>
        <div className="row-gap">
          <Link className="button" to="/">
            Ir a Resumen de marca
          </Link>
          <Link className="button button-outline" to="/plans">
            Ver plan activo y soporte
          </Link>
        </div>
      </article>
    </section>
  );
}
