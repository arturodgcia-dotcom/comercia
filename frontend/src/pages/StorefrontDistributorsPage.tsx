import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildBrandTheme, tokensToCssVars } from "../branding/multibrandTemplates";
import { api } from "../services/api";
import { Product, StorefrontDistributorsPayload, TenantConfig } from "../types/domain";
import { calculatePlanTotals } from "../utils/monetization";

export function StorefrontDistributorsPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontDistributorsPayload | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
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
        setReferenceProducts((homePayload?.featured_products ?? []).slice(0, 6));
        setTenantConfig(config);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar distribuidores"));
  }, [tenantSlug]);

  const stats = useMemo(() => {
    const total = data?.distributors.length ?? 0;
    return {
      total,
      activos: total,
      beneficios: ["Precios menudeo/mayoreo", "Pedidos recurrentes", "Atencion comercial dedicada"],
    };
  }, [data]);

  const styleVars = useMemo(() => {
    if (!data) return undefined;
    const theme = buildBrandTheme(
      {
        key: data.tenant.slug,
        name: data.tenant.name,
        slug: data.tenant.slug,
        logoText: data.tenant.name,
        primaryColor: "#0f3f91",
        secondaryColor: "#3a78cf",
        supportColor: "#70a7f0",
        bgSoft: "#eef4ff",
        promptMaster: "",
        businessType: "mixed",
        tone: "corporativo",
        baseImages: [],
        hasExistingLanding: true,
        monetizationPlan: tenantConfig?.plan_type === "commission" ? "commission" : "subscription",
        copy: {
          headline: `Canal distribuidores de ${data.tenant.name}`,
          subtitle: "Portal comercial B2B con branding coherente y reglas de volumen.",
          ctaPrimary: "Solicitar acceso comercial",
          ctaSecondary: "Ver beneficios B2B",
          valueProp: "Misma identidad de marca con experiencia especializada para distribuidores."
        }
      },
      "distributor_store"
    );
    return tokensToCssVars(theme);
  }, [data, tenantConfig]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando distribuidores...</p>;

  const rows = referenceProducts.map((product) => {
    const totals = calculatePlanTotals(
      { subtotal: Number(product.price_wholesale ?? product.price_public) },
      tenantConfig?.plan_type ?? "subscription",
      tenantConfig?.commission_rules
    );
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price_wholesale ?? product.price_public),
      commission: totals.commission,
      net: totals.net,
    };
  });

  return (
    <main className="storefront distributors-store" style={styleVars}>
      <section className="store-hero premium-hero distributors-hero">
        <p className="marketing-eyebrow">Canal comercial para negocios</p>
        <h1>Canal distribuidores de {data.tenant.name}</h1>
        <p>
          Esta seccion esta disenada para comercios y distribuidores que requieren precios de volumen, recompra y
          beneficios comerciales diferenciados.
        </p>
        <div className="store-actions">
          <Link className="button" to={`/store/${data.tenant.slug}`}>
            Volver a tienda publica
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
            Solicitar registro comercial
          </Link>
          <Link className="button button-outline" to={`/store/${data.tenant.slug}/distribuidores/login-placeholder`}>
            Acceso distribuidores
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Reglas de volumen</h3>
          <p>Se aplican precios escalonados por menudeo/mayoreo y minimos por operacion comercial.</p>
        </article>
        <article className="card">
          <h3>Compra recurrente</h3>
          <p>El canal soporta pedidos programados para mantener continuidad de inventario.</p>
        </article>
        <article className="card">
          <h3>Beneficios comerciales</h3>
          <ul className="marketing-list">
            {stats.beneficios.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="store-layout">
        <article className="store-banner">
          <h2>Directorio comercial activo</h2>
          <div className="card-grid">
            {data.distributors.length === 0 ? <p>No hay distribuidores activos por el momento.</p> : null}
            {data.distributors.map((distributor) => (
              <article key={distributor.id} className="card">
                <h3>{distributor.full_name}</h3>
                <p>Email: {distributor.email ?? "No definido"}</p>
                <p>Telefono: {distributor.phone ?? "No definido"}</p>
                <p className="muted">Estado: {distributor.is_active ? "Activo" : "Inactivo"}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="store-banner">
          <h2>Resumen del canal</h2>
          <p className="chip">{tenantConfig?.plan_type === "commission" ? "Modelo comision" : "Sin comision"}</p>
          <p>Distribuidores activos: {stats.activos}</p>
          <p>Perfil de compra: menudeo y mayoreo.</p>
          <p>Recurrencia: disponible para reposicion periodica.</p>
          {tenantConfig?.plan_type === "subscription" ? (
            <p className="muted">Precios limpios para distribuidores. El costo de plataforma ya esta cubierto por suscripcion.</p>
          ) : (
            <p className="muted">Cada pedido refleja comision de plataforma con total transparencia de margenes.</p>
          )}
          {rows.length > 0 ? (
            <table className="table" style={{ marginTop: "0.8rem" }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Comision</th>
                  <th>Neto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>${row.price.toLocaleString("es-MX")}</td>
                    <td>{tenantConfig?.plan_type === "commission" ? `$${row.commission.toLocaleString("es-MX")}` : "Sin comision"}</td>
                    <td>${row.net.toLocaleString("es-MX")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <Link className="button" to={`/store/${data.tenant.slug}/distribuidores/registro`}>
            Iniciar proceso de autorizacion
          </Link>
        </aside>
      </section>
    </main>
  );
}
