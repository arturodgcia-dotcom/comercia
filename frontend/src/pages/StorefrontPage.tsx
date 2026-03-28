import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product, StorefrontPayload } from "../types/domain";

type CartMap = Record<number, number>;

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontPayload | null>(null);
  const [error, setError] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [cart, setCart] = useState<CartMap>({});

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefront(tenantSlug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar storefront"));
  }, [tenantSlug]);

  const allProducts = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, Product>();
    data.featured_products.forEach((product) => map.set(product.id, product));
    data.recent_products.forEach((product) => map.set(product.id, product));
    return Array.from(map.values());
  }, [data]);

  const cartItems = useMemo(
    () =>
      allProducts
        .filter((product) => (cart[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: cart[product.id]
        })),
    [allProducts, cart]
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + Number(item.product.price_public) * item.quantity,
        0
      ),
    [cartItems]
  );

  const updateCart = (productId: number, quantity: number) => {
    setCart((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  };

  const handleCheckout = async () => {
    if (!data || cartItems.length === 0) return;
    try {
      setLoadingCheckout(true);
      const response = await api.createCheckoutSession({
        tenant_id: data.tenant.id,
        items: cartItems.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        success_url: `${window.location.origin}/store/${data.tenant.slug}?checkout=success`,
        cancel_url: `${window.location.origin}/store/${data.tenant.slug}?checkout=cancel`
      });
      window.location.href = response.session_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando storefront...</p>;

  return (
    <main className="storefront">
      <section className="store-hero">
        <h1>{data.branding?.hero_title ?? data.tenant.name}</h1>
        <p>{data.branding?.hero_subtitle ?? "Landing base multitenant de COMERCIA"}</p>
        <div className="store-actions">
          <Link to={`/store/${data.tenant.slug}/distribuidores`} className="button">
            Distribuidores
          </Link>
        </div>
      </section>

      <section className="store-banner">
        <h2>Banner principal</h2>
        <p>{data.storefront_config?.promotion_text ?? "Placeholder para promociones"}</p>
      </section>

      <section>
        <h2>Categorias</h2>
        <div className="chip-row">
          {data.categories.map((category) => (
            <span key={category.id} className="chip">
              {category.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Productos destacados</h2>
        <div className="card-grid">
          {data.featured_products.map((product) => (
            <article key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${Number(product.price_public).toLocaleString("es-MX")}</strong>
              <div className="row-gap">
                <button className="button button-outline" type="button" onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}>
                  Agregar
                </button>
                <span>Cantidad: {cart[product.id] ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Productos recientes</h2>
        <div className="card-grid">
          {data.recent_products.map((product) => (
            <article key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>${Number(product.price_public).toLocaleString("es-MX")}</strong>
              <div className="row-gap">
                <button className="button button-outline" type="button" onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}>
                  Agregar
                </button>
                <span>Cantidad: {cart[product.id] ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="store-promo-placeholder">
        <h2>Productos en promocion</h2>
        <p>Espacio base para modulo de promociones por tenant.</p>
      </section>

      <section className="store-banner">
        <h2>Carrito</h2>
        <p>Items: {cartItems.length}</p>
        <p>Total estimado: ${cartTotal.toLocaleString("es-MX")}</p>
        <button className="button" type="button" onClick={handleCheckout} disabled={loadingCheckout || cartItems.length === 0}>
          {loadingCheckout ? "Redirigiendo..." : "Comprar"}
        </button>
      </section>
    </main>
  );
}
