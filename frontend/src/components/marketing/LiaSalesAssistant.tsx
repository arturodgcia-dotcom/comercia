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
    question: "Para empezar, que tipo de negocio tienes?",
    options: [
      { label: "Productos", value: "productos" },
      { label: "Servicios", value: "servicios" },
      { label: "Mixto", value: "mixto" },
    ],
  },
  {
    key: "stage",
    question: "En que etapa esta tu negocio hoy?",
    options: [
      { label: "Iniciando", value: "inicio" },
      { label: "Creciendo", value: "crecimiento" },
      { label: "Expansion", value: "expansion" },
    ],
  },
  {
    key: "sells_online",
    question: "Ya vendes en linea actualmente?",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_logistics",
    question: "Necesitas apoyo logistico (recoleccion, entrega o resguardo)?",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_distributors",
    question: "Quieres activar canal de distribuidores o agencias?",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "has_landing",
    question: "Tu marca ya tiene landing comercial funcionando?",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "needs_pos",
    question: "Necesitas punto de venta (POS / WebApp) para ventas presenciales?",
    options: [
      { label: "Si", value: "si" },
      { label: "No", value: "no" },
    ],
  },
  {
    key: "goal",
    question: "Cual es tu objetivo principal en los proximos 90 dias?",
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
    reasons.push("Tu negocio ya esta en fase de expansion.");
  }
  if (answers.needs_distributors === "si") {
    score += 2;
    reasons.push("Necesitas canal distribuidor con reglas comerciales.");
  }
  if (answers.needs_pos === "si") {
    score += 1;
    reasons.push("Requieres operacion omnicanal con POS.");
  }
  if (answers.goal === "automatizar") {
    score += 1;
    reasons.push("Buscas automatizar seguimiento comercial.");
  }
  if (answers.sells_online === "no") {
    reasons.push("Aun no vendes en linea y necesitas activacion rapida.");
  }
  if (answers.has_landing === "no") {
    reasons.push("Necesitas una landing comercial para captar demanda.");
  }

  const planCode = score >= 4 ? "COMERCIA_ESCALA" : "COMERCIA_IMPULSA";
  const planLabel = planCode === "COMERCIA_ESCALA" ? "ComerCia ESCALA" : "ComerCia IMPULSA";
  const rationale =
    planCode === "COMERCIA_ESCALA"
      ? "Te conviene una estructura robusta para crecimiento, automatizacion y expansion de canal."
      : "Te conviene activar rapido una base comercial ordenada y medible para acelerar resultados.";

  return { planCode, planLabel, rationale, reasons };
}

export function LiaSalesAssistant({ referralCode }: { referralCode: string }) {
  const [answers, setAnswers] = useState<LiaAnswers>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "lia",
      text: "Hola, soy Lia. Te voy a hacer un diagnostico rapido para recomendarte el plan ideal.",
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
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: label },
    ];

    const nextIndex = stepIndex + 1;
    if (nextIndex < QUESTIONS.length) {
      nextMessages.push({ role: "lia", text: QUESTIONS[nextIndex].question });
    } else {
      const result = getRecommendation(nextAnswers);
      nextMessages.push({ role: "lia", text: `Listo. Mi recomendacion para tu negocio es ${result.planLabel}.` });
    }

    setMessages(nextMessages);
    setStepIndex(nextIndex);
  };

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!recommendation) return;
    try {
      setError("");
      await api.createComerciaPlanPurchaseLead({
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
        notes: `Lead desde Lia | respuestas=${JSON.stringify(answers)}`,
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
          <p>Diagnostico guiado para recomendar plan y acelerar tu cierre comercial.</p>
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
          <p>{currentQuestion.question}</p>
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
            <button className="button" type="submit">Quiero este diagnostico</button>
            <a className="button button-outline" href="#diagnostico">Continuar diagnostico completo</a>
          </form>

          {submitted ? <p>Listo. Tu solicitud fue registrada y un asesor te contactara con esta recomendacion.</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
