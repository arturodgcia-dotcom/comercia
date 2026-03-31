import { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";

export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

type Props = {
  open: boolean;
  value: CookiePreferences;
  setValue: Dispatch<SetStateAction<CookiePreferences>>;
  onClose: () => void;
  onSave: () => void;
};

export function CookiePreferencesModal({ open, value, setValue, onClose, onSave }: Props) {
  if (!open) return null;
  return (
    <div className="cookie-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="cookie-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h3>Preferencias de cookies</h3>
        <p>Puedes habilitar o deshabilitar cookies opcionales para analitica y marketing.</p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.analytics}
            onChange={(event) => setValue((prev) => ({ ...prev, analytics: event.target.checked }))}
          />
          Cookies de analitica
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.marketing}
            onChange={(event) => setValue((prev) => ({ ...prev, marketing: event.target.checked }))}
          />
          Cookies de marketing
        </label>
        <p className="muted">
          Consulta tambien la <Link to="/legal/cookies">Politica de cookies</Link>, la{" "}
          <Link to="/legal/privacidad">Politica de privacidad</Link> y el{" "}
          <Link to="/legal/proteccion-datos">Aviso de proteccion de datos</Link>.
        </p>
        <div className="row-gap">
          <button type="button" className="button button-outline" onClick={onClose}>Cerrar</button>
          <button type="button" className="button" onClick={onSave}>Guardar preferencias</button>
        </div>
      </section>
    </div>
  );
}
