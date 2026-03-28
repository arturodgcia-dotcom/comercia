export function StatusSummaryCard({
  title,
  values
}: {
  title: string;
  values: Array<{ label: string; value: number | string }>;
}) {
  return (
    <article className="panel">
      <h4>{title}</h4>
      <ul>
        {values.map((row) => (
          <li key={row.label}>
            {row.label}: {row.value}
          </li>
        ))}
      </ul>
    </article>
  );
}

