import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { LiaSalesAssistant } from "../components/marketing/LiaSalesAssistant";
import { CTASection } from "../components/marketing/CTASection";
import { HeroSection } from "../components/marketing/HeroSection";
import { PackageCard } from "../components/marketing/PackageCard";
import { SolutionCard } from "../components/marketing/SolutionCard";
import { api } from "../services/api";

const YOUTUBE_URL = import.meta.env.VITE_COMERCIA_YOUTUBE_URL as string | undefined;

type CustomerServiceForm = {
  name: string;
  email: string;
  phone_whatsapp: string;
  company: string;
  contact_reason: string;
  message: string;
};

function getYoutubeEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return trimmed;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

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
    needs_appointment: true,
    notes: "",
  });

  const [serviceForm, setServiceForm] = useState<CustomerServiceForm>({
    name: "",
    email: "",
    phone_whatsapp: "",
    company: "",
    contact_reason: "planes",
    message: "",
  });
  const [serviceSubmitted, setServiceSubmitted] = useState(false);
  const [serviceError, setServiceError] = useState("");

  const youtubeEmbed = useMemo(() => getYoutubeEmbedUrl(YOUTUBE_URL), []);

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

  const handleCustomerServiceSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setServiceError("");
      await api.createComerciaCustomerContactLead({
        name: serviceForm.name,
        email: serviceForm.email,
        phone: serviceForm.phone_whatsapp,
        company: serviceForm.company,
        contact_reason: serviceForm.contact_reason,
        message: serviceForm.message,
        channel: "customer_service_form",
        status: "new",
      });
      setServiceSubmitted(true);
    } catch (err) {
      setServiceError(err instanceof Error ? err.message : "No fue posible registrar tu solicitud de atencion.");
    }
  };

  return (
    <main className="marketing-shell">
      <CookieConsentBanner />
      <div className="row-gap" style={{ justifyContent: "space-between" }}>
        <p className="marketing-eyebrow" style={{ margin: 0 }}>ComerCia by REINPIA</p>
        <LanguageSelector />
      </div>

      <HeroSection
        eyebrow="Ecosistema comercial para marcas en crecimiento"
        title="Convierte tu negocio en una maquina de ventas con ComerCia"
        subtitle="Landing premium, ecommerce por canal, automatizacion comercial y operacion conectada para que tu marca venda mas con control total."
        primaryLabel="Quiero mi diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Ver paquetes"
        secondaryTo="#paquetes"
      />

      <section className="hero-mockup-grid">
        <article className="hero-mockup-card">
          <p className="marketing-tag">Vista ejecutiva</p>
          <h3>Ventas, operacion y seguimiento en un solo tablero</h3>
          <p>Controla ecommerce, distribuidores, POS, logistica y reportes sin perder foco comercial.</p>
        </article>
        <article className="hero-mockup-card hero-mockup-strong">
          <p className="marketing-tag">Activacion rapida</p>
          <h3>De idea a ecosistema comercial en semanas</h3>
          <p>Te guiamos paso a paso para publicar, vender y escalar con estructura real.</p>
        </article>
      </section>

      <section className="marketing-section" id="dolores">
        <h2>Si hoy tu operacion se siente desordenada, esto te esta frenando</h2>
        <div className="card-grid">
          <SolutionCard title="No tienes ecommerce funcional" description="Sin canal digital estable, pierdes ventas todos los dias." tag="Dolor" />
          <SolutionCard title="No controlas distribuidores" description="Precios, volumen y seguimiento se vuelven un caos comercial." tag="Dolor" />
          <SolutionCard title="No automatizas seguimiento" description="Leads y prospectos se enfrien por falta de procesos claros." tag="Dolor" />
          <SolutionCard title="No tienes trazabilidad" description="Sin reportes accionables no sabes donde invertir para crecer." tag="Dolor" />
        </div>
      </section>

      <section className="marketing-section" id="solucion">
        <h2>ComerCia resuelve tu operacion comercial de punta a punta</h2>
        <div className="card-grid">
          <SolutionCard title="Landing premium" description="Capta prospectos con narrativa comercial clara y CTA de cierre." tag="Captacion" />
          <SolutionCard title="Ecommerce publico" description="Tienda retail profesional con promociones, resenas y recompra." tag="Ventas" />
          <SolutionCard title="Ecommerce distribuidores" description="Canal B2B separado con reglas de volumen y beneficios comerciales." tag="Canal" />
          <SolutionCard title="POS / WebApp" description="Vende en punto fisico, registra cliente y conecta fidelizacion." tag="Operacion" />
          <SolutionCard title="Logistica" description="Control de entregas y servicio logistico adicional cuando lo necesites." tag="Fulfillment" />
          <SolutionCard title="Automatizacion" description="Seguimiento comercial, recordatorios y mensajes operativos." tag="Automatizacion" />
          <SolutionCard title="Fidelizacion" description="Puntos, cupones y membresias para elevar ticket y recompra." tag="Crecimiento" />
          <SolutionCard title="Reportes" description="KPIs claros para decidir con datos y escalar con confianza." tag="Inteligencia" />
        </div>
      </section>

      <section className="marketing-section" id="video-demo">
        <h2>Video demo de ComerCia</h2>
        <p>Conoce en minutos como se ve y opera el ecosistema comercial completo en una marca real.</p>
        {youtubeEmbed ? (
          <div className="video-embed-wrap">
            <iframe
              className="video-embed"
              src={youtubeEmbed}
              title="Video demo de ComerCia"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <article className="card marketing-card video-placeholder">
            <h3>Demo en video disponible para este bloque</h3>
            <p>Pega la URL de YouTube en la variable `VITE_COMERCIA_YOUTUBE_URL` para mostrar el embed automatico.</p>
            <a className="button" href="#diagnostico">Solicitar demo guiada</a>
          </article>
        )}
      </section>

      <section className="marketing-section" id="como-funciona">
        <h2>Como funciona</h2>
        <div className="workflow-steps">
          <article className="workflow-step"><span>1</span><h3>Analizamos tu marca</h3><p>Entendemos tu etapa, oferta y objetivos de crecimiento.</p></article>
          <article className="workflow-step"><span>2</span><h3>Definimos ruta comercial</h3><p>Priorizamos canales, procesos y enfoque de conversion.</p></article>
          <article className="workflow-step"><span>3</span><h3>Generamos tu ecosistema</h3><p>Landing, ecommerce, distribuidores y operacion listos para venta.</p></article>
          <article className="workflow-step"><span>4</span><h3>Validas y aprobamos</h3><p>Revisas, ajustas y dejas todo alineado a tu marca.</p></article>
          <article className="workflow-step"><span>5</span><h3>Publicamos y escalamos</h3><p>Activamos ventas y seguimiento continuo para crecer con orden.</p></article>
        </div>
      </section>

      <section id="paquetes" className="marketing-section">
        <h2>Paquetes ComerCia</h2>
        <div className="card-grid package-grid-strong">
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
            focus="Pensado para empresas en crecimiento que necesitan operacion robusta para vender mas y mejor."
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

      <section className="marketing-section">
        <h2>Servicios adicionales activables</h2>
        <div className="card-grid">
          <SolutionCard
            title="Logistica personalizada"
            description="Recoleccion, entrega y resguardo para marcas que no cuentan con estructura propia."
            tag="Servicio adicional"
          />
          <SolutionCard
            title="Membresias y credenciales"
            description="Credenciales digitales/fisicas con QR y NFC opcional para clientes y equipos."
            tag="Identificacion"
          />
          <SolutionCard
            title="Cobros digitales POS"
            description="Links de pago y QR para ventas desde celular con flujo listo para Mercado Pago."
            tag="Cobros"
          />
        </div>
        <div className="card-grid">
          <article className="card marketing-card"><h3>Activacion NFC opcional</h3><p>Activacion inicial: 500 MXN</p></article>
          <article className="card marketing-card"><h3>Activacion cobros digitales POS</h3><p>Activacion inicial: 500 MXN</p></article>
        </div>
      </section>

      <LiaSalesAssistant referralCode={refQuery} />

      <section id="atencion-cliente" className="store-banner marketing-section">
        <h2>Atencion al cliente</h2>
        <p>Si tienes dudas puntuales sobre planes, operacion o soporte, te respondemos con seguimiento directo.</p>
        <form className="inline-form" onSubmit={handleCustomerServiceSubmit}>
          <input
            required
            placeholder="Nombre"
            value={serviceForm.name}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            required
            placeholder="Correo"
            value={serviceForm.email}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            required
            placeholder="Telefono o WhatsApp"
            value={serviceForm.phone_whatsapp}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, phone_whatsapp: event.target.value }))}
          />
          <input
            placeholder="Empresa"
            value={serviceForm.company}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, company: event.target.value }))}
          />
          <select
            value={serviceForm.contact_reason}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, contact_reason: event.target.value }))}
          >
            <option value="planes">Informacion de planes</option>
            <option value="soporte">Soporte / dudas</option>
            <option value="ecommerce">Ecommerce</option>
            <option value="logistica">Logistica</option>
            <option value="distribuidores">Distribuidores</option>
            <option value="pos_pagos">POS / pagos</option>
            <option value="otro">Otro</option>
          </select>
          <textarea
            required
            placeholder="Mensaje"
            value={serviceForm.message}
            onChange={(event) => setServiceForm((prev) => ({ ...prev, message: event.target.value }))}
          />
          <button className="button" type="submit">Enviar solicitud de atencion</button>
        </form>
        {serviceError ? <p className="error">{serviceError}</p> : null}
        {serviceSubmitted ? <p>Tu solicitud fue registrada. Te contactaremos con seguimiento personalizado.</p> : null}
      </section>

      <section id="diagnostico" className="store-banner marketing-section">
        <h2>Cierre comercial: solicita diagnostico personalizado</h2>
        <p>Dejanos tus datos y te regresamos una ruta clara para activar ventas con rapidez y control.</p>
        <form className="inline-form" onSubmit={handleLeadSubmit}>
          <input required placeholder="Empresa" value={leadForm.company_name} onChange={(e) => setLeadForm((p) => ({ ...p, company_name: e.target.value }))} />
          <select value={leadForm.legal_type} onChange={(e) => setLeadForm((p) => ({ ...p, legal_type: e.target.value }))}>
            <option value="constituted_company">Empresa constituida</option>
            <option value="actividad_empresarial">Actividad empresarial</option>
            <option value="other">Otro</option>
          </select>
          <input required placeholder="Nombre" value={leadForm.buyer_name} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_name: e.target.value }))} />
          <input required placeholder="Correo" value={leadForm.buyer_email} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_email: e.target.value }))} />
          <input required placeholder="WhatsApp" value={leadForm.buyer_phone} onChange={(e) => setLeadForm((p) => ({ ...p, buyer_phone: e.target.value }))} />
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
            Solicito reunion de diagnostico
          </label>
          <input placeholder="Notas" value={leadForm.notes} onChange={(e) => setLeadForm((p) => ({ ...p, notes: e.target.value }))} />
          <button className="button" type="submit">Enviar para contacto comercial</button>
        </form>
        {refQuery ? <p>Referencia detectada: {refQuery} ({refStatus === "valid" ? "valida" : refStatus === "invalid" ? "invalida" : "verificando"})</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {submitted ? <p>Solicitud registrada. Nuestro equipo comercial te contactara con propuesta y siguiente paso.</p> : null}
      </section>

      <CTASection
        title="Tu marca puede vender mejor, crecer mas rapido y operar con mas inteligencia"
        subtitle="Activa tu ruta comercial en ComerCia y agenda una sesion de diagnostico con nuestro equipo."
        primaryLabel="Solicitar diagnostico"
        primaryTo="#diagnostico"
        secondaryLabel="Hablar con Lia"
        secondaryTo="#lia-comercial"
      />

      <footer className="marketing-footer">
        <div className="marketing-footer-grid">
          <div>
            <h4>ComerCia by REINPIA</h4>
            <p>Plataforma comercial para marcas que necesitan vender mejor con control operativo.</p>
          </div>
          <div>
            <h5>Legal</h5>
            <Link to="/legal/privacidad">Politica de privacidad</Link>
            <Link to="/legal/cookies">Politica de cookies</Link>
            <Link to="/legal/proteccion-datos">Proteccion de datos</Link>
          </div>
          <div>
            <h5>Atencion</h5>
            <a href="#atencion-cliente">Atencion al cliente</a>
            <a href="#diagnostico">Diagnostico comercial</a>
            <a href="#lia-comercial">Asistente Lia</a>
          </div>
          <div>
            <h5>Redes</h5>
            <a href="#" onClick={(event) => event.preventDefault()}>LinkedIn (proximamente)</a>
            <a href="#" onClick={(event) => event.preventDefault()}>YouTube (proximamente)</a>
            <a href="#" onClick={(event) => event.preventDefault()}>WhatsApp Business (proximamente)</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
