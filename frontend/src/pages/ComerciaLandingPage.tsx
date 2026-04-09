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
    description: "Sin estructura SEO/AEO y copy orientado a intencion, el trafico no califica ni convierte de forma sostenible."
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
    title: "Publico general",
    detail: "Experiencia de compra clara, checkout rapido y recomendaciones personalizadas para elevar conversion."
  },
  {
    title: "Distribuidores",
    detail: "Portal B2B con reglas de volumen, recompra y condiciones comerciales para escalar cobertura."
  },
  {
    title: "Comercios",
    detail: "Operacion omnicanal con catalogo, POS y automatizacion para vender mas con control financiero."
  }
];

const BUSINESS_MODELS = [
  {
    name: "Plan sin comision",
    description: "Suscripcion fija para marcas que priorizan previsibilidad financiera y alto volumen de transacciones.",
    bullets: [
      "Sin comision por venta",
      "Costo mensual o anual predecible",
      "Ideal para operacion estable y expansion"
    ],
    cta: "Solicitar demo del plan sin comision"
  },
  {
    name: "Plan con comision por venta",
    description: "Modelo de entrada para iniciar rapido, con pago variable segun desempeno comercial.",
    bullets: [
      "Costo de entrada bajo",
      "Comision transparente por transaccion",
      "Ideal para marcas en fase de activacion"
    ],
    cta: "Activar plan con comision"
  }
];

const AI_PROMPTS = [
  "Prompt SEO/AEO: Describe en 120 palabras por que {{marca}} es la mejor opcion para {{industria}} en {{ciudad}}.",
  "Prompt conversion: Genera respuesta comercial breve para un cliente que pregunta precios, tiempos y garantia.",
  "Prompt distribuidores: Crea mensaje de onboarding para nuevos comercios interesados en compra por volumen."
];

type MarketingBriefForm = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  brand: string;
  location: string;
  industry: string;
  sells: "productos" | "servicios" | "mixto";
  main_goal: "reconocimiento" | "leads" | "ventas" | "distribuidores" | "recompra";
  conversion_channel: "whatsapp" | "formulario" | "landing" | "ecommerce" | "pos";
  has_landing: boolean;
  has_ecommerce: boolean;
  active_social_networks: string;
  posts_consistently: boolean;
  products_to_push: number;
  offer_clarity: "alta" | "parcial" | "baja";
  brand_clarity: "alta" | "parcial" | "baja";
  urgency: "inmediata" | "alta" | "media" | "baja";
  followup_level: "alto" | "medio" | "bajo";
  needs_extra_landing: boolean;
  needs_extra_ecommerce: boolean;
  needs_commercial_tracking: boolean;
  wants_custom_proposal: boolean;
  average_ticket_mxn: number;
  sells_to: "publico_general" | "distribuidores" | "ambos";
  notes: string;
};

type MarketingQuoteResult = {
  sections: Array<{ title: string; body: string }>;
  priceRange: { min: number; max: number };
  suggestedPrice: number;
};

