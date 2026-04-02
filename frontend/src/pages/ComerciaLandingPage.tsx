import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { CookieConsentBanner } from "../components/marketing/CookieConsentBanner";
import { LiaSalesAssistant } from "../components/marketing/LiaSalesAssistant";
import { buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../branding/multibrandTemplates";
import { api } from "../services/api";
import "./ComerciaLandingPage.css";

type CustomerServiceForm = {
  name: string;
  email: string;
  phone_whatsapp: string;
  company: string;
  contact_reason: string;
  message: string;
};

type DemoView = {
  code: "home" | "product" | "distributor" | "pos";
  title: string;
  subtitle: string;
  metrics: string[];
  bullets: string[];
  gradient: string;
};

const DEMO_VIEWS: DemoView[] = [
  {
    code: "home",
    title: "Home ecommerce premium",
    subtitle: "Experiencia de compra moderna con conversion optimizada y recomendaciones inteligentes.",
    metrics: ["Conversion +32%", "Ticket promedio +18%", "Carga < 2s"],
    bullets: [
      "Catalogo visual con categorias dinamicas",
      "Promociones y banners por segmento",
      "SEO on-page listo para captacion organica"
    ],
    gradient: "linear-gradient(140deg, #0f2857, #1d4fa3 55%, #3386f0)"
  },
  {
    code: "product",
    title: "Detalle de producto orientado a cierre",
    subtitle: "Ficha comercial con argumentos de valor, prueba social y upsell inteligente.",
    metrics: ["CTR a checkout +27%", "Resenas activas", "Cross-sell IA"],
    bullets: [
      "Contenido de producto optimizado para IA y buscadores",
      "Variantes, precios y stock por canal",
      "Bloques de confianza: envios, garantias y pagos"
    ],
    gradient: "linear-gradient(140deg, #152b5d, #284da9 52%, #5f53d4)"
  },
  {
    code: "distributor",
    title: "Portal distribuidor B2B",
    subtitle: "Canal mayorista con precios escalonados, reglas comerciales y seguimiento de pedidos.",
    metrics: ["Pedidos recurrentes", "Margen controlado", "Portal privado"],
    bullets: [
      "Registro y aprobacion comercial por perfil",
      "Precios menudeo/mayoreo con minimos configurables",
      "Dashboard para distribuidores y fuerza de ventas"
    ],
    gradient: "linear-gradient(140deg, #102447, #18417f 50%, #2d6cc0)"
  },
  {
    code: "pos",
    title: "POS WebApp omnicanal",
    subtitle: "Operacion en punto de venta conectada al ecommerce, inventario y CRM.",
    metrics: ["Cobro QR y link", "Inventario en tiempo real", "Sincronizacion total"],
    bullets: [
      "Venta presencial desde tablet o celular",
      "Clientes, cupones y fidelizacion en la misma vista",
      "Reportes de caja y desempeno comercial"
    ],
    gradient: "linear-gradient(140deg, #10203d, #1a3569 50%, #1f6ab8)"
  }
];

const BENEFITS = [
  {
    icon: "OMNI",
    title: "Venta omnicanal real",
    description: "Vende en web, POS y canal distribuidor con una sola operacion integrada."
  },
  {
    icon: "PRC",
    title: "Precios diferenciados",
    description: "Configura precio publico, mayoreo y promociones segmentadas por tipo de cliente."
  },
  {
    icon: "IA",
    title: "Automatizacion con IA",
    description: "Activa agentes para seguimiento, recomendaciones y acciones comerciales automaticas."
  },
  {
    icon: "CRM",
    title: "Gestion de clientes y distribuidores",
    description: "Centraliza leads, compradores y aliados con trazabilidad completa por etapa."
  },
  {
    icon: "PAY",
    title: "Pagos integrados",
    description: "Checkout digital, links de pago y cobro presencial listos para operar sin friccion."
  },
  {
    icon: "SCL",
    title: "Escalabilidad por marca",
    description: "Modelo multiindustria y multi-sucursal listo para crecer sin rehacer plataforma."
  }
];

const PROBLEMS = [
  {
    title: "Canales desconectados",
    description: "Las marcas venden por web, redes y punto de venta sin una vista unificada de clientes, pedidos y margen."
  },
  {
    title: "Escalamiento lento",
    description: "Lanzar una nueva unidad digital suele requerir meses de desarrollo, retrabajo y costos operativos elevados."
  },
  {
    title: "Baja visibilidad digital",
    description: "Sin estructura SEO/AEO y copy orientado a intención, el tráfico no califica ni convierte de forma sostenible."
  }
];

const USE_CASES = [
  {
    industry: "Retail",
    challenge: "Catalogos amplios y alta rotacion",
    result: "Sincroniza inventario, promociones y puntos de venta para vender mas sin quiebres."
  },
  {
    industry: "Belleza",
    challenge: "Citas, membresias y recompra",
    result: "Combina servicios, productos y fidelizacion en una experiencia premium."
  },
  {
    industry: "Servicios",
    challenge: "Captacion de leads y seguimiento",
    result: "Automatiza contacto comercial y convierte solicitudes en ventas medibles."
  },
  {
    industry: "Educacion",
    challenge: "Programas, pagos y renovaciones",
    result: "Gestiona planes, pagos recurrentes y comunicacion por cohortes."
  },
  {
    industry: "Distribuidores",
    challenge: "Precios y pedidos por volumen",
    result: "Activa canal B2B con reglas de negocio y control de margen por segmento."
  }
];

const SEGMENTS = [
  {
    title: "Público general",
    detail: "Experiencia de compra clara, checkout rápido y recomendaciones personalizadas para elevar conversión."
  },
  {
    title: "Distribuidores",
    detail: "Portal B2B con reglas de volumen, recompra y condiciones comerciales para escalar cobertura."
  },
  {
    title: "Comercios",
    detail: "Operación omnicanal con catálogo, POS y automatización para vender más con control financiero."
  }
];

const BUSINESS_MODELS = [
  {
    name: "Plan sin comisión",
    description: "Suscripción fija para marcas que priorizan previsibilidad financiera y alto volumen de transacciones.",
    bullets: [
      "Sin comisión por venta",
      "Costo mensual o anual predecible",
      "Ideal para operación estable y expansión"
    ],
    cta: "Solicitar demo del plan sin comisión"
  },
  {
    name: "Plan con comisión por venta",
    description: "Modelo de entrada para iniciar rápido, con pago variable según desempeño comercial.",
    bullets: [
      "Costo de entrada bajo",
      "Comisión transparente por transacción",
      "Ideal para marcas en fase de activación"
    ],
    cta: "Activar plan con comisión"
  }
];

const AI_PROMPTS = [
  "Prompt SEO/AEO: Describe en 120 palabras por qué {{marca}} es la mejor opción para {{industria}} en {{ciudad}}.",
  "Prompt conversión: Genera respuesta comercial breve para un cliente que pregunta precios, tiempos y garantía.",
  "Prompt distribuidores: Crea mensaje de onboarding para nuevos comercios interesados en compra por volumen."
];

const TESTIMONIALS = [
  {
    quote:
      "En 6 semanas pasamos de vender por mensajes sueltos a operar ecommerce + distribuidores con trazabilidad total.",
    name: "Laura Martinez",
    role: "Directora Comercial, marca retail"
  },
  {
    quote:
      "El canal distribuidor nos dio orden en precios y volumen. Ahora cerramos pedidos con mas margen y menos friccion.",
    name: "Carlos Rivera",
    role: "Distribuidor autorizado"
  },
  {
    quote:
      "COMERCIA nos dio plataforma de nivel empresarial sin meses de desarrollo. Hoy tomamos decisiones con datos reales.",
    name: "Daniela Soto",
    role: "CEO, empresa de servicios"
  }
];

const FAQS = [
  {
    question: "Como vender en linea con una plataforma profesional?",
    answer:
      "Con COMERCIA by REINPIA activas una landing de conversion, ecommerce y procesos comerciales en un solo flujo para empezar a vender en dias."
  },
  {
    question: "Como crear un ecommerce escalable para mi negocio?",
    answer:
      "La plataforma integra catalogo, checkout, POS, automatizacion con IA y reportes, por lo que puedes crecer por etapas sin rehacer tu sistema."
  },
  {
    question: "Como vender tambien a distribuidores o mayoreo?",
    answer:
      "COMERCIA incluye un canal distribuidor con registro, precios por volumen y reglas comerciales para atender B2B y B2C al mismo tiempo."
  },
  {
    question: "Que hace la IA dentro de COMERCIA?",
    answer:
      "La IA ayuda a captar, calificar y seguir leads, recomendar acciones de venta y mejorar la conversion de forma continua."
  }
];

function createFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function ComerciaLandingPage() {
  const [searchParams] = useSearchParams();
  const refQuery = searchParams.get("ref") ?? "";
  const requestedPlan = searchParams.get("plan");
  const brandInput = getDemoBrandInput(searchParams.get("brand"));
  const brandTheme = useMemo(() => buildBrandTheme(brandInput, "landing"), [brandInput]);
  const brandStyle = useMemo(() => tokensToCssVars(brandTheme), [brandTheme]);
  const planType =
    requestedPlan === "commission" || requestedPlan === "subscription"
      ? requestedPlan
      : brandTheme.monetizationPlan;
  const planVariant =
    planType === "commission"
      ? {
          headline: "Empieza sin invertir fijo y paga solo cuando vendes",
          subtitle: "Modelo accesible para crecer con bajo riesgo y transparencia total en cada venta.",
          ctaPrimary: "Empieza sin costo fijo",
          ctaSecondary: "Quiero vender / ser distribuidor",
          badge: "PLAN A - Comision por venta",
        }
      : {
          headline: "Escala tu operacion con control total y sin comisiones",
          subtitle: "Modelo de suscripcion para rentabilidad estable y herramientas premium sin cargos por venta.",
          ctaPrimary: "Activa tu plan",
          ctaSecondary: "Conocer beneficios premium",
          badge: "PLAN B - Suscripcion sin comision",
        };
  const [refStatus, setRefStatus] = useState<"unknown" | "valid" | "invalid">("unknown");

  const [activeDemo, setActiveDemo] = useState<DemoView["code"]>("home");
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
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

  const activeDemoView = useMemo(
    () => DEMO_VIEWS.find((view) => view.code === activeDemo) ?? DEMO_VIEWS[0],
    [activeDemo]
  );

  useEffect(() => {
    if (!refQuery) return;
    api
      .getComerciaReferralValidation(refQuery)
      .then((result) => setRefStatus(result.valid ? "valid" : "invalid"))
      .catch(() => setRefStatus("invalid"));
  }, [refQuery]);

  useEffect(() => {
    document.body.classList.add("public-landing", "comercia-premium-body");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";

    const oldTitle = document.title;
    document.title = `${brandTheme.name} | Ecosistema multicanal COMERCIA by REINPIA`;

    const metaDescription = document.querySelector('meta[name="description"]') ?? document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    metaDescription.setAttribute(
      "content",
      `${brandTheme.name}: landing, ecommerce publico, canal distribuidores y POS con branding unificado y personalizacion por marca.`
    );
    if (!metaDescription.parentElement) {
      document.head.appendChild(metaDescription);
    }

    const canonical = document.querySelector('link[rel="canonical"]') ?? document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", `${window.location.origin}/comercia?brand=${brandTheme.key}`);
    if (!canonical.parentElement) {
      document.head.appendChild(canonical);
    }

    return () => {
      document.body.classList.remove("public-landing", "comercia-premium-body");
      document.title = oldTitle;
    };
  }, [brandTheme.key, brandTheme.name]);

  const openLia = () => window.dispatchEvent(new Event("lia:open"));

  const openDiagnostic = () => {
    setDiagnosticOpen(true);
    setSubmitted(false);
    setError("");
  };

  const openContact = () => {
    const section = document.getElementById("contacto");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openPlans = () => {
    const section = document.getElementById("planes");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLeadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        ...leadForm,
        purchase_status: "pending_contact",
        source_type: refQuery ? "query_param" : leadForm.referral_code ? "manual_code" : "direct",
        referral_code: leadForm.referral_code || undefined,
        notes: `${leadForm.notes} | channel=diagnostico_modal | page=comercia_premium_landing`.trim(),
      };
      await api.createComerciaPlanPurchaseLead(payload);
      await api.createComerciaCustomerContactLead({
        name: leadForm.buyer_name,
        email: leadForm.buyer_email,
        phone: leadForm.buyer_phone,
        company: leadForm.company_name,
        contact_reason: "planes",
        message: `Diagnostico comercial solicitado. Plan de interes: ${leadForm.selected_plan_code}`,
        channel: "diagnostico",
        recommended_plan: leadForm.selected_plan_code,
        status: "nuevo",
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar el lead comercial.");
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
        channel: "contacto",
        status: "nuevo",
      });
      setServiceSubmitted(true);
    } catch (err) {
      setServiceError(err instanceof Error ? err.message : "No fue posible registrar tu solicitud de contacto.");
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: `${brandTheme.name} en COMERCIA by REINPIA`,
    url: `${window.location.origin}/comercia?brand=${brandTheme.key}`,
    description:
      `Ecosistema multicanal de ${brandTheme.name}: landing, ecommerce, distribuidores y POS con automatizacion IA.`,
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brandTheme.name} by COMERCIA`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      `Plataforma SaaS para ${brandTheme.name} con ecommerce, canal distribuidor, POS y automatizacion inteligente.`,
  };

  const businessSpecificText =
    brandTheme.businessType === "services"
      ? "Enfoque principal: agenda, servicios, atencion y conversion consultiva."
      : brandTheme.businessType === "products"
        ? "Enfoque principal: catalogo, promocion y compra recurrente."
        : "Enfoque principal: mezcla de catalogo, servicios y operacion omnicanal.";

  return (
    <main className="comercia-premium" style={brandStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createFaqSchema()) }} />

      <CookieConsentBanner />
      <LiaSalesAssistant
        referralCode={refQuery}
        onOpenDiagnostic={openDiagnostic}
        onOpenContact={openContact}
        onOpenPackages={openPlans}
      />

      <header className="cp-nav cp-animate-up" id="top">
        <div>
          <p className="cp-kicker">LANDING COMERCIAL � COMERCIA BY REINPIA</p>
          <h1>Activa tu ecommerce y comienza a vender con una estructura profesional desde el primer d�a</h1>
          <p className="cp-brand-context">{businessSpecificText}</p>
        </div>
        <div className="cp-nav-actions">
          <LanguageSelector />
          <button type="button" className="button" onClick={openDiagnostic}>
            Solicitar demo
          </button>
        </div>
      </header>

      <section className="cp-hero cp-animate-up" aria-label="Hero principal">
        <div className="cp-hero-copy">
          <p className="cp-eyebrow">{brandTheme.name} � {brandTheme.tone}</p>
          <h2>Elige el modelo que mejor se adapte a tu negocio: inversi�n fija o esquema por comisi�n. Tecnolog�a, operaci�n e inteligencia artificial en una sola plataforma.</h2>
          <p>Sin ambig�edades: puedes iniciar con inversi�n definida o con esquema por resultados, siempre con control total de tu operaci�n y tus ventas.</p>
          <div className="cp-cta-row">
            <button type="button" className="button" onClick={openDiagnostic}>
              Solicitar demo
            </button>
            <button type="button" className="button button-outline" onClick={openPlans}>
              Ver modelos de negocio
            </button>
            <button type="button" className="button button-outline" onClick={openLia}>
              Hablar con Lia IA
            </button>
          </div>
          <div className="cp-proof-row">
            <span>Implementacion acelerada</span>
            <span>Arquitectura modular por industria</span>
            <span>Escalable para inversion y expansion</span>
          </div>
        </div>

        <aside className="cp-hero-ecosystem" aria-label="Mockups de ecosistema">
          <article className="cp-mock-card cp-main-mock">
            <p>Dashboard ejecutivo</p>
            <h3>Ventas + IA + Operacion</h3>
            <ul>
              <li>Embudo comercial en tiempo real</li>
              <li>Alertas de conversi�n y recompra</li>
              <li>Control omnicanal por marca</li>
            </ul>
          </article>
          <article className="cp-mock-card">
            <p>Ecommerce premium</p>
            <h3>Checkout optimizado</h3>
            <ul>
              <li>Flujo de compra dise�ado para conversi�n</li>
              <li>Integraci�n con promociones y cupones</li>
            </ul>
          </article>
          <article className="cp-mock-card">
            <p>POS WebApp</p>
            <h3>Venta f�sica conectada</h3>
            <ul>
              <li>Sincronizaci�n con inventario y clientes</li>
              <li>Informaci�n en tiempo real</li>
            </ul>
          </article>
          <article className="cp-mock-card">
            <p>Canal distribuidor</p>
            <h3>B2B con reglas de negocio</h3>
            <ul>
              <li>Precios por volumen</li>
              <li>Condiciones comerciales automatizadas</li>
            </ul>
          </article>
        </aside>
      </section>

      {brandTheme.hasExistingLanding ? (
        <section className="cp-section cp-existing-landing">
          <header className="cp-section-head">
            <p className="cp-kicker">Landing existente detectada</p>
            <h2>Esta marca ya cuenta con landing externa</h2>
          </header>
          <p>
            COMERCIA adaptara automaticamente ecommerce publico, canal distribuidores y POS conservando la identidad de
            marca y conectando con su landing actual.
          </p>
          {brandTheme.existingLandingUrl ? (
            <a href={brandTheme.existingLandingUrl} target="_blank" rel="noreferrer">
              Visitar landing existente
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="cp-section" id="problema">
        <header className="cp-section-head">
          <p className="cp-kicker">2. Problema</p>
          <h2>El reto no es solo vender en línea: es operar, escalar y convertir de forma consistente</h2>
          <p>
            Empresas, comercios y distribuidores necesitan una base comercial que unifique canales, reduzca fricción
            operativa y mejore el descubrimiento digital en buscadores y asistentes de IA.
          </p>
        </header>
        <div className="cp-benefits-grid">
          {PROBLEMS.map((problem) => (
            <article key={problem.title} className="cp-benefit-card">
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section cp-entry" id="entrada">
        <header className="cp-section-head">
          <p className="cp-kicker">8. Segmentación</p>
          <h2>Experiencias diferenciadas para cada tipo de usuario</h2>
        </header>
        <div className="cp-entry-grid">
          <article className="cp-entry-card">
            <p className="cp-entry-tag">Público general</p>
            <h3>{SEGMENTS[0].title}</h3>
            <p>{SEGMENTS[0].detail}</p>
            <ul>
              <li>Navegación clara orientada a conversión</li>
              <li>Promociones y recomendaciones inteligentes</li>
              <li>Checkout optimizado para cierre</li>
            </ul>
            <button type="button" className="button" onClick={openDiagnostic}>
              Quiero activar canal público
            </button>
          </article>
          <article className="cp-entry-card cp-entry-card-alt">
            <p className="cp-entry-tag">Distribuidores y comercios</p>
            <h3>{SEGMENTS[1].title} + {SEGMENTS[2].title}</h3>
            <p>Canal B2B especializado para compra por volumen y operación comercial escalable.</p>
            <ul>
              <li>Portal distribuidor dedicado</li>
              <li>Condiciones por mayoreo y recompra</li>
              <li>Seguimiento comercial con IA</li>
            </ul>
            <button type="button" className="button" onClick={openContact}>
              Quiero vender / distribuir
            </button>
          </article>
        </div>
      </section>

      <section className="cp-section">
        <header className="cp-section-head">
          <p className="cp-kicker">3. Solución</p>
          <h2>Una plataforma todo en uno para vender, operar y escalar con inteligencia</h2>
          <p>
            COMERCIA by REINPIA conecta ecommerce inteligente, canal publico y distribuidores, POS WebApp y
            automatizacion con IA para que tu equipo trabaje con una sola fuente de verdad.
          </p>
        </header>
        <div className="cp-pillars">
          <article>
            <h3>Ecommerce inteligente</h3>
            <p>Catalogo, checkout y conversion optimizados para clientes finales y busqueda organica.</p>
          </article>
          <article>
            <h3>Canal publico + distribuidores</h3>
            <p>Atiende B2C y B2B con reglas de precios, volumen y seguimiento por segmento.</p>
          </article>
          <article>
            <h3>POS + WebApp</h3>
            <p>Opera ventas presenciales con sincronizacion en tiempo real contra inventario y CRM.</p>
          </article>
          <article>
            <h3>Automatizacion con IA</h3>
            <p>Acelera captura, seguimiento y cierre con asistencia automatizada y recomendaciones.</p>
          </article>
        </div>
      </section>

      <section className="cp-section" id="beneficios">
        <header className="cp-section-head">
          <p className="cp-kicker">4. Beneficios clave</p>
          <h2>Todo lo que necesitas para crecimiento comercial medible</h2>
        </header>
        <div className="cp-benefits-grid">
          {BENEFITS.map((benefit) => (
            <article key={benefit.title} className="cp-benefit-card">
              <span className="cp-benefit-icon" aria-hidden="true">
                {benefit.icon}
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section" id="demo-visual">
        <header className="cp-section-head">
          <p className="cp-kicker">5. Demo visual del sistema</p>
          <h2>Visualiza cada modulo antes de implementar</h2>
        </header>
        <div className="cp-demo-tabs" role="tablist" aria-label="Vistas demo de plataforma">
          {DEMO_VIEWS.map((view) => (
            <button
              key={view.code}
              type="button"
              className={`cp-demo-tab ${activeDemo === view.code ? "is-active" : ""}`}
              onClick={() => setActiveDemo(view.code)}
            >
              {view.title}
            </button>
          ))}
        </div>
        <article className="cp-demo-panel" style={{ background: activeDemoView.gradient }}>
          <div>
            <p className="cp-eyebrow">Vista activa</p>
            <h3>{activeDemoView.title}</h3>
            <p>{activeDemoView.subtitle}</p>
            <ul>
              {activeDemoView.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
          <div className="cp-demo-metrics">
            {activeDemoView.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="cp-section" id="flujo">
        <header className="cp-section-head">
          <p className="cp-kicker">6. Flujo de funcionamiento</p>
          <h2>De activacion a escalamiento en 5 pasos</h2>
        </header>
        <ol className="cp-timeline">
          <li>
            <h3>1. Cargas tus productos</h3>
            <p>Estructuras catalogo, categorias y precios por segmento desde un panel central.</p>
          </li>
          <li>
            <h3>2. Activas tu tienda</h3>
            <p>Publicas una experiencia premium lista para conversion en web y mobile.</p>
          </li>
          <li>
            <h3>3. Vendes a publico y distribuidores</h3>
            <p>Operas B2C y B2B sin duplicar procesos ni perder control comercial.</p>
          </li>
          <li>
            <h3>4. Automatizas con IA</h3>
            <p>Delegas seguimiento de leads, recomendaciones y tareas repetitivas de alto impacto.</p>
          </li>
          <li>
            <h3>5. Escalas tu negocio</h3>
            <p>Tomas decisiones con datos, reportes y alertas para crecer con rentabilidad.</p>
          </li>
        </ol>
      </section>

      <section className="cp-section cp-ai" id="ia">
        <header className="cp-section-head">
          <p className="cp-kicker">5. IA integrada</p>
          <h2>Tu negocio no solo vende, aprende y mejora automaticamente.</h2>
        </header>
        <div className="cp-ai-grid">
          <article>
            <h3>Agentes de IA para crecimiento comercial</h3>
            <p>
              Lia te ayuda a captar demanda, recomendar planes y convertir conversaciones en leads accionables para tu
              equipo de ventas.
            </p>
          </article>
          <article>
            <h3>Automatizacion de atencion y seguimiento</h3>
            <p>
              Dispara secuencias de contacto, recordatorios y respuestas guiadas para no perder oportunidades por falta
              de seguimiento.
            </p>
          </article>
          <article>
            <h3>Recomendaciones y optimizacion continua</h3>
            <p>
              Detecta patrones de compra, sugiere acciones de conversion y prioriza cuentas de alto potencial.
            </p>
          </article>
        </div>
        <div className="cp-cta-row">
          <button type="button" className="button" onClick={openLia}>
            Probar Lia IA ahora
          </button>
          <button type="button" className="button button-outline" onClick={openDiagnostic}>
            Activar automatizacion
          </button>
        </div>
        <article className="cp-plan-contact">
          <h3>Prompts embebidos para posicionamiento en IA (AEO)</h3>
          <p>
            Usa estos prompts base para acelerar contenido comercial entendible por motores de búsqueda y asistentes
            de IA.
          </p>
          <ul>
            {AI_PROMPTS.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="cp-section" id="casos-uso">
        <header className="cp-section-head">
          <p className="cp-kicker">8. Casos de uso</p>
          <h2>Diseño de landing y ecommerce para múltiples empresas e industrias.</h2>
          <p>Arquitectura comercial diseñada para adaptarse a distintos giros, integrando SEO, AEO y prompts optimizados para mejorar visibilidad, posicionamiento y conversión.</p>
          <p>Desarrollado para que tu marca sea más fácil de encontrar, entender y convertir en buscadores, asistentes de IA y canales digitales.</p>
          <p>Preparado para operar desde México y escalar a otros mercados, con una estructura comercial lista para trabajar en pesos, dólares y euros.</p>
        </header>
        <div className="cp-usecases-grid">
          {USE_CASES.map((item) => (
            <article key={item.industry} className="cp-usecase">
              <h3>{item.industry}</h3>
              <p>
                <strong>Reto:</strong> {item.challenge}
              </p>
              <p>
                <strong>Resultado:</strong> {item.result}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section" id="planes">
        <header className="cp-section-head">
          <p className="cp-kicker">6. Modelos de negocio</p>
          <h2>Elige el esquema comercial que mejor se adapta a tu etapa</h2>
        </header>
        <div className="cp-plans-grid">
          {BUSINESS_MODELS.map((plan, index) => (
            <article key={plan.name} className={`cp-plan-card ${index === 0 ? "is-highlight" : ""}`}>
              <p className="cp-plan-name">{plan.name}</p>
              <p className="cp-plan-price">{plan.description}</p>
              <ul>
                {plan.bullets.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button type="button" className="button" onClick={openDiagnostic}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
        <div className="cp-plan-contact">
          <p>Ambos modelos son compatibles con ecommerce, webapp y operación multi-tenant con personalización por marca (colores, logo, tipografía y productos).</p>
          <button type="button" className="button button-outline" onClick={openContact}>
            Hablar con consultor
          </button>
        </div>
      </section>

      <section className="cp-section" id="compatibilidad">
        <header className="cp-section-head">
          <p className="cp-kicker">7. Compatibilidad SaaS</p>
          <h2>Base reutilizable para múltiples marcas sin perder identidad</h2>
        </header>
        <div className="cp-pillars">
          <article>
            <h3>Compatible con ecommerce</h3>
            <p>Catálogo, carrito, checkout y recomendaciones con estructura preparada para distintos verticales.</p>
          </article>
          <article>
            <h3>Compatible con webapp</h3>
            <p>Canal operativo para equipos comerciales y POS conectado a inventario, clientes y pagos.</p>
          </article>
          <article>
            <h3>Preparado para multi-tenant</h3>
            <p>Cada marca opera con dominio lógico propio y variaciones de copy, branding y oferta.</p>
          </article>
          <article>
            <h3>Personalizable por marca</h3>
            <p>Colores, logo, tipografía y productos se adaptan automáticamente sin romper la experiencia premium.</p>
          </article>
        </div>
      </section>

      <section className="cp-section" id="testimonios">
        <header className="cp-section-head">
          <p className="cp-kicker">9. Testimonios (demo)</p>
          <h2>Resultados que una plataforma comercial bien ejecutada puede habilitar</h2>
        </header>
        <div className="cp-testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <blockquote key={testimonial.name} className="cp-testimonial">
              <p>"{testimonial.quote}"</p>
              <footer>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="cp-section cp-final-cta" id="cta-final">
        <p className="cp-kicker">10. CTA final</p>
        <h2>{planType === "commission" ? "Empieza a vender hoy mismo sin costo fijo." : "Activa tu plan y escala con tecnologia empresarial sin comisiones."}</h2>
        <p>
          Acelera tu salida al mercado, profesionaliza tu operacion y escala con una plataforma preparada para inversion,
          expansion y decisiones basadas en datos.
        </p>
        <div className="cp-cta-row">
          <button type="button" className="button" onClick={openDiagnostic}>
            {planVariant.ctaPrimary}
          </button>
          <button type="button" className="button button-outline" onClick={openContact}>
            Quiero hablar con un asesor
          </button>
        </div>
      </section>

      <section className="cp-section cp-faq" id="faq">
        <header className="cp-section-head">
          <p className="cp-kicker">SEO + AEO</p>
          <h2>Preguntas frecuentes sobre ecommerce y crecimiento comercial</h2>
        </header>
        <div className="cp-faq-grid">
          {FAQS.map((faq) => (
            <article key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-section cp-contact" id="contacto">
        <header className="cp-section-head">
          <p className="cp-kicker">Contacto</p>
          <h2>Cuentanos tu objetivo y te proponemos una ruta clara de implementacion</h2>
        </header>
        <form className="detail-form" onSubmit={handleCustomerServiceSubmit}>
          <label>
            Nombre
            <input
              required
              value={serviceForm.name}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label>
            Correo
            <input
              required
              type="email"
              value={serviceForm.email}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            Telefono o WhatsApp
            <input
              required
              value={serviceForm.phone_whatsapp}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, phone_whatsapp: event.target.value }))}
            />
          </label>
          <label>
            Empresa
            <input
              value={serviceForm.company}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, company: event.target.value }))}
            />
          </label>
          <label>
            Motivo de contacto
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
          </label>
          <label>
            Mensaje
            <textarea
              required
              value={serviceForm.message}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, message: event.target.value }))}
            />
          </label>
          <div className="cp-cta-row">
            <button className="button" type="submit">
              Enviar mensaje
            </button>
            <button className="button button-outline" type="button" onClick={openLia}>
              Hablar con Lia
            </button>
          </div>
        </form>
        {serviceError ? <p className="error">{serviceError}</p> : null}
        {serviceSubmitted ? <p className="cp-success">Tu solicitud fue registrada. Te contactaremos pronto.</p> : null}
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-grid">
          <div>
            <h3>{brandTheme.name}</h3>
            <p>
              Plataforma comercial premium para ecommerce, distribuidores, automatizacion IA y operacion empresarial
              escalable.
            </p>
          </div>
          <div>
            <h4>Producto</h4>
            <a href="#beneficios">Beneficios</a>
            <a href="#demo-visual">Demo visual</a>
            <a href="#planes">Planes</a>
          </div>
          <div>
            <h4>Recursos</h4>
            <a href="#faq">FAQ SEO/AEO</a>
            <Link to="/templates/familia">Demo sistema multimarcas</Link>
            <Link to={`/templates/tienda-publica?brand=${brandTheme.key}`}>Preview ecommerce publico</Link>
            <Link to={`/templates/distribuidores?brand=${brandTheme.key}`}>Preview distribuidores</Link>
            <Link to={`/templates/pos?brand=${brandTheme.key}`}>Preview POS</Link>
            <button type="button" className="cp-footer-link" onClick={openLia}>
              Chatbot IA Lia
            </button>
            <button type="button" className="cp-footer-link" onClick={openDiagnostic}>
              Diagnostico comercial
            </button>
          </div>
          <div>
            <h4>Legal</h4>
            <Link to="/legal/privacidad">Politica de privacidad</Link>
            <Link to="/legal/cookies">Politica de cookies</Link>
            <Link to="/legal/proteccion-datos">Proteccion de datos</Link>
          </div>
        </div>
        <div className="cp-footer-bottom">
          <span>COMERCIA es una plataforma desarrollada por REINPIA. Todos los derechos reservados.</span>
          <span>© REINPIA. Todos los derechos reservados.</span>
          <a href="#top">Volver arriba</a>
        </div>
      </footer>

      {diagnosticOpen ? (
        <div className="cookie-modal-backdrop" role="presentation" onClick={() => setDiagnosticOpen(false)}>
          <section
            className="cookie-modal diagnostic-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Diagnostico comercial COMERCIA</h3>
            <p>
              Comparte tus datos y objetivos para recomendarte la arquitectura ideal de ecommerce, canal distribuidor e
              IA.
            </p>
            <form className="detail-form" onSubmit={handleLeadSubmit}>
              <label>
                Empresa
                <input
                  required
                  value={leadForm.company_name}
                  onChange={(e) => setLeadForm((p) => ({ ...p, company_name: e.target.value }))}
                />
              </label>
              <label>
                Nombre
                <input
                  required
                  value={leadForm.buyer_name}
                  onChange={(e) => setLeadForm((p) => ({ ...p, buyer_name: e.target.value }))}
                />
              </label>
              <label>
                Correo
                <input
                  required
                  type="email"
                  value={leadForm.buyer_email}
                  onChange={(e) => setLeadForm((p) => ({ ...p, buyer_email: e.target.value }))}
                />
              </label>
              <label>
                WhatsApp
                <input
                  required
                  value={leadForm.buyer_phone}
                  onChange={(e) => setLeadForm((p) => ({ ...p, buyer_phone: e.target.value }))}
                />
              </label>
              <label>
                Plan de interes
                <select
                  value={leadForm.selected_plan_code}
                  onChange={(e) => setLeadForm((p) => ({ ...p, selected_plan_code: e.target.value }))}
                >
                  <option value="COMERCIA_IMPULSA">Basico / IMPULSA</option>
                  <option value="COMERCIA_ESCALA">Crecimiento / ESCALA</option>
                  <option value="COMERCIA_EMPRESARIAL">Empresarial</option>
                </select>
              </label>
              <label>
                Clave de comisionista (opcional)
                <input
                  value={leadForm.referral_code}
                  onChange={(e) => setLeadForm((p) => ({ ...p, referral_code: e.target.value.toUpperCase() }))}
                />
              </label>
              <label>
                Perfil legal
                <select
                  value={leadForm.legal_type}
                  onChange={(e) => setLeadForm((p) => ({ ...p, legal_type: e.target.value }))}
                >
                  <option value="constituted_company">Empresa constituida</option>
                  <option value="actividad_empresarial">Actividad empresarial</option>
                  <option value="other">Otro</option>
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={leadForm.needs_followup}
                  onChange={(e) => setLeadForm((p) => ({ ...p, needs_followup: e.target.checked }))}
                />
                Solicito seguimiento comercial
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={leadForm.needs_appointment}
                  onChange={(e) => setLeadForm((p) => ({ ...p, needs_appointment: e.target.checked }))}
                />
                Solicito reunion de diagnostico
              </label>
              <label>
                Notas
                <textarea value={leadForm.notes} onChange={(e) => setLeadForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <div className="cp-cta-row">
                <button className="button" type="submit">
                  Enviar diagnostico
                </button>
                <button className="button button-outline" type="button" onClick={() => setDiagnosticOpen(false)}>
                  Cerrar
                </button>
              </div>
            </form>
            {refQuery ? (
              <p>
                Referencia detectada: {refQuery} (
                {refStatus === "valid" ? "valida" : refStatus === "invalid" ? "invalida" : "verificando"})
              </p>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            {submitted ? <p className="cp-success">Solicitud registrada. Te contactaremos con la propuesta ideal.</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}

