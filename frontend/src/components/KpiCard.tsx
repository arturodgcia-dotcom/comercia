export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className="card">
      <p className="metric-label">{label}</p>
      <h3 className="metric-value">{value}</h3>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </article>
  );
}

