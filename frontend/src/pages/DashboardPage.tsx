import { PageHeader } from "../components/PageHeader";

const modules = [
  "Landing Generator",
  "Ecommerce Multitenant",
  "Fidelizacion",
  "Distribuidores",
  "Servicios y Agenda",
  "Logistica",
  "Bots y Agentes",
  "Dashboard Central REINPIA"
];

export function DashboardPage() {
  return (
    <section>
      <PageHeader
        title="Dashboard Central"
        subtitle="Vista inicial para operacion multitenant de COMERCIA by REINPIA."
      />
      <div className="card-grid">
        {modules.map((module) => (
          <article key={module} className="card">
            <h3>{module}</h3>
            <p>Base inicial lista para evolucionar en siguientes iteraciones.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
