type AgentWidgetPlaceholderProps = {
  name: string;
  description: string;
  bullets: string[];
  accent?: string;
};

export function AgentWidgetPlaceholder({ name, description, bullets, accent }: AgentWidgetPlaceholderProps) {
  return (
    <section className="agent-widget" style={accent ? { borderColor: accent } : undefined}>
      <div className="agent-avatar">{name.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{name}</h3>
        <p>{description}</p>
        <ul className="marketing-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <button className="button button-outline" type="button">
          Widget IA (placeholder listo para integrar)
        </button>
      </div>
    </section>
  );
}

