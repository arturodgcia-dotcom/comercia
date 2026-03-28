type AudienceSplitSectionProps = {
  title: string;
  leftTitle: string;
  leftBullets: string[];
  rightTitle: string;
  rightBullets: string[];
};

export function AudienceSplitSection({
  title,
  leftTitle,
  leftBullets,
  rightTitle,
  rightBullets
}: AudienceSplitSectionProps) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="audience-split">
        <article className="card marketing-card">
          <h3>{leftTitle}</h3>
          <ul className="marketing-list">
            {leftBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
        <article className="card marketing-card">
          <h3>{rightTitle}</h3>
          <ul className="marketing-list">
            {rightBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

