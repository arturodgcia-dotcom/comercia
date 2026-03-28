import { Link } from "react-router-dom";

type CTASectionProps = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
};

export function CTASection({
  title,
  subtitle,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo
}: CTASectionProps) {
  const PrimaryLink = primaryTo.startsWith("#") ? (
    <a className="button" href={primaryTo}>
      {primaryLabel}
    </a>
  ) : (
    <Link className="button" to={primaryTo}>
      {primaryLabel}
    </Link>
  );
  return (
    <section className="marketing-cta">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="store-actions">
        {PrimaryLink}
        {secondaryLabel && secondaryTo ? (
          secondaryTo.startsWith("#") ? (
            <a className="button button-outline" href={secondaryTo}>
              {secondaryLabel}
            </a>
          ) : (
            <Link className="button button-outline" to={secondaryTo}>
              {secondaryLabel}
            </Link>
          )
        ) : null}
      </div>
    </section>
  );
}
