interface OnboardingStepCardProps {
  title: string;
  content: string;
  completed: boolean;
  onComplete: () => void;
}

export function OnboardingStepCard({ title, content, completed, onComplete }: OnboardingStepCardProps) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{content}</p>
      <button className="button" onClick={onComplete} type="button">
        {completed ? "Marcado como completado" : "Marcar como completado"}
      </button>
    </article>
  );
}
