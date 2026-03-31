import { FormEvent, useMemo, useState } from "react";
import { api } from "../../services/api";

type LiaAnswers = {
  business_type?: "productos" | "servicios" | "mixto";
  stage?: "inicio" | "crecimiento" | "expansion";
  sells_online?: "si" | "no";
  needs_logistics?: "si" | "no";
  needs_distributors?: "si" | "no";
  has_landing?: "si" | "no";
  needs_pos?: "si" | "no";
  goal?: "vender_mas" | "ordenar_operacion" | "escalar_distribucion" | "automatizar";
};

type Question = {
  key: keyof LiaAnswers;
  question: string;
  helper: string;
  options: Array<{ label: string; value: LiaAnswers[keyof LiaAnswers] }>;
};

type LeadForm = {
  buyer_name: string;
  company_name: string;
  buyer_email: string;
  buyer_phone: string;
};

type Message = {
  role: "lia" | "user";
  text: string;
};

const QUESTIONS: Question[] = [
  {
    key: "business_type",
    question: "Para orientarte bien, que tipo de negocio tienes?",
    helper: "Esto me ayuda a definir si priorizamos servicios, catalogo o mezcla de ambos.",
    options: [
      { label: "Productos", value: "productos" },
      { label: "Servicios", value: "servicios" },
      { label: "Mixto", value: "mixto" },
    ],
  },
  {
    key: "stage",
    question: "En que etapa estas hoy?",
    helper: "No es lo mismo activar un negocio nuevo que escalar uno con traccion.",
    options: [
      { label: "Iniciando", value: "inicio" },
      { label: "Creciendo", value: "crecimiento" },
      { label: "Expansion", value: "expansion" },
    ],
  },
  {
    key: "sells_online",
    question: "Ya vendes en linea actualmente?",
    helper: "Si no vendes online, podemos priorizar una salida rapida para conversion.",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_logistics",
    question: "Necesitas apoyo logistico (recoleccion, entrega o resguardo)?",
    helper: "Podemos integrar operacion fisica cuando no tienes logistica propia.",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_distributors",
    question: "Quieres activar canal de distribuidores o aliados comerciales?",
    helper: "Esto cambia la arquitectura de precios, volumen y seguimiento comercial.",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "has_landing",
    question: "Tu marca ya cuenta con landing comercial?",
    helper: "Si no la tienes, la incluimos como prioridad para captar demanda.",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_pos",
    question: "Necesitas POS / WebApp para ventas presenciales?",
    helper: "Nos ayuda a definir si trabajamos canal online, fisico o ambos.",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "goal",
    question: "Cual es tu objetivo principal en los proximos 90 dias?",
    helper: "Con esto cierro una recomendacion accionable para tu caso.",
    options: [
      { label: "Vender mas", value: "vender_mas" },
      { label: "Ordenar operacion", value: "ordenar_operacion" },
      { label: "Escalar distribuidores", value: "escalar_distribucion" },
      { label: "Automatizar seguimiento", value: "automatizar" },
    ],
  },
];

function getRecommendation(answers: LiaAnswers) {
  let score = 0;
  const reasons: string[] = [];

  if (answers.stage === "expansion") {
    score += 2;
    reasons.push("Tu negocio ya esta en fase de expansion y necesita mayor control operativo.");
  }
  if (answers.needs_distributors === "si") {
    score += 2;
    reasons.push("Necesitas un canal distribuidor con reglas y seguimiento comercial.");
  }
  if (answers.needs_pos === "si") {
    score += 1;
    reasons.push("Requieres operacion omnicanal con punto de venta y trazabilidad.");
  }
  if (answers.goal === "automatizar") {
    score += 1;
    reasons.push("Tu prioridad es automatizar procesos y seguimiento.");
  }
  if (answers.sells_online === "no") {
    reasons.push("Aun no vendes online y conviene activar salida comercial de forma rapida.");
  }
  if (answers.has_landing === "no") {
    reasons.push("Necesitas una landing comercial para captar demanda y convertir.");
  }
  if (answers.needs_logistics === "si") {
    reasons.push("Necesitas logistica integrada para operar sin friccion.");
  }

  const planCode = score >= 4 ? "COMERCIA_ESCALA" : "COMERCIA_IMPULSA";
  const planLabel = planCode === "COMERCIA_ESCALA" ? "ComerCia ESCALA" : "ComerCia IMPULSA";
  const rationale =
    planCode === "COMERCIA_ESCALA"
      ? "Te conviene una estructura robusta para crecer con automatizacion, canal distribuidor y control operativo."
      : "Te conviene activar una base comercial ordenada, medible y lista para escalar sin complejidad inicial.";

  return { planCode, planLabel, rationale, reasons };
}

