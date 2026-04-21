import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product, StorefrontDistributorsPayload, TenantConfig } from "../types/domain";

function parseStorefrontConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function StorefrontDistributorsPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontDistributorsPayload | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [storefrontConfigJson, setStorefrontConfigJson] = useState<string | null>(null);
  const [referenceProducts, setReferenceProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenantSlug) return;
    Promise.all([
      api.getStorefrontDistributors(tenantSlug),
      api.getStorefrontHomeData(tenantSlug).catch(() => null),
      api.getTenantConfig({ tenantSlug }).catch(() => null),
    ])
      .then(([distributorsPayload, homePayload, config]) => {
        setData(distributorsPayload);
        setReferenceProducts([...(homePayload?.featured_products ?? []), ...(homePayload?.recent_products ?? [])].slice(0, 10));
        setStorefrontConfigJson(homePayload?.storefront_config?.config_json ?? null);
        setTenantConfig(config);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [tenantSlug]);

  if (error) {
    return (
      <main className="route-distributor-b2b">
        <section className="b2b-shell">
          <h2>Portal B2B no disponible</h2>
          <p>{error}</p>
        </section>
      </main>
    );
  }
  if (!data) return <p>Cargando portal distribuidores...</p>;

  const parsedConfig = parseStorefrontConfig(storefrontConfigJson);
  const b2bManualPayment = Boolean(parsedConfig.b2b_manual_payment);
  const paymentProvider = String(parsedConfig.payment_provider ?? "stripe").toLowerCase();
  const paymentLabel = paymentProvider === "mercadopago" ? "Mercado Pago" : "Stripe";
  const distributorCount = data.distributors.length;
  const pricingRows = referenceProducts.map((product) => {
    const publicPrice = Number(product.price_public);
    const wholesale = Number(product.price_wholesale ?? Math.max(0, publicPrice * 0.88));
    const saving = Math.max(0, publicPrice - wholesale);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      publicPrice,
      wholesale,
      saving,
    };
  });

  return (
    <main className="route-distributor-b2b">
      <section className="b2b-hero">
        <div>
          <p className="b2b-kicker">Portal mayoreo y recompra</p>
          <h1>Canal distribuidores de {data.tenant.name}</h1>
          <p>Arquitectura B2B para volumen, credito comercial, anticipo y pedidos recurrentes por linea industrial.</p>
          <div className="b2b-actions">
            <Link className="button" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
              Alta de distribuidor
            </Link>
            <Link className="button button-outline" to={`/store/${data.tenant.slug}`}>
              Ir a catalogo publico
            </Link>
          </div>
        </div>
        <div className="b2b-side-card">
          <h3>Estado comercial</h3>
          <p className="chip">Distribuidores activos: {distributorCount}</p>
          <p>{tenantConfig?.plan_type === "commission" ? "Modelo con comision" : "Modelo de suscripcion"}</p>
          <p>Proveedor de cobro: {paymentLabel}</p>
          <p>Pago manual B2B: {b2bManualPayment ? "Habilitado" : "Pendiente"}</p>
        </div>
      </section>

      <section className="b2b-shell">
        <div className="b2b-logo-strip">
          <img src="/client-assets/todoindustrialmx/logo_zsg.jpg" alt="ZSG" />
          <img src="/client-assets/todoindustrialmx/logo_skf.jpg" alt="SKF" />
          <img src="/client-assets/todoindustrialmx/logo_timken.png" alt="Timken" />
          <img src="/client-assets/todoindustrialmx/logo_fag.png" alt="FAG" />
        </div>

        <div className="b2b-capability-grid">
          <article className="b2b-card">
            <h3>Nivel Bronze</h3>
            <p>Acceso mayoreo base, reposicion rapida y soporte comercial estandar.</p>
          </article>
          <article className="b2b-card">
            <h3>Nivel Silver</h3>
            <p>Precios escalonados, prioridad de surtido y recomendacion de compra recurrente.</p>
          </article>
          <article className="b2b-card">
            <h3>Nivel Gold</h3>
            <p>Condiciones especiales por volumen, ejecutivo dedicado y soporte postventa extendido.</p>
          </article>
          <article className="b2b-card">
            <h3>Cobro B2B flexible</h3>
            <ul>
              <li>Solicitud de cotizacion tecnica</li>
              <li>Transferencia bancaria</li>
              <li>Link de pago Mercado Pago</li>
              <li>Anticipo por Mercado Pago</li>
            </ul>
          </article>
        </div>

        <div className="b2b-layout">
          <section className="b2b-table-wrap">
            <h2>Ventajas comerciales por producto</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Publico</th>
                  <th>Mayoreo</th>
                  <th>Ahorro</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Sin productos de referencia aun.</td>
                  </tr>
                ) : null}
                {pricingRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.sku}</td>
                    <td>{row.name}</td>
                    <td>MXN ${row.publicPrice.toLocaleString("es-MX")}</td>
                    <td>MXN ${row.wholesale.toLocaleString("es-MX")}</td>
                    <td>MXN ${row.saving.toLocaleString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="b2b-request-panel">
            <h2>Solicitud de alta y credito</h2>
            <label>
              Razon social
              <input placeholder="Empresa distribuidora" />
            </label>
            <label>
              Volumen estimado mensual
              <input placeholder="Ej. 120,000 MXN" />
            </label>
            <label>
              Tipo de solicitud
              <select>
                <option>Cotizacion por volumen</option>
                <option>Alta con credito</option>
                <option>Pedido recurrente</option>
              </select>
            </label>
            <div className="b2b-panel-actions">
              <button className="button" type="button">
                Solicitar evaluacion comercial
              </button>
              <button className="button button-outline" type="button">
                Generar anticipo MP
              </button>
              <button className="button button-outline" type="button">
                Generar link de pago MP
              </button>
            </div>
            <p className="muted">La solicitud formal se completa desde el registro con validacion administrativa.</p>
            <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
              Ir al formulario completo
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
