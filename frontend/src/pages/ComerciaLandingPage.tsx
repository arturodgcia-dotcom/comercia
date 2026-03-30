import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { AgentWidgetPlaceholder } from "../components/marketing/AgentWidgetPlaceholder";
import { AudienceSplitSection } from "../components/marketing/AudienceSplitSection";
import { CTASection } from "../components/marketing/CTASection";
import { HeroSection } from "../components/marketing/HeroSection";
import { PackageCard } from "../components/marketing/PackageCard";
import { SolutionCard } from "../components/marketing/SolutionCard";
import { api } from "../services/api";

export function ComerciaLandingPage() {
  const [searchParams] = useSearchParams();
  const refQuery = searchParams.get("ref") ?? "";
  const [refStatus, setRefStatus] = useState<"unknown" | "valid" | "invalid">("unknown");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [leadForm, setLeadForm] = useState({
    company_name: "",
    legal_type: "constituted_company",
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
    selected_plan_code: "COMERCIA_IMPULSA",
    referral_code: refQuery,
    needs_followup: true,
    needs_appointment: false,
    notes: ""
  });

  useEffect(() => {
    if (!refQuery) return;
    api
      .getComerciaReferralValidation(refQuery)
      .then((result) => setRefStatus(result.valid ? "valid" : "invalid"))
      .catch(() => setRefStatus("invalid"));
  }, [refQuery]);

  const handleLeadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await api.createComerciaPlanPurchaseLead({
        ...leadForm,
        purchase_status: "initiated",
        source_type: refQuery ? "query_param" : leadForm.referral_code ? "manual_code" : "direct",
        referral_code: leadForm.referral_code || undefined
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar el lead comercial");
    }
  };

  return (
    <main className="marketing-shell">
      <div className="row-gap" style={{ justifyContent: "flex-end" }}>
        <LanguageSelector />
      </div>
      <HeroSection
        eyebrow="ComerCia by REINPIA"
        title="Convierte tu negocio en una maquina de ventas con ComerCia"
        subtitle="Landing, ecommerce, marketing, automatizacion y fidelizacion en una sola plataforma para negocios que quieren crecer de verdad."
        primaryLabel="Quiero mi diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Ver paquetes"
        secondaryTo="#paquetes"
      />

      <section>
        <h2>Modelo plataforma madre + marcas hijas</h2>
        <div className="card-grid">
          <SolutionCard title="ComerCia (plataforma madre)" description="Administra marcas, workflows, reportes globales, seguridad y crecimiento comercial." />
          <SolutionCard title="Marcas cliente (tenants)" description="Cada marca opera de forma independiente con landing, ecommerce y POS propios." />
          <SolutionCard title="REINPIA como primer cliente" description="REINPIA funciona como marca cliente inicial dentro de ComerCia, no como plataforma madre." />
        </div>
      </section>

      <section>
        <h2>Para quien es ComerCia</h2>
        <p>
          ComerCia esta pensada para negocios formalmente establecidos o con actividad empresarial, para poder integrar pagos,
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
          <SolutionCard title="Marketing de arranque" description="Activacion inicial para captar demanda con campanas ordenadas." tag="Arranque" />
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

      <section>
        <h2>Servicios adicionales activables</h2>
        <div className="card-grid">
          <SolutionCard
            title="Logistica personalizada"
            description="Configuracion de recoleccion, envio y operacion por marca, con consulta del servicio."
            tag="Operacion"
          />
          <SolutionCard
            title="Membresias y credenciales inteligentes"
            description="Credenciales digitales/fisicas con QR y NFC opcional para publico, distribuidores y empleados."
            tag="Identificacion"
          />
          <SolutionCard
            title="Cobros digitales desde el celular"
            description="Links de pago y QR de cobro para POS/WebApp con arquitectura lista para Mercado Pago."
            tag="Pagos POS"
          />
        </div>
        <div className="card-grid">
          <article className="card">
            <h3>Activacion NFC opcional</h3>
            <p>Activacion inicial: 500 MXN</p>
          </article>
          <article className="card">
            <h3>Activacion cobros digitales POS</h3>
            <p>Activacion inicial: 500 MXN</p>
          </article>
        </div>
      </section>

      <section id="paquetes">
        <h2>Paquetes ComerCia</h2>
        <div className="card-grid">
          <PackageCard
            name="ComerCia IMPULSA"
            subtitle="Para iniciar, ordenar y acelerar tu negocio"
            focus="Ideal para micro, pequenas y medianas empresas que necesitan traccion rapida con base comercial."
            includes={["Landing y ecommerce base", "Marketing de arranque", "Operacion inicial ordenada"]}
            primaryTo="#diagnostico"
            secondaryTo="#diagnostico"
          />
          <PackageCard
            name="ComerCia ESCALA"
            subtitle="Para crecer, automatizar y expandir tu marca con mas fuerza"
            focus="Pensado para medianas PyMEs y empresas que requieren crecimiento fuerte y operacion robusta."
            includes={["Automatizacion comercial avanzada", "Canal distribuidor con mayor control", "Escalamiento por etapas"]}
            primaryTo="#diagnostico"
            secondaryTo="#diagnostico"
          />
        </div>
      </section>

      <AgentWidgetPlaceholder
        name="Lia de ComerCia"
        description="Agente comercial que te orienta para elegir paquete segun etapa del negocio, formalidad y objetivo comercial."
        bullets={["Evalua etapa comercial", "Sugiere paquete recomendado", "Deja ruta de implementacion inicial"]}
        accent="#1c5fd4"
      />

      <AudienceSplitSection
        title="Ruta de activacion comercial"
        leftTitle="Quiero diagnostico rapido"
        leftBullets={["Diagnostico comercial inicial", "Recomendacion de paquete", "Plan de arranque en etapas"]}
        rightTitle="Quiero hablar con asesor"
        rightBullets={["Sesion de enfoque comercial", "Definicion de alcance y tiempos", "Ruta operativa para implementacion"]}
      />

      <section id="diagnostico" className="store-banner">
        <h2>Diagnostico comercial</h2>
        <p>Comparte tus datos y te guiamos al paquete correcto. Solo para empresas constituidas o actividad empresarial.</p>
        <form className="inline-form" onSubmit={handleLeadSubmit}>
          <input required placeholder="Empresa" value={leadForm.company_name} onChange={(e) => setLeadForm((p) => ({ ...p, company_name: e.target.value }))} />
          <select value={leadForm.legal_type} onChange={(e) => setLeadForm((p) => ({ ...p, legal_type: e.target.value }))}>
            <option value="constituted_company">Empresa constituida</option>
            <option value="actividad_empresarial">Actividad empresarial</option>
            <option value="other">Otro</option>
          </select>
          <input required placeholder="Nombre comprador" value={leadForm.buyer_name} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_name: e.target.value }))} />
          <input required placeholder="Email comprador" value={leadForm.buyer_email} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_email: e.target.value }))} />
          <input required placeholder="Telefono comprador" value={leadForm.buyer_phone} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_phone: e.target.value }))} />
          <select value={leadForm.selected_plan_code} onChange={(e) => setLeadForm((p) => ({ ...p, selected_plan_code: e.target.value }))}>
            <option value="COMERCIA_IMPULSA">ComerCia IMPULSA</option>
            <option value="COMERCIA_ESCALA">ComerCia ESCALA</option>
          </select>
          <input
            placeholder="Clave de comisionista (opcional)"
            value={leadForm.referral_code}
            onChange={(e) => setLeadForm((p) => ({ ...p, referral_code: e.target.value.toUpperCase() }))}
          />
          <label className="checkbox">
            <input type="checkbox" checked={leadForm.needs_followup} onChange={(e) => setLeadForm((p) => ({ ...p, needs_followup: e.target.checked }))} />
            Solicito seguimiento comercial
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={leadForm.needs_appointment} onChange={(e) => setLeadForm((p) => ({ ...p, needs_appointment: e.target.checked }))} />
            Solicito cita de diagnostico
          </label>
          <input placeholder="Notas" value={leadForm.notes} onChange={(e) => setLeadForm((p) => ({ ...p, notes: e.target.value }))} />
          <button className="button" type="submit">
            Registrar lead de plan
          </button>
        </form>
        {refQuery ? <p>Referencia detectada: {refQuery} ({refStatus === "valid" ? "valida" : refStatus === "invalid" ? "invalida" : "verificando"})</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {submitted ? <p>Lead registrado. El equipo comercial y contable ya fue notificado internamente.</p> : null}
      </section>

      <CTASection
        title="Tu marca puede vender mejor, crecer mas rapido y operar con mas inteligencia."
        subtitle="Activa una estructura comercial real con ComerCia."
        primaryLabel="Solicitar diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Iniciar con ComerCia"
        secondaryTo="/login"
      />
    </main>
  );
}
