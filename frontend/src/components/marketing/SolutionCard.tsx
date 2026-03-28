type SolutionCardProps = {
  title: string;
  description: string;
  tag?: string;
};

export function SolutionCard({ title, description, tag }: SolutionCardProps) {
  return (
    <article className="card marketing-card">
      {tag ? <p className="marketing-tag">{tag}</p> : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

