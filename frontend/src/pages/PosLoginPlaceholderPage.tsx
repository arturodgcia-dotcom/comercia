import { Link } from "react-router-dom";

export function PosLoginPlaceholderPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>POS Login</h1>
        <p>Base preparada para autenticacion dedicada POS en futuras iteraciones.</p>
        <Link className="button" to="/pos">Entrar al POS actual</Link>
      </section>
    </main>
  );
}
