interface ChecklistPanelProps {
  items: Array<{ label: string; done: boolean }>;
}

export function ChecklistPanel({ items }: ChecklistPanelProps) {
  return (
    <section className="card">
      <h4>Checklist</h4>
      <ul>
        {items.map((item) => (
          <li key={item.label}>{item.done ? "[x]" : "[ ]"} {item.label}</li>
        ))}
      </ul>
    </section>
  );
}
