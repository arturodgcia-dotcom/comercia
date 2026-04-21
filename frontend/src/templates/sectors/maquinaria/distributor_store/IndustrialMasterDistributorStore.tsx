import {
  INDUSTRIAL_MASTER_BRANDS,
  INDUSTRIAL_MASTER_DEFAULT_BRAND,
  INDUSTRIAL_MASTER_PRODUCTS,
  IndustrialMasterBrandConfig,
} from "../components/IndustrialMasterShared";

export function IndustrialMasterDistributorStore({ brand = INDUSTRIAL_MASTER_DEFAULT_BRAND }: { brand?: IndustrialMasterBrandConfig }) {
  return (
    <>
      <section className="im-b2b-hero">
        <div className="im-chip-row">
          <span className="im-chip">Ecommerce distribuidores maestro</span>
          <span className="im-chip">Portal B2B serio</span>
        </div>
        <h1>Canal mayoreo y recompra para distribuidores</h1>
        <p>Flujo B2B con niveles, volumen, credito comercial y pagos de anticipo por Mercado Pago.</p>
      </section>

      <section className="im-b2b-layout">
        <article className="im-card">
          <h3>Beneficios por nivel</h3>
          <div className="im-b2b-tiers">
            <article className="im-tier"><h4>Bronze</h4><p>Acceso mayoreo base, soporte comercial estandar.</p></article>
            <article className="im-tier"><h4>Silver</h4><p>Escalon de precios y prioridad de surtido.</p></article>
            <article className="im-tier"><h4>Gold</h4><p>Condiciones especiales por volumen y recompra.</p></article>
          </div>

          <h3 style={{ marginTop: 14 }}>Ventajas comerciales</h3>
          <table className="im-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Publico</th>
                <th>Mayoreo</th>
                <th>Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {INDUSTRIAL_MASTER_PRODUCTS.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>MXN ${product.price.toLocaleString("es-MX")}</td>
                  <td>MXN ${product.wholesale.toLocaleString("es-MX")}</td>
                  <td>MXN ${(product.price - product.wholesale).toLocaleString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside className="im-card">
          <h3>Alta y credito</h3>
          <p>Solicitud de alta de distribuidor, linea de credito y validacion comercial.</p>
          <ul>
            <li>Solicitud de cotizacion por volumen</li>
            <li>Anticipo por Mercado Pago</li>
            <li>Link de pago para pedidos especiales</li>
            <li>Transferencia bancaria supervisada</li>
          </ul>
          <div className="im-actions">
            <button className="button" type="button">Solicitar alta</button>
            <button className="button button-outline" type="button">Generar anticipo MP</button>
          </div>
          <h4 style={{ marginTop: 16 }}>Marcas industriales</h4>
          <div className="im-chip-row">
            {INDUSTRIAL_MASTER_BRANDS.map((name) => (
              <span className="im-chip" key={name}>{name}</span>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>Contacto comercial: {brand.contactEmail}</p>
        </aside>
      </section>
    </>
  );
}

