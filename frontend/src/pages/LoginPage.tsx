import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../app/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | undefined)?.from ?? "/";

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
        <h1>COMERCIA Admin</h1>
        <p>Acceso al panel multitenant by REINPIA</p>
        {error ? <p className="error">{error}</p> : null}
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesion"}
        </button>
      </form>
    </main>
  );
}
