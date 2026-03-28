interface SecurityKpiCardProps {
  label: string;
  value: string | number;
}

export function SecurityKpiCard({ label, value }: SecurityKpiCardProps) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
    </article>
  );
}

