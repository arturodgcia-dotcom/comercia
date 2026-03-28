import { FormEvent, useState } from "react";
import { AgentWidgetPlaceholder } from "../components/marketing/AgentWidgetPlaceholder";
import { AudienceSplitSection } from "../components/marketing/AudienceSplitSection";
import { CTASection } from "../components/marketing/CTASection";
import { HeroSection } from "../components/marketing/HeroSection";
import { PackageCard } from "../components/marketing/PackageCard";
import { SolutionCard } from "../components/marketing/SolutionCard";

export function ComerciaLandingPage() {
  const [leadForm, setLeadForm] = useState({
    company: "",
    contact: "",
    plan_interest: "COMERCIA IMPULSA"
  });
  const [submitted, setSubmitted] = useState(false);

  const handleLeadSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="marketing-shell">
      <HeroSection
        eyebrow="COMERCIA by REINPIA"
        title="Convierte tu negocio en una maquina de ventas con COMERCIA"
        subtitle="Landing, ecommerce, marketing, automatizacion y fidelizacion en una sola plataforma para negocios que quieren crecer de verdad."
        primaryLabel="Quiero mi diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Ver paquetes"
        secondaryTo="#paquetes"
      />

      <section>
        <h2>Para quien es COMERCIA</h2>
        <p>
          COMERCIA esta pensada para negocios formalmente establecidos o con actividad empresarial, para poder integrar pagos,
          operacion y crecimiento de forma ordenada.
        </p>
        <div className="card-grid">
          <SolutionCard title="Empresas constituidas" description="Negocios que necesitan ventas y operacion digital con estructura." />
          <SolutionCard title="Personas fisicas con actividad empresarial" description="Profesionales y comercios listos para cobrar y escalar formalmente." />
          <SolutionCard title="Marcas con productos o servicios" description="Modelos orientados a ecommerce, servicios o esquemas mixtos." />
          <SolutionCard title="Comercios que buscan crecer formalmente" description="Procesos claros para vender mejor, repetir compra y medir resultados." />
        </div>
      </section>

      <section>
        <h2>Que incluye</h2>
        <div className="card-grid">
          <SolutionCard title="Landing profesional por marca" description="Mensajes y conversion orientados a performance comercial." tag="Branding" />
          <SolutionCard title="Ecommerce para publico y distribuidores" description="Venta directa y canal comercial en una sola operacion." tag="Ventas" />
          <SolutionCard title="Marketing de arranque" description="Activacion inicial para captar demanda con campañas ordenadas." tag="Arranque" />
          <SolutionCard title="Automatizacion comercial" description="Flujos para responder, vender y dar seguimiento con menos friccion." tag="IA" />
          <SolutionCard title="Fidelizacion y recompra" description="Puntos, cupones y membresias para elevar ticket y recurrencia." tag="Growth" />
          <SolutionCard title="Escalamiento por etapas" description="Base robusta para crecer sin rehacer toda la operacion." tag="Escala" />
        </div>
      </section>

      <section>
        <h2>Como trabajamos</h2>
        <div className="card-grid">
          <SolutionCard title="Impulsamos tu marca" description="Definimos propuesta comercial y configuramos tu presencia digital." />
          <SolutionCard title="Activamos tus ventas" description="Lanzamos flujo comercial y optimizamos conversion desde el inicio." />
          <SolutionCard title="Escalamos tu crecimiento" description="Automatizamos operacion para vender mas con mejor control." />
        </div>
      </section>

      <section id="paquetes">
        <h2>Paquetes COMERCIA</h2>
        <div className="card-grid">
          <PackageCard
            name="COMERCIA IMPULSA"
            subtitle="Para iniciar, ordenar y acelerar tu negocio"
            focus="Ideal para micro, pequenas y medianas empresas que necesitan traccion rapida con base comercial."
            includes={["Landing y ecommerce base", "Marketing de arranque", "Operacion inicial ordenada"]}
            primaryTo="#diagnostico"
            secondaryTo="#diagnostico"
          />
          <PackageCard
            name="COMERCIA ESCALA"
            subtitle="Para crecer, automatizar y expandir tu marca con mas fuerza"
            focus="Pensado para medianas PyMEs y empresas que requieren crecimiento fuerte y operacion robusta."
            includes={["Automatizacion comercial avanzada", "Canal distribuidor con mayor control", "Escalamiento por etapas"]}
            primaryTo="#diagnostico"
            secondaryTo="#diagnostico"
          />
        </div>
      </section>

      <AgentWidgetPlaceholder
        name="Lia de COMERCIA"
        description="Agente comercial que te orienta para elegir paquete segun etapa del negocio, formalidad y objetivo comercial."
        bullets={[
          "Evalua etapa comercial",
          "Sugiere paquete recomendado",
          "Deja ruta de implementacion inicial"
        ]}
        accent="#1c5fd4"
      />

      <AudienceSplitSection
        title="Ruta de activacion comercial"
        leftTitle="Quiero diagnostico rapido"
        leftBullets={[
          "Diagnostico comercial inicial",
          "Recomendacion de paquete",
          "Plan de arranque en etapas"
        ]}
        rightTitle="Quiero hablar con asesor"
        rightBullets={[
          "Sesion de enfoque comercial",
          "Definicion de alcance y tiempos",
          "Ruta operativa para implementacion"
        ]}
      />

      <section id="diagnostico" className="store-banner">
        <h2>Diagnostico comercial</h2>
        <p>Comparte tus datos y te guiamos al paquete correcto.</p>
        <form className="inline-form" onSubmit={handleLeadSubmit}>
          <input
            required
            placeholder="Nombre de empresa"
            value={leadForm.company}
            onChange={(e) => setLeadForm((p) => ({ ...p, company: e.target.value }))}
          />
          <input
            required
            placeholder="Contacto"
            value={leadForm.contact}
            onChange={(e) => setLeadForm((p) => ({ ...p, contact: e.target.value }))}
          />
          <select
            value={leadForm.plan_interest}
            onChange={(e) => setLeadForm((p) => ({ ...p, plan_interest: e.target.value }))}
          >
            <option value="COMERCIA IMPULSA">COMERCIA IMPULSA</option>
            <option value="COMERCIA ESCALA">COMERCIA ESCALA</option>
          </select>
          <button className="button" type="submit">
            Solicitar diagnostico
          </button>
        </form>
        {submitted ? <p>Solicitud recibida. Un asesor de COMERCIA te contactara pronto.</p> : null}
      </section>

      <CTASection
        title="Tu marca puede vender mejor, crecer mas rapido y operar con mas inteligencia."
        subtitle="Activa una estructura comercial real con COMERCIA."
        primaryLabel="Solicitar diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Iniciar con COMERCIA"
        secondaryTo="/login"
      />
    </main>
  );
}

