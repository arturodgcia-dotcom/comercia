import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { AppInstallHelp } from "../components/AppInstallHelp";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "react-i18next";

const DEMO_AUTOLOGIN = !import.meta.env.PROD && ["1", "true", "yes"].includes((import.meta.env.VITE_DEMO_AUTOLOGIN ?? "").toLowerCase());
const DEMO_SUPERADMIN_EMAIL = import.meta.env.VITE_DEMO_SUPERADMIN_EMAIL ?? "superadmin@comercia.demo";
const DEMO_SUPERADMIN_PASSWORD = import.meta.env.VITE_DEMO_SUPERADMIN_PASSWORD ?? "Demo1234!";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const nextFromQuery = new URLSearchParams(location.search).get("next");
  const redirectTo = nextFromQuery || (location.state as { from?: string } | undefined)?.from || "/";

  const [email, setEmail] = useState(DEMO_AUTOLOGIN ? DEMO_SUPERADMIN_EMAIL : "admin@reinpia.com");
  const [password, setPassword] = useState(DEMO_AUTOLOGIN ? DEMO_SUPERADMIN_PASSWORD : "admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="row-gap" style={{ justifyContent: "space-between" }}>
          <h1>{t("auth.loginTitle")}</h1>
          <LanguageSelector />
        </div>
        <p>{t("auth.loginSubtitle")}</p>
        {error ? <p className="error">{error}</p> : null}
        <label>
          {t("auth.email")}
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t("auth.password")}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? t("auth.loading") : t("auth.login")}
        </button>
        {DEMO_AUTOLOGIN ? (
          <button
            className="button button-outline"
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                setError("");
                setEmail(DEMO_SUPERADMIN_EMAIL);
                setPassword(DEMO_SUPERADMIN_PASSWORD);
                await login(DEMO_SUPERADMIN_EMAIL, DEMO_SUPERADMIN_PASSWORD);
                navigate(redirectTo, { replace: true });
              } catch (err) {
                setError(err instanceof Error ? err.message : "No fue posible iniciar sesion con superadmin demo.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {t("auth.demoSuperadmin")}
          </button>
        ) : null}
        <InstallAppPrompt compact />
        <AppInstallHelp context="POS y operacion" />
        <Link className="button button-outline" to="/comercia">
          {t("auth.goLanding")}
        </Link>
      </form>
    </main>
  );
}
