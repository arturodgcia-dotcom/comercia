export function InsightCard({
  title,
  message,
  recommendation
}: {
  title: string;
  message: string;
  recommendation?: string;
}) {
  return (
    <article className="panel">
      <h4>{title}</h4>
      <p>{message}</p>
      {recommendation ? <p className="muted">Recomendacion: {recommendation}</p> : null}
    </article>
  );
}

