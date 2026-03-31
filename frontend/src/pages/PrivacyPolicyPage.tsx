import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <main className="marketing-shell legal-shell">
      <p className="marketing-eyebrow" style={{ margin: 0 }}>ComerCia by REINPIA</p>
      <section className="marketing-section legal-card">
        <h1>Politica de privacidad</h1>
        <p>
          En ComerCia tratamos tus datos personales con enfoque de seguridad, transparencia y uso responsable para atencion
          comercial, operacion de la plataforma y mejora del servicio.
        </p>
        <h3>Que datos recopilamos</h3>
        <p>
          Podemos recopilar nombre, correo, telefono, empresa, preferencias de contacto y datos operativos cuando completas
          formularios, solicitas diagnostico o interactuas con nuestros modulos comerciales.
        </p>
        <h3>Para que usamos tus datos</h3>
        <p>
          Usamos los datos para responder solicitudes, dar seguimiento comercial, generar propuestas, operar servicios contratados
          y mantener trazabilidad de soporte y ventas.
        </p>
        <h3>Proteccion y resguardo</h3>
        <p>
          Aplicamos controles tecnicos y operativos razonables para proteger la informacion y limitar accesos no autorizados.
        </p>
        <h3>Tus derechos</h3>
        <p>
          Puedes solicitar actualizacion o aclaracion de tus datos mediante nuestros canales de atencion. Atenderemos tu solicitud
          en tiempos razonables.
        </p>
        <p className="muted">Ultima actualizacion: marzo 2026.</p>
      </section>
      <Link className="button button-outline" to="/comercia">Volver a la landing</Link>
    </main>
  );
}
