import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandTemplateInput, buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
import "./TemplateFamily.css";

type ProductCard = {
  id: number;
  name: string;
  category: string;
  price: number;
  score: string;
  isService?: boolean;
};

const PRODUCT_DEMO: ProductCard[] = [
  { id: 1, name: "Kit premium de lanzamiento", category: "Destacados", price: 1899, score: "4.8" },
  { id: 2, name: "Paquete recurrente mensual", category: "Suscripciones", price: 1290, score: "4.7" },
  { id: 3, name: "Plan de consultoria comercial", category: "Servicios", price: 2490, score: "4.9", isService: true },
  { id: 4, name: "Bundle de temporada", category: "Promociones", price: 990, score: "4.6" },
  { id: 5, name: "Sesion de acompanamiento experto", category: "Servicios", price: 1490, score: "4.9", isService: true },
  { id: 6, name: "Producto estrella de conversion", category: "Catalogo", price: 1690, score: "4.7" },
];

const PRODUCT_RUNTIME_INDUSTRIAL: ProductCard[] = [
  { id: 101, name: "Balero industrial serie 6200", category: "Rodamientos", price: 389, score: "4.9" },
  { id: 102, name: "Chumacera alta carga", category: "Soportes", price: 1240, score: "4.8" },
  { id: 103, name: "Cadena de transmision reforzada", category: "Transmision", price: 920, score: "4.8" },
  { id: 104, name: "Catarina precision acero", category: "Transmision", price: 1680, score: "4.7" },
  { id: 105, name: "Banda Poly-V industrial", category: "Bandas", price: 760, score: "4.8" },
  { id: 106, name: "Acople elastico alto torque", category: "Acoples", price: 1490, score: "4.9" },
];

type StorePublicTemplateProps = {
  brandInputOverride?: BrandTemplateInput;
  tenantSlugOverride?: string;
  hideDemoBadge?: boolean;
  industrialMode?: boolean;
};

export function StorePublicTemplate({
  brandInputOverride,
  tenantSlugOverride,
  hideDemoBadge = false,
  industrialMode = false,
}: StorePublicTemplateProps = {}) {
  const [searchParams] = useSearchParams();
  const [cartCount, setCartCount] = useState(0);
  const brandInput = brandInputOverride ?? getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "public_store"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);

  const landingHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/landing` : `/comercia?brand=${theme.key}`;
  const distributorsHref = tenantSlugOverride
    ? `/store/${tenantSlugOverride}/distribuidores`
    : `/internal/demo/distribuidores?brand=${theme.key}`;
  const webappHref = tenantSlugOverride ? `/store/${tenantSlugOverride}/webapp-preview` : `/internal/demo/pos?brand=${theme.key}`;

  const visibleProducts = useMemo(() => {
    if (industrialMode) return PRODUCT_RUNTIME_INDUSTRIAL;
    if (theme.businessType === "services") return PRODUCT_DEMO.filter((item) => item.isService);
    if (theme.businessType === "products") return PRODUCT_DEMO.filter((item) => !item.isService);
    return PRODUCT_DEMO;
  }, [industrialMode, theme.businessType]);

  const heroMessage =
    industrialMode
      ? "Catalogo industrial robusto con busqueda por SKU, marcas tecnicas y cotizacion inmediata."
      : theme.businessType === "services"
        ? "Agenda servicios, cobra en linea y automatiza seguimiento de clientes."
        : theme.businessType === "products"
          ? "Escala tu catalogo con promociones, carrito optimizado y checkout premium."
          : "Combina productos y servicios en una experiencia de compra coherente y escalable.";

  return (
    <main className="tf-root" style={styleVars}>
      <section className="tf-shell">
        <header className="tf-header">
          <div>
            <p className="tf-badge">{theme.channelBadge}</p>
            <h1 className="tf-logo">
              {theme.logoText}
              <span>{theme.logoAccent ? ` ${theme.logoAccent}` : ""}</span>
            </h1>
            <p className="tf-muted">
              Marca: <strong>{theme.name}</strong> · Tipo de negocio: <strong>{theme.businessType}</strong>
            </p>
          </div>
          {!hideDemoBadge ? (
            <div className="tf-demo-banner">
              <strong>Demo</strong>
              <span>Vista de muestra</span>
              <span>No productivo</span>
            </div>
          ) : null}
          <div className="tf-nav-actions">
            <Link className="button button-outline" to={distributorsHref}>
              Ver canal distribuidores
            </Link>
            <Link className="button button-outline" to={webappHref}>
              Ver POS
            </Link>
            <button type="button" className="button" onClick={() => setCartCount((value) => value + 1)}>
              Carrito ({cartCount})
            </button>
          </div>
        </header>

        <section className="tf-hero">
          <article>
            <p className="tf-eyebrow">Ecommerce publico de marca</p>
            <h2>{theme.headline}</h2>
            <p>{heroMessage}</p>
            <div className="tf-hero-actions">
              <button type="button" className="button">
                {theme.ctaPrimary}
              </button>
              <button type="button" className="button button-outline">
                {theme.ctaSecondary}
              </button>
            </div>
          </article>
          <aside className="tf-hero-card">
            <p className="tf-eyebrow">Prompt maestro</p>
            <p>{brandInput.promptMaster}</p>
            <p className="tf-muted">{theme.leadQuestion}</p>
          </aside>
        </section>

        <section className="tf-grid tf-grid-3">
          <article className="tf-card">
            <h3>Home adaptable</h3>
            <p>Hero, banners y categorias destacan automaticamente lo mas importante para la marca.</p>
          </article>
          <article className="tf-card">
            <h3>Detalle orientado a conversion</h3>
            <p>Tarjetas, badges y llamados a la accion heredan branding y tono visual.</p>
          </article>
          <article className="tf-card">
            <h3>Checkout consistente</h3>
            <p>Flujo visual coherente con landing, distribuidores y POS para reforzar confianza.</p>
          </article>
        </section>

        <section className="tf-products">
          <div className="tf-row-between">
            <h3>Catalogo principal ({visibleProducts.length})</h3>
            <span className="tf-muted">Slug: {theme.slug}</span>
          </div>
          <div className="tf-grid tf-grid-3">
            {visibleProducts.map((item) => (
              <article className="tf-card" key={item.id}>
                <p className="tf-eyebrow">{item.category}</p>
                <h4>{item.name}</h4>
                <p className="tf-muted">Valoracion {item.score} · Tarjeta heredada por marca</p>
                <p className="tf-price">${item.price.toLocaleString("es-MX")}</p>
                <button type="button" className="button button-outline" onClick={() => setCartCount((value) => value + 1)}>
                  Agregar
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer className="tf-footer">
          <p>{theme.valueProp}</p>
          <div className="tf-footer-links">
            <Link to={landingHref}>Landing conectada</Link>
            <Link to={distributorsHref}>Canal B2B</Link>
            <Link to={webappHref}>POS WebApp</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

