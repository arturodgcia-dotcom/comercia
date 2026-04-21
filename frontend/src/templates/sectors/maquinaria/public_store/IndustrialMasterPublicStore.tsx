import {
  INDUSTRIAL_MASTER_CATEGORIES,
  INDUSTRIAL_MASTER_DEFAULT_BRAND,
  INDUSTRIAL_MASTER_PRODUCTS,
  IndustrialMasterBrandConfig,
} from "../components/IndustrialMasterShared";

export function IndustrialMasterPublicStore({ brand = INDUSTRIAL_MASTER_DEFAULT_BRAND }: { brand?: IndustrialMasterBrandConfig }) {
  return (
    <>
      <section className="im-hero" style={{ background: `linear-gradient(130deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}>
        <div>
          <div className="im-chip-row">
            <span className="im-chip">Ecommerce publico maestro</span>
            <span className="im-chip">Marketplace tecnico industrial</span>
          </div>
          <h1>Catalogo industrial robusto</h1>
          <p>Buscador protagonista, categorias visibles, rieles comerciales y checkout integrado.</p>
          <div className="im-actions">
            <button className="button" type="button">Pagar con Mercado Pago</button>
            <a className="button button-outline" href={brand.whatsapp} target="_blank" rel="noreferrer">Solicitar cotizacion</a>
          </div>
        </div>
        <img src="/client-assets/todoindustrialmx/hero_bandas_black_gold.png" alt="Catalogo industrial" />
      </section>

      <section className="im-card" style={{ marginTop: 14 }}>
        <h3>Riel de categorias</h3>
        <div className="im-chip-row">
          {INDUSTRIAL_MASTER_CATEGORIES.map((category) => (
            <span key={category} className="im-chip">{category}</span>
          ))}
        </div>
      </section>

      <section className="im-public-layout">
        <article className="im-card">
          <h3>Grid de producto premium</h3>
          <div className="im-product-grid">
            {INDUSTRIAL_MASTER_PRODUCTS.map((product) => (
              <article className="im-product" key={product.id}>
                <img src="/client-assets/todoindustrialmx/catalogo_taller_baleros.png" alt={product.name} />
                <div className="im-product-body">
                  <span className="im-chip">SKU {product.id}</span>
                  <h4>{product.name}</h4>
                  <p>{product.category}</p>
                  <strong>MXN ${product.price.toLocaleString("es-MX")}</strong>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="im-card">
          <h3>Checkout y conversion</h3>
          <p className="im-chip">Proveedor principal: Mercado Pago</p>
          <p className="im-chip">Canales: web checkout + link + QR</p>
          <ul>
            <li>Resumen de carrito</li>
            <li>Cupon y promocion</li>
            <li>Boton de pago primario</li>
            <li>CTA de cotizacion por WhatsApp</li>
          </ul>
          <button className="button" type="button">Pagar con Mercado Pago</button>
        </aside>
      </section>
    </>
  );
}

