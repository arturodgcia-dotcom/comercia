import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildBrandTheme, getDemoBrandInput, tokensToCssVars } from "../../branding/multibrandTemplates";
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
  { id: 3, name: "Plan de consultoría comercial", category: "Servicios", price: 2490, score: "4.9", isService: true },
  { id: 4, name: "Bundle de temporada", category: "Promociones", price: 990, score: "4.6" },
  { id: 5, name: "Sesión de acompañamiento experto", category: "Servicios", price: 1490, score: "4.9", isService: true },
  { id: 6, name: "Producto estrella de conversión", category: "Catálogo", price: 1690, score: "4.7" },
];

export function StorePublicTemplate() {
  const [searchParams] = useSearchParams();
  const [cartCount, setCartCount] = useState(0);
  const brandInput = getDemoBrandInput(searchParams.get("brand"));
  const theme = useMemo(() => buildBrandTheme(brandInput, "public_store"), [brandInput]);
  const styleVars = useMemo(() => tokensToCssVars(theme), [theme]);

  const visibleProducts = useMemo(() => {
    if (theme.businessType === "services") return PRODUCT_DEMO.filter((item) => item.isService);
    if (theme.businessType === "products") return PRODUCT_DEMO.filter((item) => !item.isService);
    return PRODUCT_DEMO;
  }, [theme.businessType]);

  const heroMessage =
    theme.businessType === "services"
      ? "Agenda servicios, cobra en línea y automatiza seguimiento de clientes."
      : theme.businessType === "products"
        ? "Escala tu catálogo con promociones, carrito optimizado y checkout premium."
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
          <div className="tf-demo-banner">
            <strong>Demo</strong>
            <span>Vista de muestra</span>
            <span>No productivo</span>
          </div>
          <div className="tf-nav-actions">
            <Link className="button button-outline" to={`/internal/demo/distribuidores?brand=${theme.key}`}>
              Ver canal distribuidores
            </Link>
            <Link className="button button-outline" to={`/internal/demo/pos?brand=${theme.key}`}>
              Ver POS
            </Link>
            <button type="button" className="button" onClick={() => setCartCount((value) => value + 1)}>
              Carrito ({cartCount})
            </button>
          </div>
        </header>

        <section className="tf-hero">
          <article>
            <p className="tf-eyebrow">Ecommerce público de marca</p>
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
            <p>Hero, banners y categorías destacan automáticamente lo más importante para la marca.</p>
          </article>
          <article className="tf-card">
            <h3>Detalle orientado a conversión</h3>
            <p>Tarjetas, badges y llamados a la acción heredan branding y tono visual.</p>
          </article>
          <article className="tf-card">
            <h3>Checkout consistente</h3>
            <p>Flujo visual coherente con landing, distribuidores y POS para reforzar confianza.</p>
          </article>
        </section>

        <section className="tf-products">
          <div className="tf-row-between">
            <h3>Catálogo principal ({visibleProducts.length})</h3>
            <span className="tf-muted">Slug: {theme.slug}</span>
          </div>
          <div className="tf-grid tf-grid-3">
            {visibleProducts.map((item) => (
              <article className="tf-card" key={item.id}>
                <p className="tf-eyebrow">{item.category}</p>
                <h4>{item.name}</h4>
                <p className="tf-muted">Valoración {item.score} · Tarjeta heredada por marca</p>
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
            <Link to={`/comercia?brand=${theme.key}`}>Landing conectada</Link>
            <Link to={`/internal/demo/distribuidores?brand=${theme.key}`}>Canal B2B</Link>
            <Link to={`/internal/demo/pos?brand=${theme.key}`}>POS WebApp</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