const DEFAULT_MARKETING_BRIEF: MarketingBriefForm = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  brand: "",
  location: "",
  industry: "",
  sells: "productos",
  main_goal: "ventas",
  conversion_channel: "ecommerce",
  has_landing: false,
  has_ecommerce: false,
  active_social_networks: "",
  posts_consistently: false,
  products_to_push: 1,
  offer_clarity: "parcial",
  brand_clarity: "parcial",
  urgency: "media",
  followup_level: "medio",
  needs_extra_landing: false,
  needs_extra_ecommerce: false,
  needs_commercial_tracking: false,
  wants_custom_proposal: true,
  average_ticket_mxn: 1000,
  sells_to: "publico_general",
  notes: "",
};

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeMarketingQuote(brief: MarketingBriefForm): MarketingQuoteResult {
  const complexityScore =
    (brief.products_to_push >= 200 ? 2 : brief.products_to_push >= 80 ? 1 : 0) +
    (brief.sells_to === "ambos" ? 2 : brief.sells_to === "distribuidores" ? 1 : 0) +
    (brief.needs_extra_landing ? 1 : 0) +
    (brief.needs_extra_ecommerce ? 1 : 0) +
    (brief.needs_commercial_tracking ? 1 : 0);

  const maturityScore =
    (brief.has_landing ? 1 : 0) +
    (brief.has_ecommerce ? 1 : 0) +
    (brief.active_social_networks.trim() ? 1 : 0) +
    (brief.posts_consistently ? 1 : 0) +
    (brief.offer_clarity === "alta" ? 1 : brief.offer_clarity === "parcial" ? 0.5 : 0) +
    (brief.brand_clarity === "alta" ? 1 : brief.brand_clarity === "parcial" ? 0.5 : 0);

  const intensityScore =
    (brief.urgency === "inmediata" ? 3 : brief.urgency === "alta" ? 2 : brief.urgency === "media" ? 1 : 0) +
    (brief.followup_level === "alto" ? 2 : brief.followup_level === "medio" ? 1 : 0) +
    (brief.wants_custom_proposal ? 1 : 0);

  const potentialScore =
    (brief.average_ticket_mxn >= 2000 ? 3 : brief.average_ticket_mxn >= 900 ? 2 : 1) +
    (brief.offer_clarity === "alta" ? 2 : brief.offer_clarity === "parcial" ? 1 : 0) +
    (brief.has_ecommerce || brief.has_landing ? 1 : 0);

  const combined = complexityScore * 2 + intensityScore * 2 + potentialScore - maturityScore * 0.5;

  let priceRange = { min: 4990, max: 8990 };
  if (combined >= 8 && combined < 13) priceRange = { min: 12000, max: 20000 };
  if (combined >= 13 && combined < 18) priceRange = { min: 20000, max: 35000 };
  if (combined >= 18) priceRange = { min: 35000, max: 60000 };

  const midpoint = Math.round((priceRange.min + priceRange.max) / 2);
  const urgencyLift = brief.urgency === "inmediata" ? 2500 : brief.urgency === "alta" ? 1500 : 0;
  const infraLift = (brief.needs_extra_landing ? 1000 : 0) + (brief.needs_extra_ecommerce ? 1500 : 0);
  const suggestedPrice = clamp(midpoint + urgencyLift + infraLift, priceRange.min, priceRange.max);
  const plusIva = Math.round(suggestedPrice * 1.16);

  const kpis =
    brief.conversion_channel === "ecommerce"
      ? "Publicaciones emitidas, visitas a tienda, productos vistos, agregar al carrito, inicios de checkout, compras, ticket promedio y tasa de conversion ecommerce."
      : brief.conversion_channel === "landing"
        ? "Publicaciones emitidas, visitas a landing, clics a CTA, formularios, clics a WhatsApp y tasa de conversion de landing."
        : "Publicaciones emitidas, visitas, clics clave, leads calificados y conversion por canal principal.";

  return {
    priceRange,
    suggestedPrice,
    sections: [
      { title: "1. Resumen del negocio", body: `${brief.brand || "Marca"} en ${brief.location || "ubicacion por definir"}, giro ${brief.industry || "comercial"}, enfoque en ${brief.main_goal}.` },
      { title: "2. Diagnostico comercial", body: `La marca presenta ${brief.has_landing || brief.has_ecommerce ? "base digital parcial" : "base digital inicial"} con necesidad de orden comercial y foco en conversion.` },
      { title: "3. Nivel de oportunidad detectado", body: `Se detecta una oportunidad ${potentialScore >= 5 ? "alta" : potentialScore >= 3 ? "media" : "controlada"} por ticket promedio y objetivo declarado.` },
      { title: "4. Estrategia recomendada", body: "Activar un plan de ejecucion mensual con contenido orientado a conversion, seguimiento comercial y optimizacion por aprendizaje semanal." },
      { title: "5. Canales y activos recomendados", body: `Canal principal: ${brief.conversion_channel}. Activos sugeridos: ${brief.needs_extra_landing ? "landing adicional, " : ""}${brief.needs_extra_ecommerce ? "ecommerce adicional, " : ""}${brief.needs_commercial_tracking ? "seguimiento comercial y CRM base." : "seguimiento comercial operativo."}` },
      { title: "6. KPIs estimados", body: kpis },
      { title: "7. Proyeccion mensual de resultados", body: "Escenario conservador: crecimiento gradual en trafico calificado y conversion, con mejora al sostener ejecucion y seguimiento comercial." },
      { title: "8. Cotizacion sugerida", body: `Recomendacion mensual: $${suggestedPrice.toLocaleString("es-MX")} MXN + IVA (total estimado con IVA: $${plusIva.toLocaleString("es-MX")} MXN).` },
      { title: "9. Servicios adicionales recomendados", body: `${brief.needs_extra_landing ? "Construccion/ajuste de landing. " : ""}${brief.needs_extra_ecommerce ? "Construccion/ajuste de ecommerce. " : ""}Automatizacion de seguimiento, reportes ejecutivos y ajuste de mensajes por canal.` },
      { title: "10. Riesgos y consideraciones", body: "El resultado depende de claridad de oferta, consistencia de ejecucion, capacidad de respuesta comercial y calidad de activos de conversion." },
    ],
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
          headline: "Empieza con esquema flexible y control comercial por resultados",
          subtitle: "Modelo accesible para crecer con costos variables claros y visibilidad total de cada venta.",
          ctaPrimary: "Activar esquema flexible",
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
  const [marketingBrief, setMarketingBrief] = useState<MarketingBriefForm>(DEFAULT_MARKETING_BRIEF);
  const [marketingQuote, setMarketingQuote] = useState<MarketingQuoteResult | null>(null);
  const [marketingSubmitting, setMarketingSubmitting] = useState(false);
  const [marketingError, setMarketingError] = useState("");
  const [marketingSuccess, setMarketingSuccess] = useState("");

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

  const handleMarketingBriefSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMarketingError("");
    setMarketingSuccess("");
    const generated = computeMarketingQuote(marketingBrief);
    setMarketingQuote(generated);
    try {
      setMarketingSubmitting(true);
      await api.createComerciaCustomerContactLead({
        name: marketingBrief.contact_name,
        email: marketingBrief.contact_email,
        phone: marketingBrief.contact_phone,
        company: marketingBrief.brand,
        contact_reason: "marketing_cotizacion",
        message:
          `Brief marketing recibido. Ubicacion=${marketingBrief.location}. Giro=${marketingBrief.industry}. ` +
          `Objetivo=${marketingBrief.main_goal}. Canal=${marketingBrief.conversion_channel}. ` +
          `Ticket=${marketingBrief.average_ticket_mxn}. Cotizacion sugerida=${generated.suggestedPrice}. ` +
          `Notas=${marketingBrief.notes || "-"}`,
        channel: "landing_marketing_form",
        status: "nuevo",
      });
      setMarketingSuccess("Brief recibido. Ya tienes una cotizacion preliminar y el equipo comercial puede darle seguimiento.");
    } catch (err) {
      setMarketingError(err instanceof Error ? err.message : "No fue posible registrar el brief de marketing.");
    } finally {
      setMarketingSubmitting(false);
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
          <p className="cp-kicker">LANDING COMERCIAL · COMERCIA BY REINPIA</p>
          <h1>Activa tu ecommerce y comienza a vender con una estructura profesional desde el primer día</h1>
          <p className="cp-brand-context">Enfoque principal: mezcla de catálogo, servicios y operación omnicanal.</p>
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
          <p className="cp-eyebrow">REINPIA · TECNOLÓGICO</p>
          <h2>Elige el modelo que mejor se adapte a tu negocio: inversión fija o esquema por comisión. Tecnología, operación e inteligencia artificial en una sola plataforma.</h2>
          <p>Sin ambigüedades: puedes iniciar con inversión definida o con esquema por resultados, siempre con control total de tu operación y tus ventas.</p>
          <div className="cp-cta-row">
            <button type="button" className="button" onClick={openDiagnostic}>
              Solicitar demo
            </button>
            <button type="button" className="button button-outline" onClick={openPlans}>
              Ver modelos de negocio
            </button>
            <button type="button" className="button button-outline" onClick={openLia}>
              Hablar con Lía IA
            </button>
          </div>
          <div className="cp-proof-row">
            <span>Implementación acelerada</span>
            <span>Arquitectura modular por industria</span>
            <span>Escalable para inversión y expansión</span>
          </div>
        </div>

        <aside className="cp-hero-ecosystem" aria-label="Mockups de ecosistema">
          <article className="cp-mock-card cp-main-mock">
            <p>Dashboard ejecutivo</p>
            <h3>Ventas + IA + Operación</h3>
            <ul>
              <li>Embudo comercial en tiempo real</li>
              <li>Alertas de conversión y recompra</li>
              <li>Control omnicanal por marca</li>
            </ul>
          </article>
          <article className="cp-mock-card">
            <p>Ecommerce premium</p>
            <h3>Checkout optimizado</h3>
            <ul>
              <li>Flujo de compra diseñado para conversión</li>
              <li>Integración con promociones y cupones</li>
            </ul>
          </article>
          <article className="cp-mock-card">
            <p>POS WebApp</p>
            <h3>Venta física conectada</h3>
            <ul>
              <li>Sincronización con inventario y clientes</li>
              <li>Información en tiempo real</li>
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
          <h2>El reto no es solo vender en linea: es operar, escalar y convertir de forma consistente</h2>
          <p>
            Empresas, comercios y distribuidores necesitan una base comercial que unifique canales, reduzca friccion
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
          <p className="cp-kicker">8. Segmentacion</p>
          <h2>Experiencias diferenciadas para cada tipo de usuario</h2>
        </header>
        <div className="cp-entry-grid">
          <article className="cp-entry-card">
            <p className="cp-entry-tag">Publico general</p>
            <h3>{SEGMENTS[0].title}</h3>
            <p>{SEGMENTS[0].detail}</p>
            <ul>
              <li>Navegacion clara orientada a conversion</li>
              <li>Promociones y recomendaciones inteligentes</li>
              <li>Checkout optimizado para cierre</li>
            </ul>
            <button type="button" className="button" onClick={openDiagnostic}>
              Quiero activar canal publico
            </button>
          </article>
          <article className="cp-entry-card cp-entry-card-alt">
            <p className="cp-entry-tag">Distribuidores y comercios</p>
            <h3>{SEGMENTS[1].title} + {SEGMENTS[2].title}</h3>
            <p>Canal B2B especializado para compra por volumen y operacion comercial escalable.</p>
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
          <p className="cp-kicker">3. Solucion</p>
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
            Usa estos prompts base para acelerar contenido comercial entendible por motores de busqueda y asistentes
            de IA.
          </p>
          <ul>
            {AI_PROMPTS.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="cp-section" id="marketing-diagnostico">
        <header className="cp-section-head">
          <p className="cp-kicker">7. Seccion Marketing COMERCIA (solo captacion)</p>
          <h2>Brief de marketing + metodologia de cotizacion ejecutiva</h2>
          <p>
            Aqui el cliente llena su formulario de contexto comercial y COMERCIA genera una cotizacion preliminar con metodologia consultiva.
          </p>
        </header>
        <div className="cp-marketing-grid">
          <article className="cp-marketing-card">
            <h3>Metodologia aplicada (CODEX)</h3>
            <ul>
              <li>Diagnostico consultivo con enfoque en rentabilidad y ejecucion real.</li>
              <li>Clasificacion interna por complejidad, madurez digital, intensidad y potencial comercial.</li>
              <li>Cotizacion sugerida sin promesas irreales ni subcotizacion.</li>
              <li>Entrega en formato ejecutivo de 10 puntos para revision comercial.</li>
            </ul>
          </article>
          <article className="cp-marketing-card">
            <h3>Formulario de brief comercial (cliente)</h3>
            <form className="detail-form cp-marketing-form" onSubmit={handleMarketingBriefSubmit}>
              <label>Nombre de contacto<input required value={marketingBrief.contact_name} onChange={(e) => setMarketingBrief((p) => ({ ...p, contact_name: e.target.value }))} /></label>
              <label>Correo<input required type="email" value={marketingBrief.contact_email} onChange={(e) => setMarketingBrief((p) => ({ ...p, contact_email: e.target.value }))} /></label>
              <label>Telefono / WhatsApp<input required value={marketingBrief.contact_phone} onChange={(e) => setMarketingBrief((p) => ({ ...p, contact_phone: e.target.value }))} /></label>
              <label>Marca<input required value={marketingBrief.brand} onChange={(e) => setMarketingBrief((p) => ({ ...p, brand: e.target.value }))} /></label>
              <label>Ubicacion<input required value={marketingBrief.location} onChange={(e) => setMarketingBrief((p) => ({ ...p, location: e.target.value }))} /></label>
              <label>Giro / industria<input required value={marketingBrief.industry} onChange={(e) => setMarketingBrief((p) => ({ ...p, industry: e.target.value }))} /></label>
              <label>Vende<select value={marketingBrief.sells} onChange={(e) => setMarketingBrief((p) => ({ ...p, sells: e.target.value as MarketingBriefForm["sells"] }))}><option value="productos">Productos</option><option value="servicios">Servicios</option><option value="mixto">Mixto</option></select></label>
              <label>Objetivo principal<select value={marketingBrief.main_goal} onChange={(e) => setMarketingBrief((p) => ({ ...p, main_goal: e.target.value as MarketingBriefForm["main_goal"] }))}><option value="ventas">Ventas</option><option value="leads">Leads</option><option value="reconocimiento">Reconocimiento</option><option value="distribuidores">Distribuidores</option><option value="recompra">Recompra</option></select></label>
              <label>Canal de conversion<select value={marketingBrief.conversion_channel} onChange={(e) => setMarketingBrief((p) => ({ ...p, conversion_channel: e.target.value as MarketingBriefForm["conversion_channel"] }))}><option value="ecommerce">Ecommerce</option><option value="landing">Landing</option><option value="whatsapp">WhatsApp</option><option value="formulario">Formulario</option><option value="pos">POS</option></select></label>
              <label>Redes activas<input value={marketingBrief.active_social_networks} onChange={(e) => setMarketingBrief((p) => ({ ...p, active_social_networks: e.target.value }))} /></label>
              <label>Cantidad de productos a impulsar<input type="number" min={1} value={marketingBrief.products_to_push} onChange={(e) => setMarketingBrief((p) => ({ ...p, products_to_push: Number(e.target.value || 1) }))} /></label>
              <label>Ticket promedio (MXN)<input type="number" min={100} value={marketingBrief.average_ticket_mxn} onChange={(e) => setMarketingBrief((p) => ({ ...p, average_ticket_mxn: Number(e.target.value || 100) }))} /></label>
              <label>Oferta clara<select value={marketingBrief.offer_clarity} onChange={(e) => setMarketingBrief((p) => ({ ...p, offer_clarity: e.target.value as MarketingBriefForm["offer_clarity"] }))}><option value="alta">Si</option><option value="parcial">Parcialmente</option><option value="baja">No</option></select></label>
              <label>Marca clara<select value={marketingBrief.brand_clarity} onChange={(e) => setMarketingBrief((p) => ({ ...p, brand_clarity: e.target.value as MarketingBriefForm["brand_clarity"] }))}><option value="alta">Si</option><option value="parcial">Parcialmente</option><option value="baja">No</option></select></label>
              <label>Urgencia<select value={marketingBrief.urgency} onChange={(e) => setMarketingBrief((p) => ({ ...p, urgency: e.target.value as MarketingBriefForm["urgency"] }))}><option value="inmediata">Inmediata</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></label>
              <label>Nivel de seguimiento<select value={marketingBrief.followup_level} onChange={(e) => setMarketingBrief((p) => ({ ...p, followup_level: e.target.value as MarketingBriefForm["followup_level"] }))}><option value="alto">Alto</option><option value="medio">Medio</option><option value="bajo">Bajo</option></select></label>
              <label>Venta dirigida a<select value={marketingBrief.sells_to} onChange={(e) => setMarketingBrief((p) => ({ ...p, sells_to: e.target.value as MarketingBriefForm["sells_to"] }))}><option value="publico_general">Publico general</option><option value="distribuidores">Distribuidores</option><option value="ambos">Ambos</option></select></label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.has_landing} onChange={(e) => setMarketingBrief((p) => ({ ...p, has_landing: e.target.checked }))} />Tiene landing actual</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.has_ecommerce} onChange={(e) => setMarketingBrief((p) => ({ ...p, has_ecommerce: e.target.checked }))} />Tiene ecommerce actual</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.posts_consistently} onChange={(e) => setMarketingBrief((p) => ({ ...p, posts_consistently: e.target.checked }))} />Publica de forma constante</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.needs_extra_landing} onChange={(e) => setMarketingBrief((p) => ({ ...p, needs_extra_landing: e.target.checked }))} />Necesita landing adicional</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.needs_extra_ecommerce} onChange={(e) => setMarketingBrief((p) => ({ ...p, needs_extra_ecommerce: e.target.checked }))} />Necesita ecommerce adicional</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.needs_commercial_tracking} onChange={(e) => setMarketingBrief((p) => ({ ...p, needs_commercial_tracking: e.target.checked }))} />Necesita seguimiento comercial</label>
              <label className="checkbox"><input type="checkbox" checked={marketingBrief.wants_custom_proposal} onChange={(e) => setMarketingBrief((p) => ({ ...p, wants_custom_proposal: e.target.checked }))} />Quiere propuesta personalizada</label>
              <label>Notas del cliente<textarea value={marketingBrief.notes} onChange={(e) => setMarketingBrief((p) => ({ ...p, notes: e.target.value }))} /></label>
              <button className="button" type="submit" disabled={marketingSubmitting}>{marketingSubmitting ? "Generando..." : "Generar cotizacion preliminar"}</button>
            </form>
            {marketingError ? <p className="error">{marketingError}</p> : null}
            {marketingSuccess ? <p className="cp-success">{marketingSuccess}</p> : null}
          </article>
        </div>
        {marketingQuote ? (
          <article className="cp-marketing-output">
            <h3>Resultado esperado (ejemplo de salida de cotizacion)</h3>
            <p>
              Cotizacion sugerida: <strong>${marketingQuote.suggestedPrice.toLocaleString("es-MX")} MXN + IVA</strong>
              {" | "}Rango de referencia: ${marketingQuote.priceRange.min.toLocaleString("es-MX")} - ${marketingQuote.priceRange.max.toLocaleString("es-MX")} MXN + IVA
            </p>
            <div className="cp-pillars">
              {marketingQuote.sections.map((section) => (
                <article key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className="cp-section" id="casos-uso">
        <header className="cp-section-head">
          <p className="cp-kicker">8. Casos de uso</p>
          <h2>Diseno de landing y ecommerce para multiples empresas e industrias.</h2>
          <p>Arquitectura comercial disenada para adaptarse a distintos giros, integrando SEO, AEO y prompts optimizados para mejorar visibilidad, posicionamiento y conversion.</p>
          <p>Desarrollado para que tu marca sea mas facil de encontrar, entender y convertir en buscadores, asistentes de IA y canales digitales.</p>
          <p>Preparado para operar desde Mexico y escalar a otros mercados, con una estructura comercial lista para trabajar en pesos, dolares y euros.</p>
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
          <p>Ambos modelos son compatibles con ecommerce, webapp y operacion multi-tenant con personalizacion por marca (colores, logo, tipografia y productos).</p>
          <button type="button" className="button button-outline" onClick={openContact}>
            Hablar con consultor
          </button>
        </div>
      </section>

      <section className="cp-section" id="compatibilidad">
        <header className="cp-section-head">
          <p className="cp-kicker">7. Compatibilidad SaaS</p>
          <h2>Base reutilizable para multiples marcas sin perder identidad</h2>
        </header>
        <div className="cp-pillars">
          <article>
            <h3>Compatible con ecommerce</h3>
            <p>Catalogo, carrito, checkout y recomendaciones con estructura preparada para distintos verticales.</p>
          </article>
          <article>
            <h3>Compatible con webapp</h3>
            <p>Canal operativo para equipos comerciales y POS conectado a inventario, clientes y pagos.</p>
          </article>
          <article>
            <h3>Preparado para multi-tenant</h3>
            <p>Cada marca opera con dominio logico propio y variaciones de copy, branding y oferta.</p>
          </article>
          <article>
            <h3>Personalizable por marca</h3>
            <p>Colores, logo, tipografia y productos se adaptan automaticamente sin romper la experiencia premium.</p>
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
            <a href="#marketing-diagnostico">Seccion Marketing COMERCIA</a>
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