export function LiaSalesAssistant({ referralCode }: { referralCode: string }) {
  const [answers, setAnswers] = useState<LiaAnswers>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "lia",
      text: "Hola, soy Lia. En 2 minutos te ayudo a elegir la ruta comercial ideal para tu marca.",
    },
    {
      role: "lia",
      text: QUESTIONS[0].question,
    },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [leadForm, setLeadForm] = useState<LeadForm>({
    buyer_name: "",
    company_name: "",
    buyer_email: "",
    buyer_phone: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const done = stepIndex >= QUESTIONS.length;
  const recommendation = useMemo(() => (done ? getRecommendation(answers) : null), [answers, done]);
  const currentQuestion = QUESTIONS[stepIndex];

  const chooseOption = (label: string, value: LiaAnswers[keyof LiaAnswers]) => {
    if (!currentQuestion) return;
    const nextAnswers: LiaAnswers = { ...answers, [currentQuestion.key]: value as never };
    setAnswers(nextAnswers);
    const nextMessages: Message[] = [...messages, { role: "user", text: label }];
    const nextIndex = stepIndex + 1;

    if (nextIndex < QUESTIONS.length) {
      nextMessages.push({
        role: "lia",
        text: `${QUESTIONS[nextIndex].question} ${QUESTIONS[nextIndex].helper}`,
      });
    } else {
      const result = getRecommendation(nextAnswers);
      nextMessages.push({
        role: "lia",
        text: `Listo. Para tu caso te recomiendo ${result.planLabel}. Te explico por que y como aprovecharlo para cerrar mas ventas.`,
      });
    }

    setMessages(nextMessages);
    setStepIndex(nextIndex);
  };

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!recommendation) return;
    try {
      setError("");
      const payload = {
        company_name: leadForm.company_name,
        legal_type: "constituted_company",
        buyer_name: leadForm.buyer_name,
        buyer_email: leadForm.buyer_email,
        buyer_phone: leadForm.buyer_phone,
        selected_plan_code: recommendation.planCode,
        referral_code: referralCode || undefined,
        source_type: referralCode ? "query_param" : "direct",
        needs_followup: true,
        needs_appointment: true,
        purchase_status: "pending_contact",
        notes: `channel=lia_assistant | respuestas=${JSON.stringify(answers)} | recomendacion=${recommendation.planCode}`,
      };
      await api.createComerciaPlanPurchaseLead(payload);
      await api.createComerciaCustomerContactLead({
        name: leadForm.buyer_name,
        email: leadForm.buyer_email,
        phone: leadForm.buyer_phone,
        company: leadForm.company_name,
        contact_reason: "planes",
        message: `Solicitud comercial desde Lia. ${recommendation.rationale}`,
        channel: "lia_assistant",
        recommended_plan: recommendation.planCode,
        status: "new",
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar tu solicitud comercial.");
    }
  };

  return (
    <section className="lia-assistant" id="lia-comercial">
      <div className="lia-header">
        <div className="lia-avatar">L</div>
        <div>
          <p className="lia-kicker">Asistente comercial IA</p>
          <h3>Lia by ComerCia</h3>
          <p>
            Diagnostico conversacional para recomendar plan, resolver dudas y ayudarte a tomar decision con claridad.
          </p>
        </div>
      </div>

      <div className="lia-chat">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`lia-bubble ${message.role === "lia" ? "lia-bubble-ai" : "lia-bubble-user"}`}>
            {message.text}
          </div>
        ))}
      </div>

      {!done && currentQuestion ? (
        <div className="lia-options">
          <p>{currentQuestion.helper}</p>
          <div className="lia-chip-list">
            {currentQuestion.options.map((option) => (
              <button key={String(option.value)} type="button" className="lia-chip" onClick={() => chooseOption(option.label, option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recommendation ? (
        <div className="lia-result">
          <h4>Plan recomendado: {recommendation.planLabel}</h4>
          <p>{recommendation.rationale}</p>
          <ul className="marketing-list">
            {recommendation.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div className="row-gap lia-cta-row">
            <a className="button" href="#diagnostico">Continuar diagnostico completo</a>
            <a className="button button-outline" href="#atencion-cliente">Solicitar asesoria directa</a>
            <a className="button button-outline" href="#paquetes">Revisar paquetes</a>
          </div>

          <form className="inline-form" onSubmit={submitLead}>
            <input
              required
              placeholder="Tu nombre"
              value={leadForm.buyer_name}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_name: event.target.value }))}
            />
            <input
              required
              placeholder="Empresa o marca"
              value={leadForm.company_name}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, company_name: event.target.value }))}
            />
            <input
              required
              placeholder="Correo"
              value={leadForm.buyer_email}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_email: event.target.value }))}
            />
            <input
              required
              placeholder="WhatsApp"
              value={leadForm.buyer_phone}
              onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_phone: event.target.value }))}
            />
            <button className="button" type="submit">Solicitar propuesta con Lia</button>
          </form>

          {submitted ? <p>Listo. Ya registre tu solicitud y el equipo comercial te contactara con un siguiente paso concreto.</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
