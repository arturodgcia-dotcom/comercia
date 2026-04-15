import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function PlansPage() {
  return (
    <section>
      <PageHeader
        title="Plan activo y soporte"
        subtitle="Esta vista se consolidó en Resumen de marca para evitar información comercial duplicada."
      />

      <article className="card">
        <h3>Fuente de verdad comercial</h3>
        <p>
          El plan activo, modelo de cobro, comisión, límites, consumo, créditos IA, soporte y acciones de crecimiento
          viven ahora en <strong>Resumen de marca</strong>.
        </p>
        <div className="row-gap">
          <Link className="button" to="/">
            Ir a Resumen de marca
          </Link>
          <Link className="button button-outline" to="/admin/capacity-expand">
            Expandir capacidad
          </Link>
        </div>
      </article>
    </section>
  );
}
