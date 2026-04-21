import {
  INDUSTRIAL_MASTER_BRANDS,
  INDUSTRIAL_MASTER_CATEGORIES,
  INDUSTRIAL_MASTER_DEFAULT_BRAND,
  IndustrialMasterBrandConfig,
} from "../components/IndustrialMasterShared";

export function IndustrialMasterLanding({ brand = INDUSTRIAL_MASTER_DEFAULT_BRAND }: { brand?: IndustrialMasterBrandConfig }) {
  return (
    <>
      <section className="im-hero" style={{ background: `linear-gradient(132deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}>
        <div>
          <div className="im-chip-row">
            <span className="im-chip">Landing maestra industrial</span>
            <span className="im-chip">SEO/AEO base</span>
          </div>
          <h1>{brand.tagline}</h1>
          <p>{brand.valueProp}. Mas de 30 anos de experiencia en refacciones y transmision de potencia.</p>
          <div className="im-actions">
            <a className="button" href={brand.whatsapp} target="_blank" rel="noreferrer">Cotizar ahora</a>
            <button className="button button-outline" type="button">Ver catalogo tecnico</button>
          </div>
        </div>
        <img src="/client-assets/todoindustrialmx/hero_baleros_caliper.jpg" alt="Hero industrial" />
      </section>

      <section className="im-grid-4">
        <article className="im-card"><h3>Cobertura</h3><p>Operacion en Mexico y atencion comercial para Latinoamerica.</p></article>
        <article className="im-card"><h3>Postventa</h3><p>Seguimiento tecnico y soporte de recompra por aplicacion.</p></article>
        <article className="im-card"><h3>Logistica</h3><p>Surtido por prioridad, rutas de entrega y control de tiempos.</p></article>
        <article className="im-card"><h3>Automotriz</h3><p>Linea dedicada para reemplazo, retenes y mantenimiento.</p></article>
      </section>

      <section className="im-card" style={{ marginTop: 14 }}>
        <h3>Marcas distribuidas</h3>
        <div className="im-logo-strip">
          {INDUSTRIAL_MASTER_BRANDS.map((brandName) => (
            <div className="im-logo" key={brandName}>{brandName}</div>
          ))}
        </div>
      </section>

      <section className="im-card" style={{ marginTop: 14 }}>
        <h3>Categorias tecnicas</h3>
        <div className="im-chip-row">
          {INDUSTRIAL_MASTER_CATEGORIES.map((category) => (
            <span className="im-chip" key={category}>{category}</span>
          ))}
        </div>
      </section>
    </>
  );
}

