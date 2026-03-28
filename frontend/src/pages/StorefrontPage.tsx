import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Product, StorefrontHomePayload, WishlistItem } from "../types/domain";

type CartMap = Record<number, number>;
const DEMO_CUSTOMER_ID = 1;

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [error, setError] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingUpsell, setLoadingUpsell] = useState(false);
  const [cart, setCart] = useState<CartMap>({});
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [upsell, setUpsell] = useState<Product[]>([]);

  useEffect(() => {
    if (!tenantSlug) return;
    api
      .getStorefrontHomeData(tenantSlug)
      .then(async (homeData) => {
        setData(homeData);
        try {
          setWishlist(await api.getWishlist(homeData.tenant.id, DEMO_CUSTOMER_ID));
        } catch {
          setWishlist([]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar storefront"));
  }, [tenantSlug]);

  const allProducts = useMemo(() => {
    if (!data) return [];
    const unique = new Map<number, Product>();
    [...data.featured_products, ...data.recent_products, ...data.promo_products, ...data.best_sellers].forEach((product) =>
      unique.set(product.id, product)
    );
    return Array.from(unique.values());
  }, [data]);

  const cartItems = useMemo(
    () =>
      allProducts
        .filter((product) => (cart[product.id] ?? 0) > 0)
        .map((product) => ({ product, quantity: cart[product.id] })),
    [allProducts, cart]
  );

  useEffect(() => {
    if (!data || cartItems.length === 0) {
      setUpsell([]);
      return;
    }
    setLoadingUpsell(true);
    api
      .getCheckoutUpsell(data.tenant.slug, cartItems.map((item) => item.product.id))
      .then((result) => setUpsell(result.upsell_products))
      .finally(() => setLoadingUpsell(false));
  }, [data, cartItems.length]);

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + Number(item.product.price_public) * item.quantity, 0),
    [cartItems]
  );

  const addToWishlist = async (productId: number) => {
    if (!data) return;
    const item = await api.addWishlistItem({ tenant_id: data.tenant.id, customer_id: DEMO_CUSTOMER_ID, product_id: productId });
    setWishlist((prev) => (prev.find((existing) => existing.id === item.id) ? prev : [...prev, item]));
  };

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
        cancel_url: `${window.location.origin}/store/${data.tenant.slug}?checkout=cancel`,
        coupon_code: couponCode || undefined,
        use_loyalty_points: usePoints,
        customer_id: DEMO_CUSTOMER_ID,
        applies_to: "public"
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
        <h2>Banners dinamicos</h2>
        <div className="card-grid">
          {(data.banners ?? []).map((banner) => (
            <article key={banner.id} className="card">
              <h3>{banner.title}</h3>
              <p>{banner.position}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Destacados</h2>
        <ProductGrid products={data.featured_products} tenantSlug={data.tenant.slug} cart={cart} onAdd={updateCart} onWishlist={addToWishlist} wishlist={wishlist} />
      </section>

      <section>
        <h2>Nuevos</h2>
        <ProductGrid products={data.recent_products} tenantSlug={data.tenant.slug} cart={cart} onAdd={updateCart} onWishlist={addToWishlist} wishlist={wishlist} />
      </section>

      <section>
        <h2>Promociones</h2>
        <ProductGrid products={data.promo_products} tenantSlug={data.tenant.slug} cart={cart} onAdd={updateCart} onWishlist={addToWishlist} wishlist={wishlist} />
      </section>

      <section>
        <h2>Mas vendidos (placeholder inteligente)</h2>
        <ProductGrid products={data.best_sellers} tenantSlug={data.tenant.slug} cart={cart} onAdd={updateCart} onWishlist={addToWishlist} wishlist={wishlist} />
      </section>

      <section className="store-banner">
        <h2>Membresias</h2>
        <div className="card-grid">
          {data.membership_plans.map((plan) => (
            <article key={plan.id} className="card">
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <p>Duracion: {plan.duration_days} dias</p>
              <p>Precio: ${Number(plan.price).toLocaleString("es-MX")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="store-banner">
        <h2>Checkout</h2>
        <p>Subtotal: ${subtotal.toLocaleString("es-MX")}</p>
        <input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
        <label className="checkbox">
          <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
          Aplicar puntos de fidelizacion
        </label>
        <h3>Upsell antes del pago</h3>
        {loadingUpsell ? <p>Cargando upsell...</p> : null}
        <div className="card-grid">
          {upsell.map((product) => (
            <article key={product.id} className="card">
              <h4>{product.name}</h4>
              <button className="button button-outline" type="button" onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}>
                Agregar upsell
              </button>
            </article>
          ))}
        </div>
        <button className="button" type="button" onClick={handleCheckout} disabled={loadingCheckout || cartItems.length === 0}>
          {loadingCheckout ? "Redirigiendo..." : "Comprar"}
        </button>
      </section>
    </main>
  );
}

function ProductGrid({
  products,
  tenantSlug,
  cart,
  onAdd,
  onWishlist,
  wishlist
}: {
  products: Product[];
  tenantSlug: string;
  cart: CartMap;
  onAdd: (productId: number, quantity: number) => void;
  onWishlist: (productId: number) => void;
  wishlist: WishlistItem[];
}) {
  return (
    <div className="card-grid">
      {products.map((product) => (
        <article key={product.id} className="card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p>${Number(product.price_public).toLocaleString("es-MX")}</p>
          <div className="row-gap">
            <button className="button button-outline" type="button" onClick={() => onAdd(product.id, (cart[product.id] ?? 0) + 1)}>
              Agregar
            </button>
            <button className="button button-outline" type="button" onClick={() => onWishlist(product.id)}>
              {wishlist.some((item) => item.product_id === product.id) ? "En wishlist" : "Wishlist"}
            </button>
            <Link className="button button-outline" to={`/store/${tenantSlug}/product/${product.id}`}>
              Ver detalle
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
