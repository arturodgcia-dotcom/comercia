import {
  INDUSTRIAL_MASTER_DEFAULT_BRAND,
  INDUSTRIAL_MASTER_PRODUCTS,
  IndustrialMasterBrandConfig,
} from "../components/IndustrialMasterShared";

export function IndustrialMasterWebapp({ brand = INDUSTRIAL_MASTER_DEFAULT_BRAND }: { brand?: IndustrialMasterBrandConfig }) {
  return (
    <>
      <section className="im-card" style={{ marginTop: 14 }}>
        <div className="im-chip-row">
          <span className="im-chip">WebApp / POS maestro</span>
          <span className="im-chip">Operacion industrial real</span>
        </div>
        <h2>Sistema operativo de venta, inventario y recompra</h2>
        <p>
          Contempla precio publico, precio distribuidor, tier de cliente, fidelizacion, ticket, pago e inventario por canal.
        </p>
      </section>

      <section className="im-pos-layout">
        <article className="im-card">
          <h3>Catalogo + busqueda SKU</h3>
          <div className="im-pos-items">
            {INDUSTRIAL_MASTER_PRODUCTS.map((product) => (
              <article className="im-pos-item" key={product.id}>
                <strong>{product.name}</strong>
                <p>SKU: {product.id}</p>
                <p>Publico: MXN ${product.price.toLocaleString("es-MX")}</p>
                <p>Distribuidor: MXN ${product.wholesale.toLocaleString("es-MX")}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="im-card">
          <h3>Ticket y cobro</h3>
          <ul>
            <li>Cliente: Tier Gold</li>
            <li>Fidelizacion: 240 puntos aplicables</li>
            <li>Recompra sugerida: semanal</li>
            <li>Estado MP: listo para Point/QR/Link</li>
          </ul>
          <table className="im-table">
            <tbody>
              <tr><td>Subtotal</td><td>MXN 3,840</td></tr>
              <tr><td>Descuento tier</td><td>- MXN 210</td></tr>
              <tr><td>Fidelizacion</td><td>- MXN 95</td></tr>
              <tr><td><strong>Total</strong></td><td><strong>MXN 3,535</strong></td></tr>
            </tbody>
          </table>
          <div className="im-actions">
            <button className="button" type="button">Cobrar con MP</button>
            <button className="button button-outline" type="button">Generar ticket</button>
          </div>
          <h4 style={{ marginTop: 16 }}>Accesos rapidos</h4>
          <div className="im-chip-row">
            <span className="im-chip">Inventario</span>
            <span className="im-chip">Clientes</span>
            <span className="im-chip">Pedidos</span>
            <span className="im-chip">Almacen</span>
          </div>
          <p style={{ marginTop: 12 }}>Atencion operativa: {brand.contactEmail}</p>
        </aside>
      </section>
    </>
  );
}

