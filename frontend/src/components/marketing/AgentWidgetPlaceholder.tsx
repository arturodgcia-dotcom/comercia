import { useMemo, useState } from "react";

type AgentWidgetPlaceholderProps = {
  id?: string;
  name: string;
  description: string;
  bullets: string[];
  accent?: string;
  advisorTarget?: string;
  onRecommendPlan?: (planCode: "COMERCIA_IMPULSA" | "COMERCIA_ESCALA") => void;
};

type ConversationState = {
  answer: string;
  recommendation?: "COMERCIA_IMPULSA" | "COMERCIA_ESCALA";
};

const CONVERSATION_MAP: Record<string, ConversationState> = {
  "inicio": {
    answer: "Te acompano en 2 minutos. Cuentame que quieres lograr primero para recomendarte el plan ideal.",
  },
  "ordenar": {
    answer: "Si estas iniciando o necesitas ordenar operacion y ventas, te recomiendo ComerCia IMPULSA.",
    recommendation: "COMERCIA_IMPULSA",
  },
  "crecer": {
    answer: "Si ya vendes y quieres escalar con automatizacion, canal distribuidor y control operativo, te recomiendo ComerCia ESCALA.",
    recommendation: "COMERCIA_ESCALA",
  },
  "logistica": {
    answer: "Podemos activar logistica adicional para recoleccion, entrega y resguardo. Se cotiza por servicio y se registra para facturacion a tu marca.",
  },
  "asesor": {
    answer: "Perfecto. Te llevo al diagnostico comercial para que un asesor tome tu caso con contexto completo.",
  },
};

export function AgentWidgetPlaceholder({
  id,
  name,
  description,
  bullets,
  accent,
  advisorTarget = "#diagnostico",
  onRecommendPlan,
}: AgentWidgetPlaceholderProps) {
  const [selected, setSelected] = useState<keyof typeof CONVERSATION_MAP>("inicio");

  const state = useMemo(() => CONVERSATION_MAP[selected], [selected]);

  const handleOption = (option: keyof typeof CONVERSATION_MAP) => {
    setSelected(option);
    const recommendation = CONVERSATION_MAP[option].recommendation;
    if (recommendation && onRecommendPlan) {
      onRecommendPlan(recommendation);
    }
  };

  return (
    <section id={id} className="agent-widget" style={accent ? { borderColor: accent } : undefined}>
      <div className="agent-avatar">{name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{name}</h3>
        <p>{description}</p>
        <ul className="marketing-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>

        <article className="agent-chat">
          <p className="agent-chat-label">Conversacion comercial</p>
          <p className="agent-chat-answer">{state.answer}</p>
          {state.recommendation ? (
            <p className="agent-chat-plan">
              Recomendacion actual: {state.recommendation === "COMERCIA_IMPULSA" ? "ComerCia IMPULSA" : "ComerCia ESCALA"}
            </p>
          ) : null}
          <div className="agent-chat-actions">
            <button className="button button-outline" type="button" onClick={() => handleOption("ordenar")}>
              Estoy iniciando
            </button>
            <button className="button button-outline" type="button" onClick={() => handleOption("crecer")}>
              Quiero escalar rapido
            </button>
            <button className="button button-outline" type="button" onClick={() => handleOption("logistica")}>
              Necesito logistica
            </button>
            <button className="button button-outline" type="button" onClick={() => handleOption("asesor")}>
              Hablar con asesor
            </button>
          </div>
          <a className="button" href={advisorTarget} onClick={() => handleOption("asesor")}>
            Ir a diagnostico guiado
          </a>
        </article>
      </div>
    </section>
  );
}
