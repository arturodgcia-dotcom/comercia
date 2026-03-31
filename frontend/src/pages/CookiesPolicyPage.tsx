import { Link } from "react-router-dom";

export function CookiesPolicyPage() {
  return (
    <main className="marketing-shell legal-shell">
      <p className="marketing-eyebrow" style={{ margin: 0 }}>ComerCia by REINPIA</p>
      <section className="marketing-section legal-card">
        <h1>Politica de cookies</h1>
        <p>
          Utilizamos cookies y tecnologias similares para mejorar tu experiencia, recordar preferencias y analizar el uso general
          de la plataforma.
        </p>
        <h3>Tipos de cookies</h3>
        <p>
          Usamos cookies necesarias para funcionamiento basico y, cuando se autoriza, cookies de analitica o marketing para
          mejorar conversion y experiencia comercial.
        </p>
        <h3>Como gestionar preferencias</h3>
        <p>
          Puedes aceptar, rechazar o revisar tus preferencias desde el banner de cookies en la landing de ComerCia.
        </p>
        <h3>Duracion y control</h3>
        <p>
          Algunas cookies son temporales y otras persistentes. Tambien puedes borrar cookies desde la configuracion de tu
          navegador.
        </p>
        <p className="muted">Ultima actualizacion: marzo 2026.</p>
      </section>
      <Link className="button button-outline" to="/comercia">Volver a la landing</Link>
    </main>
  );
}
