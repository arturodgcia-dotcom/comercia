import { Link } from "react-router-dom";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
  className?: string;
};

function ActionLink({ label, to, outline = false }: { label: string; to: string; outline?: boolean }) {
  const className = outline ? "button button-outline" : "button";
  if (to.startsWith("#")) {
    return (
      <a className={className} href={to}>
        {label}
      </a>
    );
  }
  return (
    <Link className={className} to={to}>
      {label}
    </Link>
  );
}

export function HeroSection({
  eyebrow,
  title,
  subtitle,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  className
}: HeroSectionProps) {
  return (
    <section className={`marketing-hero ${className ?? ""}`.trim()}>
      {eyebrow ? <p className="marketing-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className="store-actions">
        <ActionLink label={primaryLabel} to={primaryTo} />
        {secondaryLabel && secondaryTo ? <ActionLink label={secondaryLabel} to={secondaryTo} outline /> : null}
      </div>
    </section>
  );
}

