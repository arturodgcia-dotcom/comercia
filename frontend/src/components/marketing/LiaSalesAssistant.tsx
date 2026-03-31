import { FormEvent, useEffect, useMemo, useState } from "react";
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
    reasons.push("Tu negocio esta en fase de expansion y necesita mayor control operativo.");
  }
  if (answers.needs_distributors === "si") {
    score += 2;
    reasons.push("Necesitas canal distribuidor con reglas y seguimiento comercial.");
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
    reasons.push("Necesitas landing comercial para captar demanda y convertir mejor.");
  }

  const planCode = score >= 4 ? "COMERCIA_ESCALA" : "COMERCIA_IMPULSA";
  const planLabel = planCode === "COMERCIA_ESCALA" ? "ComerCia ESCALA" : "ComerCia IMPULSA";
  const rationale =
    planCode === "COMERCIA_ESCALA"
      ? "Te conviene una estructura robusta para crecer con automatizacion y canal distribuidor."
      : "Te conviene activar una base comercial ordenada y medible para acelerar resultados.";

  return { planCode, planLabel, rationale, reasons };
}

type Props = {
  referralCode: string;
  onOpenDiagnostic: () => void;
  onOpenContact: () => void;
  onOpenPackages: () => void;
};

export function LiaSalesAssistant({ referralCode, onOpenDiagnostic, onOpenContact, onOpenPackages }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: Math.max(window.innerWidth - 390, 18), y: Math.max(window.innerHeight - 590, 18) });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [answers, setAnswers] = useState<LiaAnswers>({});
  const [messages, setMessages] = useState<Message[]>([
    { role: "lia", text: "Hola, soy Lia. Te ayudo a definir la mejor ruta comercial para tu marca." },
    { role: "lia", text: QUESTIONS[0].question },
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

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener("lia:open", openHandler);
    return () => window.removeEventListener("lia:open", openHandler);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: MouseEvent) => {
      const nextX = Math.min(Math.max(event.clientX - dragOffset.x, 8), window.innerWidth - 320);
      const nextY = Math.min(Math.max(event.clientY - dragOffset.y, 8), window.innerHeight - 120);
      setPosition({ x: nextX, y: nextY });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, dragOffset]);

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
      nextMessages.push({ role: "lia", text: `${QUESTIONS[nextIndex].question} ${QUESTIONS[nextIndex].helper}` });
    } else {
      const result = getRecommendation(nextAnswers);
      nextMessages.push({ role: "lia", text: `Listo. Para tu caso te recomiendo ${result.planLabel}.` });
      nextMessages.push({ role: "lia", text: result.rationale });
    }

    setMessages(nextMessages.slice(-12));
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
        notes: `channel=lia_widget | respuestas=${JSON.stringify(answers)} | recomendacion=${recommendation.planCode}`,
      });
      await api.createComerciaCustomerContactLead({
        name: leadForm.buyer_name,
        email: leadForm.buyer_email,
        phone: leadForm.buyer_phone,
        company: leadForm.company_name,
        contact_reason: "planes",
        message: `Solicitud comercial desde Lia widget. ${recommendation.rationale}`,
        channel: "lia_widget",
        recommended_plan: recommendation.planCode,
        status: "nuevo",
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible registrar tu solicitud comercial.");
    }
  };

  const widgetStyle = { left: `${position.x}px`, top: `${position.y}px` };

  return (
    <>
      {!isOpen ? (
        <button className="lia-fab" type="button" onClick={() => setIsOpen(true)} aria-label="Abrir Lia">
          <span>L</span>
          <small>Lia</small>
        </button>
      ) : null}

      {isOpen ? (
        <section className="lia-widget" style={widgetStyle}>
          <header
            className="lia-widget-header"
            onMouseDown={(event) => {
              setDragging(true);
              setDragOffset({ x: event.clientX - position.x, y: event.clientY - position.y });
            }}
          >
            <div>
              <strong>Lia by ComerCia</strong>
              <p>Asistente comercial IA</p>
            </div>
            <button type="button" className="button button-outline" onClick={() => setIsOpen(false)}>
              Cerrar
            </button>
          </header>

          <div className="lia-widget-body">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`lia-bubble ${message.role === "lia" ? "lia-bubble-ai" : "lia-bubble-user"}`}>
                {message.text}
              </div>
            ))}
          </div>

          {!done && currentQuestion ? (
            <div className="lia-widget-actions">
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
              <ul className="marketing-list">
                {recommendation.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="lia-quick-cta-grid">
                <button type="button" className="button" onClick={onOpenDiagnostic}>Solicitar diagnostico</button>
                <button type="button" className="button button-outline" onClick={onOpenContact}>Hablar con asesor</button>
                <button type="button" className="button button-outline" onClick={onOpenPackages}>Ir a paquetes</button>
              </div>

              <form className="inline-form" onSubmit={submitLead}>
                <input required placeholder="Nombre" value={leadForm.buyer_name} onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_name: event.target.value }))} />
                <input required placeholder="Empresa" value={leadForm.company_name} onChange={(event) => setLeadForm((prev) => ({ ...prev, company_name: event.target.value }))} />
                <input required placeholder="Correo" value={leadForm.buyer_email} onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_email: event.target.value }))} />
                <input required placeholder="WhatsApp" value={leadForm.buyer_phone} onChange={(event) => setLeadForm((prev) => ({ ...prev, buyer_phone: event.target.value }))} />
                <button className="button" type="submit">Dejar mis datos</button>
              </form>

              {submitted ? <p>Listo. Ya registre tu solicitud y el equipo te contactara para cierre comercial.</p> : null}
              {error ? <p className="error">{error}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
