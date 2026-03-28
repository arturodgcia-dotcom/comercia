export function ReportKpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
    </article>
  );
}

