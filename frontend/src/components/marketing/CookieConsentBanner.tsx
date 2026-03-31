import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CookiePreferences, CookiePreferencesModal } from "./CookiePreferencesModal";

const CONSENT_KEY = "comercia_cookie_consent_status";
const PREFERENCES_KEY = "comercia_cookie_preferences";

type ConsentStatus = "accepted" | "rejected";

const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: true,
  marketing: false,
};

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const status = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null;
    const storedPreferences = localStorage.getItem(PREFERENCES_KEY);
    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as CookiePreferences;
        setPreferences({
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
        });
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
    setVisible(status !== "accepted" && status !== "rejected");
  }, []);

  const persistDecision = (status: ConsentStatus, nextPreferences: CookiePreferences) => {
    localStorage.setItem(CONSENT_KEY, status);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(nextPreferences));
    setVisible(false);
    setPreferencesOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <aside className="cookie-banner" role="dialog" aria-live="polite" aria-label="Consentimiento de cookies">
        <div>
          <h4>Uso de cookies en ComerCia</h4>
          <p>
            Usamos cookies para mejorar experiencia, analitica y conversion comercial. Puedes aceptar, rechazar o ajustar
            preferencias.
          </p>
          <p className="cookie-links">
            <Link to="/legal/cookies">Politica de cookies</Link>
            <Link to="/legal/privacidad">Politica de privacidad</Link>
            <Link to="/legal/proteccion-datos">Proteccion de datos</Link>
          </p>
        </div>
        <div className="row-gap">
          <button type="button" className="button button-outline" onClick={() => persistDecision("rejected", { analytics: false, marketing: false })}>
            Rechazar
          </button>
          <button type="button" className="button button-outline" onClick={() => setPreferencesOpen(true)}>
            Ver preferencias
          </button>
          <button type="button" className="button" onClick={() => persistDecision("accepted", preferences)}>
            Aceptar
          </button>
        </div>
      </aside>
      <CookiePreferencesModal
        open={preferencesOpen}
        value={preferences}
        setValue={setPreferences}
        onClose={() => setPreferencesOpen(false)}
        onSave={() => persistDecision("accepted", preferences)}
      />
    </>
  );
}
