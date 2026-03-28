import { Link } from "react-router-dom";
import { AgentWidgetPlaceholder } from "../components/marketing/AgentWidgetPlaceholder";
import { AudienceSplitSection } from "../components/marketing/AudienceSplitSection";
import { CTASection } from "../components/marketing/CTASection";
import { HeroSection } from "../components/marketing/HeroSection";
import { SolutionCard } from "../components/marketing/SolutionCard";
import { ServiceOffering, StorefrontHomePayload } from "../types/domain";

export function ReinpiaStorefrontLanding({ data }: { data: StorefrontHomePayload }) {
  const services = data.services ?? [];
  return (
    <main className="marketing-shell">
      <HeroSection
        eyebrow="REINPIA | Tecnologia aplicada a resultados"
        title="Desarrollamos tecnologia que convierte procesos en crecimiento"
        subtitle="En REINPIA creamos plataformas, automatizaciones y sistemas con inteligencia artificial para empresas que quieren operar mejor, vender mas y escalar con estructura."
        primaryLabel="Conocer soluciones"
        primaryTo="#soluciones"
        secondaryLabel="Solicitar propuesta"
        secondaryTo="#servicios"
      />

      <section>
        <h2>Que hacemos</h2>
        <div className="card-grid">
          <SolutionCard title="Desarrollo tecnologico" description="Arquitectura y software listos para crecer con tu empresa." />
          <SolutionCard title="Automatizacion con IA" description="Procesos comerciales y operativos conectados a resultados." />
          <SolutionCard title="Plataformas SaaS" description="Productos propios listos para operar y escalar." />
          <SolutionCard title="Soluciones comerciales" description="Sistemas para activar ventas, seguimiento y conversion." />
          <SolutionCard title="Desarrollo a la medida" description="Construimos tecnologia cuando tu negocio requiere algo unico." />
        </div>
      </section>

      <section id="soluciones">
        <h2>Soluciones destacadas</h2>
        <div className="card-grid">
          <SolutionCard title="COMERCIA" description="Plataforma SaaS para ventas, ecommerce y crecimiento comercial." tag="SaaS Comercial" />
          <SolutionCard title="NERVIA" description="Operacion inteligente para procesos internos y control ejecutivo." tag="Operacion" />
          <SolutionCard title="SprintPilot" description="Ejecucion, planeacion y seguimiento para equipos de alto rendimiento." tag="Productividad" />
          <SolutionCard title="Soluciones a la medida" description="Proyectos especiales para necesidades especificas de tu empresa." tag="Custom" />
        </div>
      </section>

      <AudienceSplitSection
        title="Modelo comercial"
        leftTitle="Publico general"
        leftBullets={["Contratacion de servicios", "Renta de plataformas", "Automatizaciones y mejora operativa"]}
        rightTitle="Agencias / distribuidores"
        rightBullets={[
          "Integracion comercial",
          "Comercializacion de soluciones",
          "Acceso al canal distribuidor"
        ]}
      />

      <AgentWidgetPlaceholder
        name="SofIA by REINPIA"
        description="Agente IA que orienta al visitante para identificar la solucion ideal segun su etapa y objetivo."
        bullets={[
          "Diagnostico rapido del contexto",
          "Recomendacion de solucion y alcance",
          "Siguiente paso comercial sugerido"
        ]}
        accent="#1a6e72"
      />

      <section id="servicios">
        <h2>Ecommerce de servicios REINPIA</h2>
        <div className="card-grid">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} tenantSlug={data.tenant.slug} />
          ))}
        </div>
      </section>

      <CTASection
        title="Tu empresa no necesita mas improvisacion. Necesita tecnologia bien construida."
        subtitle="Activa servicios, automatizacion y canal comercial con estructura real."
        primaryLabel="Ir al ecommerce de servicios"
        primaryTo={`/store/${data.tenant.slug}/services`}
        secondaryLabel="Quiero ser agencia/distribuidor"
        secondaryTo={`/store/${data.tenant.slug}/distribuidores/registro`}
      />
    </main>
  );
}

function ServiceCard({ service, tenantSlug }: { service: ServiceOffering; tenantSlug: string }) {
  return (
    <article className="card marketing-card">
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <p>Duracion: {service.duration_minutes} min</p>
      <p>Desde ${Number(service.price).toLocaleString("es-MX")}</p>
      <div className="store-actions">
        <Link className="button" to={`/store/${tenantSlug}/service/${service.id}`}>
          Solicitar servicio
        </Link>
      </div>
    </article>
  );
}

