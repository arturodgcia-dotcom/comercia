import { Link } from "react-router-dom";

type PackageCardProps = {
  name: string;
  subtitle: string;
  focus: string;
  includes: string[];
  primaryTo: string;
  secondaryTo: string;
};

export function PackageCard({ name, subtitle, focus, includes, primaryTo, secondaryTo }: PackageCardProps) {
  const PrimaryLink = primaryTo.startsWith("#") ? (
    <a className="button" href={primaryTo}>
      Quiero este plan
    </a>
  ) : (
    <Link className="button" to={primaryTo}>
      Quiero este plan
    </Link>
  );
  const SecondaryLink = secondaryTo.startsWith("#") ? (
    <a className="button button-outline" href={secondaryTo}>
      Hablar con un asesor
    </a>
  ) : (
    <Link className="button button-outline" to={secondaryTo}>
      Hablar con un asesor
    </Link>
  );

  return (
    <article className="card marketing-card package-card">
      <h3>{name}</h3>
      <p className="marketing-subtitle">{subtitle}</p>
      <p>{focus}</p>
      <ul className="marketing-list">
        {includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="store-actions">
        {PrimaryLink}
        {SecondaryLink}
      </div>
    </article>
  );
}
