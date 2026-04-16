import { Link } from "react-router-dom";
import { MULTIBRAND_DEMO_INPUTS } from "../../branding/multibrandTemplates";
import "./TemplateFamily.css";

const DEMO_KEYS = ["reinpia", "tulipanes"] as const;

export function TemplateFamilyDemoPage() {
  return (
    <main className="tf-root">
      <section className="tf-shell">
        <header className="tf-header">
          <div>
            <p className="tf-badge">Sistema de plantillas multimarcas COMERCIA</p>
            <h1 className="tf-logo">Familia visual unificada con variantes por marca</h1>
            <p className="tf-muted">
              Base común premium + overrides de branding + variantes por canal (landing, ecommerce público, distribuidores
              y POS).
            </p>
          </div>
          <div className="tf-demo-banner">
            <strong>Demo</strong>
            <span>Vista de muestra</span>
            <span>No productivo</span>
          </div>
        </header>

        <section className="tf-grid tf-grid-2">
          {DEMO_KEYS.map((key) => {
            const brand = MULTIBRAND_DEMO_INPUTS[key];
            return (
              <article className="tf-card" key={key}>
                <p className="tf-eyebrow">{brand.name}</p>
                <h3>
                  Tono {brand.tone} · Negocio {brand.businessType}
                </h3>
                <p className="tf-muted">{brand.promptMaster}</p>
                <ul className="tf-list">
                  <li>Color primario: {brand.primaryColor}</li>
                  <li>Color secundario: {brand.secondaryColor}</li>
                  <li>Modelo monetización: {brand.monetizationPlan === "commission" ? "Comisión por venta" : "Suscripción sin comisión"}</li>
                  <li>Landing existente: {brand.hasExistingLanding ? "Sí" : "No"}</li>
                </ul>
                <div className="tf-footer-links">
                  <Link to={`/comercia?brand=${brand.key}&plan=${brand.monetizationPlan}`}>Landing</Link>
                  <Link to={`/internal/demo/tienda-publica?brand=${brand.key}`}>Ecommerce público</Link>
                  <Link to={`/internal/demo/distribuidores?brand=${brand.key}`}>Ecommerce distribuidores</Link>
                  <Link to={`/internal/demo/pos?brand=${brand.key}`}>WebApp POS</Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="tf-card">
          <h3>Arquitectura lista para wizard</h3>
          <ul className="tf-list">
            <li>Base Theme: layout, tipografía, spacing, componentes y patrones de conversión.</li>
            <li>Brand Theme Overrides: logo, paleta, tono, copys, banners e imágenes.</li>
            <li>Channel Variants: landing, tienda pública, distribuidores y POS.</li>
            <li>Regla de landing existente: si existe URL, se prioriza integración de canales restantes.</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
