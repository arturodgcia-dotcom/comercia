import { Link } from "react-router-dom";

export function DataProtectionPolicyPage() {
  return (
    <main className="marketing-shell legal-shell">
      <p className="marketing-eyebrow" style={{ margin: 0 }}>ComerCia by REINPIA</p>
      <section className="marketing-section legal-card">
        <h1>Aviso de proteccion de datos</h1>
        <p>
          ComerCia implementa medidas de seguridad operativa para proteger datos personales y comerciales de clientes, marcas y
          equipos de trabajo.
        </p>
        <h3>Principios de proteccion</h3>
        <p>
          Minimizamos captura innecesaria, controlamos accesos por rol, mantenemos trazabilidad y aplicamos buenas practicas para
          disminuir riesgos de exposicion.
        </p>
        <h3>Uso responsable</h3>
        <p>
          La informacion recopilada se usa para procesos de atencion, diagnostico, seguimiento comercial y ejecucion de servicios
          solicitados.
        </p>
        <h3>Contacta al equipo</h3>
        <p>
          Si requieres aclaraciones sobre el tratamiento de datos, puedes escribirnos mediante el formulario de atencion al cliente
          en la landing.
        </p>
        <p className="muted">Ultima actualizacion: marzo 2026.</p>
      </section>
      <Link className="button button-outline" to="/comercia">Volver a la landing</Link>
    </main>
  );
}
