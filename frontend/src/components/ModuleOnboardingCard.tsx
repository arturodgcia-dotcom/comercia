import { useMemo, useState } from "react";

type ModuleOnboardingCardProps = {
  moduleKey: string;
  title: string;
  whatItDoes: string;
  whyItMatters: string;
  whatToCapture: string[];
  impact: string;
};

const STORAGE_PREFIX = "comercia_onboarding_seen_";

export function ModuleOnboardingCard({
  moduleKey,
  title,
  whatItDoes,
  whyItMatters,
  whatToCapture,
  impact,
}: ModuleOnboardingCardProps) {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${moduleKey}`, [moduleKey]);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey) === "1");

  if (dismissed) return null;

  return (
    <article className="module-onboarding-card">
      <p className="module-onboarding-kicker">Onboarding del modulo</p>
      <h3>{title}</h3>
      <p><strong>Que hace:</strong> {whatItDoes}</p>
      <p><strong>Para que sirve:</strong> {whyItMatters}</p>
      <p><strong>Que debes capturar:</strong></p>
      <ul className="marketing-list">
        {whatToCapture.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p><strong>Impacto:</strong> {impact}</p>
      <button
        className="button button-outline"
        type="button"
        onClick={() => {
          localStorage.setItem(storageKey, "1");
          setDismissed(true);
        }}
      >
        Entendido
      </button>
    </article>
  );
}
