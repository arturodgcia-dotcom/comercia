import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { AppInstallHelp } from "../components/AppInstallHelp";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const nextFromQuery = new URLSearchParams(location.search).get("next");
  const redirectTo = nextFromQuery || (location.state as { from?: string } | undefined)?.from || "/";

  const [email, setEmail] = useState("admin@reinpia.com");
  const [password, setPassword] = useState("admin123");
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
        <InstallAppPrompt compact />
        <AppInstallHelp context="POS y operacion" />
        <Link className="button button-outline" to="/comercia">
          {t("auth.goLanding")}
        </Link>
      </form>
    </main>
  );
}
