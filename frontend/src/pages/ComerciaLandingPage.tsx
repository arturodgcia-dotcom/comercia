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
    notes: "",
  });

  useEffect(() => {
    if (!refQuery) return;
    api
      .getComerciaReferralValidation(refQuery)
      .then((result) => setRefStatus(result.valid ? "valid" : "invalid"))
      .catch(() => setRefStatus("invalid"));
  }, [refQuery]);

  useEffect(() => {
    document.body.classList.add("public-landing");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    return () => {
      document.body.classList.remove("public-landing");
    };
  }, []);

  const handleLeadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await api.createComerciaPlanPurchaseLead({
        ...leadForm,
        purchase_status: "initiated",
        source_type: refQuery ? "query_param" : leadForm.referral_code ? "manual_code" : "direct",
        referral_code: leadForm.referral_code || undefined,
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
        subtitle="Landing premium, ecommerce por canal, automatizacion comercial y operacion integrada para marcas que quieren crecer con orden y resultados medibles."
        primaryLabel="Quiero mi diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Ver paquetes"
        secondaryTo="#paquetes"
      />

      <section className="card-grid">
        <SolutionCard
          title="Mas conversion desde el primer mes"
          description="Landing y ecommerce pensados para vender, no para verse bonitos sin resultados."
          tag="Impacto comercial"
        />
        <SolutionCard
          title="Canales de venta separados"
          description="Publico y distribuidores con experiencias distintas, precios y reglas por canal."
          tag="Control"
        />
        <SolutionCard
          title="Operacion con visibilidad real"
          description="Logistica, fidelizacion, seguimiento comercial y reportes accionables en un solo lugar."
          tag="Operacion"
        />
      </section>

      <section>
        <h2>Para que tipo de marca fue creado ComerCia</h2>
        <p>
          ComerCia esta pensada para empresas constituidas o personas con actividad empresarial que necesitan vender,
          operar y crecer con una estructura comercial clara.
        </p>
        <div className="card-grid">
          <SolutionCard title="Marcas de productos" description="Ecommerce retail con promociones, recompra y control por canal." />
          <SolutionCard title="Marcas de servicios" description="Venta de servicios, agenda, seguimiento y conversion consultiva." />
          <SolutionCard title="Modelos mixtos" description="Productos, servicios y canal distribuidor en una misma operacion." />
        </div>
      </section>

      <section>
        <h2>Que incluye ComerCia</h2>
        <div className="card-grid">
          <SolutionCard title="Landing premium por marca" description="Mensaje comercial fuerte, bloques configurables y CTA orientados a cierre." tag="Landing" />
          <SolutionCard title="Ecommerce publico premium" description="Sensacion retail real con categorias, destacados, promos y checkout." tag="Retail" />
          <SolutionCard title="Ecommerce distribuidores" description="Canal B2B con reglas de volumen, precios diferenciados y compra recurrente." tag="B2B" />
          <SolutionCard title="Automatizacion comercial" description="Flujos para seguimiento, atencion y activacion de oportunidades." tag="Automatizacion" />
          <SolutionCard title="Fidelizacion y recompra" description="Puntos, cupones y membresias para elevar ticket promedio." tag="Growth" />
          <SolutionCard title="Reportes y control" description="KPIs de ventas, operacion y marketing para tomar decisiones." tag="Inteligencia" />
        </div>
      </section>

      <section id="paquetes">
        <h2>Paquetes ComerCia</h2>
        <div className="card-grid">
          <PackageCard
            name="ComerCia IMPULSA"
            subtitle="Para iniciar, ordenar y acelerar tu negocio"
            focus="Ideal para micro, pequenas y medianas empresas que necesitan traccion rapida con base comercial."
            includes={[
              "Landing premium + ecommerce base",
              "Marketing de arranque",
              "Flujo comercial con diagnostico guiado",
            ]}
            primaryTo="#diagnostico"
            secondaryTo="#lia-comercial"
          />
          <PackageCard
            name="ComerCia ESCALA"
            subtitle="Para crecer, automatizar y expandir tu marca con mas fuerza"
            focus="Pensado para empresas con operacion en crecimiento que necesitan estructura robusta para vender mas."
            includes={[
              "Automatizacion comercial avanzada",
              "Canal distribuidor con control por reglas",
              "Panel de operacion y reportes ejecutivos",
            ]}
            primaryTo="#diagnostico"
            secondaryTo="#lia-comercial"
          />
        </div>
      </section>

      <section>
        <h2>Servicios adicionales activables</h2>
        <div className="card-grid">
          <SolutionCard
            title="Logistica adicional para tu marca"
            description="Si no cuentas con logistica propia, podemos brindarte recoleccion, entrega y resguardo en almacen con seguimiento dentro de la plataforma."
            tag="Servicio adicional"
          />
          <SolutionCard
            title="Membresias y credenciales inteligentes"
            description="Credenciales digitales/fisicas con QR y NFC opcional para publico, distribuidores y empleados."
            tag="Identificacion"
          />
          <SolutionCard
            title="Cobros digitales desde celular"
            description="Links de pago y QR de cobro para POS/WebApp con arquitectura lista para Mercado Pago."
            tag="Pagos POS"
          />
        </div>
        <div className="card-grid">
          <article className="card marketing-card">
            <h3>Activacion NFC opcional</h3>
            <p>Activacion inicial: 500 MXN</p>
          </article>
          <article className="card marketing-card">
            <h3>Activacion cobros digitales POS</h3>
            <p>Activacion inicial: 500 MXN</p>
          </article>
        </div>
      </section>

      <AgentWidgetPlaceholder
        id="lia-comercial"
        name="Lia de ComerCia"
        description="Asesora comercial virtual para ayudarte a elegir plan, resolver dudas y llevarte a una conversacion de cierre con contexto real."
        bullets={[
          "Detecta etapa de tu negocio",
          "Recomienda IMPULSA o ESCALA",
          "Conecta contigo para diagnostico y cierre",
        ]}
        accent="#1c5fd4"
        advisorTarget="#diagnostico"
        onRecommendPlan={(planCode) => setLeadForm((prev) => ({ ...prev, selected_plan_code: planCode }))}
      />

      <AudienceSplitSection
        title="Ruta de atencion comercial"
        leftTitle="Quiero diagnostico rapido"
        leftBullets={[
          "Diagnostico comercial inicial",
          "Recomendacion de paquete",
          "Plan de arranque por etapas",
        ]}
        rightTitle="Hablar con un asesor"
        rightBullets={[
          "Sesion de enfoque comercial",
          "Definicion de alcance y tiempos",
          "Ruta operativa para implementacion",
        ]}
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
          <button className="button" type="submit">Registrar solicitud</button>
        </form>
        {refQuery ? <p>Referencia detectada: {refQuery} ({refStatus === "valid" ? "valida" : refStatus === "invalid" ? "invalida" : "verificando"})</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {submitted ? <p>Solicitud registrada. Un asesor se comunicara contigo para continuar el diagnostico.</p> : null}
      </section>

      <CTASection
        title="Tu marca puede vender mejor, crecer mas rapido y operar con mas inteligencia."
        subtitle="Activa una estructura comercial real con ComerCia y crece con control."
        primaryLabel="Solicitar diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Hablar con un asesor"
        secondaryTo="#lia-comercial"
      />
    </main>
  );
}
