interface OnboardingSidebarProps {
  steps: Array<{ id: number; step_order: number; title: string }>;
  activeStepId: number | null;
  onSelect: (stepId: number) => void;
}

export function OnboardingSidebar({ steps, activeStepId, onSelect }: OnboardingSidebarProps) {
  return (
    <aside className="card">
      <h3>Pasos</h3>
      {steps.map((step) => (
        <button
          key={step.id}
          className={`button button-outline ${activeStepId === step.id ? "active-step" : ""}`}
          style={{ display: "block", marginBottom: 8, width: "100%", textAlign: "left" }}
          onClick={() => onSelect(step.id)}
          type="button"
        >
          {step.step_order}. {step.title}
        </button>
      ))}
    </aside>
  );
}
