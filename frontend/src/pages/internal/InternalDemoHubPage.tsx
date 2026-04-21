import { Link } from "react-router-dom";
import "../templates/TemplateFamily.css";

const DEMO_ROUTES = [
  {
    title: "Familia visual",
    description: "Comparativo de marcas de muestra y variantes por canal.",
    to: "/internal/demo/familia",
  },
  {
    title: "Master industrial",
    description: "Plantilla maestra premium de maquinaria por canal (landing, publico, B2B, webapp).",
    to: "/internal/master/maquinaria",
  },
  {
    title: "Demo ecommerce público",
    description: "Vista de tienda pública demo sin conexión productiva.",
    to: "/internal/demo/tienda-publica",
  },
  {
    title: "Demo distribuidores",
    description: "Vista B2B demo para distribuidores y mayoristas.",
    to: "/internal/demo/distribuidores",
  },
  {
    title: "Demo WebApp / POS",
    description: "Vista de POS demo para apoyo comercial.",
    to: "/internal/demo/pos",
  },
];

export function InternalDemoHubPage() {
  return (
    <main className="tf-root">
      <section className="tf-shell">
        <header className="tf-header">
          <div>
            <p className="tf-badge">Demo interna</p>
            <h1 className="tf-logo">Vistas de muestra COMERCIA</h1>
            <p className="tf-muted">Estas pantallas son solo para apoyo visual interno. No son flujo productivo.</p>
          </div>
          <div className="tf-demo-banner">
            <strong>Demo</strong>
            <span>Vista de muestra</span>
            <span>No productivo</span>
          </div>
        </header>

        <section className="tf-grid tf-grid-2">
          {DEMO_ROUTES.map((route) => (
            <article className="tf-card" key={route.to}>
              <h3>{route.title}</h3>
              <p>{route.description}</p>
              <div className="tf-hero-actions">
                <Link className="button button-outline" to={route.to}>
                  Abrir demo
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="tf-card">
          <h3>Flujo real principal</h3>
          <ul className="tf-list">
            <li>Landing pública: /comercia</li>
            <li>Panel global: /reinpia/*</li>
            <li>Panel de marca: /admin/*</li>
            <li>Ecommerce real: /store/:tenantSlug</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
