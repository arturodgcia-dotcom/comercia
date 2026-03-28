type SimpleChartSectionProps = {
  title: string;
  series: Array<{ label: string; value: number }>;
};

export function SimpleChartSection({ title, series }: SimpleChartSectionProps) {
  const maxValue = Math.max(...series.map((item) => item.value), 1);
  return (
    <section className="store-banner">
      <h3>{title}</h3>
      <div className="simple-chart">
        {series.map((item) => (
          <div key={item.label} className="simple-chart-row">
            <span>{item.label}</span>
            <div className="simple-chart-bar-wrap">
              <div className="simple-chart-bar" style={{ width: `${(item.value / maxValue) * 100}%` }} />
            </div>
            <strong>{item.value.toLocaleString("es-MX")}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

