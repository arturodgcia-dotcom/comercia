interface ProgressTrackerProps {
  total: number;
  completed: number;
}

export function ProgressTracker({ total, completed }: ProgressTrackerProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <section className="card">
      <h4>Progreso</h4>
      <p>
        {completed}/{total} completados ({percentage}%)
      </p>
      <div className="simple-chart-bar-wrap">
        <div className="simple-chart-bar" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}
