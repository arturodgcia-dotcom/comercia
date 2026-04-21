import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../services/api";
import { Product, StorefrontHomePayload, TenantConfig } from "../types/domain";

type CartMap = Record<number, number>;
const DEMO_CUSTOMER_ID = 1;

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  baleros: "/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
  chumaceras: "/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
  cadenas: "/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
  catarinas: "/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
  bandas: "/client-assets/todoindustrialmx/producto_banda_polyv.png",
  acoples: "/client-assets/todoindustrialmx/producto_acople_rojo.png",
  retenes: "/client-assets/todoindustrialmx/brand_timken_banner.jpg",
  lubricantes: "/client-assets/todoindustrialmx/producto_bomba_naranja.jpg",
  refaccionesindustriales: "/client-assets/todoindustrialmx/hero_baleros_caliper.jpg",
};

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [cart, setCart] = useState<CartMap>({});
  const [couponCode, setCouponCode] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const isPreviewMode = searchParams.get("preview") === "1";

  useEffect(() => {
    if (!tenantSlug) return;
    setError("");
    setErrorDetail("");
    api
      .getStorefrontHomeData(tenantSlug)
      .then(async (homeData) => {
        setData(homeData);
        const config = await api.getTenantConfig({ tenantSlug }).catch(() => null);
        setTenantConfig(config);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("No encontramos esta tienda o no esta activa.");
          setErrorDetail("Verifica que la marca este publicada.");
          return;
        }
        setError("No se pudo cargar la tienda en este momento.");
        setErrorDetail(err instanceof Error ? err.message : "Fallo inesperado al consultar storefront.");
      });
  }, [tenantSlug]);

  const parsedConfig = useMemo(() => parseConfig(data?.storefront_config?.config_json), [data?.storefront_config?.config_json]);
  const channelSettings = ((parsedConfig.channel_settings as Record<string, unknown> | undefined) ?? {});
  const paymentProvider = String(parsedConfig.payment_provider ?? channelSettings.payment_provider ?? "stripe").toLowerCase();
  const mercadopagoEnabled = Boolean(channelSettings.mercadopago_enabled);
  const mercadopagoReady = mercadopagoEnabled && Boolean(channelSettings.mercadopago_public_key || channelSettings.mercadopago_access_token);
  const checkoutCurrency = String(parsedConfig.currency ?? "MXN").toUpperCase();
  const categoryImagesFromConfig = ((parsedConfig.catalog_visuals as Record<string, unknown> | undefined)?.category_images ??
    {}) as Record<string, string>;

  const allProducts = useMemo(() => {
    if (!data) return [];
    const unique = new Map<number, Product>();
    [...data.featured_products, ...data.promo_products, ...data.recent_products, ...data.best_sellers].forEach((product) =>
      unique.set(product.id, product)
    );
    return Array.from(unique.values());
  }, [data]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    data?.categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [data]);

  const resolveProductImage = (product: Product) => {
    const categoryName = product.category_id ? categoryMap.get(product.category_id) ?? "" : "";
    const normalized = normalizeKey(categoryName);
    return (
      categoryImagesFromConfig[normalized] ??
      categoryImagesFromConfig[categoryName.toLowerCase()] ??
      CATEGORY_IMAGE_MAP[normalized] ??
      "/client-assets/todoindustrialmx/hero_baleros_caliper.jpg"
    );
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allProducts.filter((product) => {
      const matchesCategory = categoryFilter === "all" ? true : product.category_id === categoryFilter;
      const haystack = `${product.name} ${product.sku} ${product.description ?? ""}`.toLowerCase();
      const matchesSearch = normalizedSearch ? haystack.includes(normalizedSearch) : true;
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, categoryFilter, search]);

  const cartItems = useMemo(
    () =>
      allProducts
        .filter((product) => (cart[product.id] ?? 0) > 0)
        .map((product) => ({ product, quantity: cart[product.id] })),
    [allProducts, cart]
  );
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.product.price_public) * item.quantity, 0), [cartItems]);

  const updateCart = (productId: number, quantity: number) => {
    setCart((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  };

  const handleCheckout = async () => {
    if (!data || cartTotal <= 0) return;
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product_id: Number(id), quantity: qty }));
    if (items.length === 0) return;
    try {
      setLoadingCheckout(true);
      const response = await api.createCheckoutSession({
        tenant_id: data.tenant.id,
        items,
        success_url: `${window.location.origin}/store/${data.tenant.slug}?checkout=success`,
        cancel_url: `${window.location.origin}/store/${data.tenant.slug}?checkout=cancel`,
        coupon_code: couponCode || undefined,
        customer_id: DEMO_CUSTOMER_ID,
        applies_to: "public",
        payment_provider: paymentProvider,
        currency: checkoutCurrency,
      });
      window.location.href = response.session_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (error) {
    return (
      <main className="route-public-catalog">
        <section className="public-shell">
          <h2>No se pudo cargar el ecommerce</h2>
          <p>{error}</p>
          {errorDetail ? <p>{errorDetail}</p> : null}
        </section>
      </main>
    );
  }
  if (!data) return <p>Cargando ecommerce publico...</p>;

  return (
    <main className="route-public-catalog">
      <section className="public-hero">
        <div>
          <p className="public-kicker">Catalogo industrial masivo</p>
          {isPreviewMode ? <p className="chip">Preview activo</p> : null}
          <h1>{data.branding?.hero_title ?? data.tenant.name}</h1>
          <p>{data.branding?.hero_subtitle ?? "Catalogo robusto para compra inmediata, cotizacion y recompra tecnica."}</p>
          <div className="public-actions">
            <Link className="button" to={`/store/${data.tenant.slug}/distribuidores`}>
              Portal B2B
            </Link>
            <Link className="button button-outline" to={`/store/${data.tenant.slug}/landing`}>
              Ver landing tecnica
            </Link>
          </div>
        </div>
        <div className="public-payment-box">
          <h3>Checkout principal</h3>
          <p>Proveedor: {paymentProvider === "mercadopago" ? "Mercado Pago" : "Stripe"}</p>
          <p>Moneda: {checkoutCurrency}</p>
          <p className={mercadopagoReady ? "chip" : "chip"}>
            {paymentProvider === "mercadopago"
              ? mercadopagoReady
                ? "Mercado Pago listo para cobro."
                : "Mercado Pago pendiente de credenciales."
              : "Checkout con Stripe habilitado."}
          </p>
          <p className="muted">{tenantConfig?.plan_type === "commission" ? "Modelo con comision activa." : "Modelo sin comision."}</p>
        </div>
      </section>

      <section className="public-shell">
        <div className="public-logo-strip">
          <img src="/client-assets/todoindustrialmx/logo_zsg.jpg" alt="ZSG" />
          <img src="/client-assets/todoindustrialmx/logo_skf.jpg" alt="SKF" />
          <img src="/client-assets/todoindustrialmx/logo_timken.png" alt="Timken" />
          <img src="/client-assets/todoindustrialmx/logo_fag.png" alt="FAG" />
          <img src="/client-assets/todoindustrialmx/logo_fulo.png" alt="FULO" />
        </div>

        <div className="public-toolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por SKU, producto o descripcion tecnica" />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value === "all" ? "all" : Number(event.target.value))}>
            <option value="all">Todas las categorias</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="public-category-rail">
          {data.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${categoryFilter === category.id ? "chip-warning" : ""}`}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="public-banner-grid">
          {(data.banners ?? []).slice(0, 4).map((banner) => (
            <article key={banner.id} className="public-banner-card">
              {banner.image_url ? <img src={banner.image_url} alt={banner.title} /> : null}
              <h3>{banner.title}</h3>
              {banner.subtitle ? <p>{banner.subtitle}</p> : null}
            </article>
          ))}
        </div>

        <div className="public-layout">
          <section className="public-product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="public-product-card">
                <img src={resolveProductImage(product)} alt={product.name} />
                <div className="public-product-meta">
                  <p className="chip">SKU: {product.sku}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description ?? "Producto industrial para operacion y mantenimiento."}</p>
                  <strong>MXN ${Number(product.price_public).toLocaleString("es-MX")}</strong>
                  <div className="public-card-actions">
                    <button className="button button-outline" type="button" onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}>
                      Agregar
                    </button>
                    <Link className="button button-outline" to={`/store/${data.tenant.slug}/product/${product.id}`}>
                      Ficha tecnica
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="public-checkout-aside">
            <h2>Carrito y checkout</h2>
            <p className="chip">Total productos: {Object.values(cart).reduce((sum, qty) => sum + qty, 0)}</p>
            <p>Total: MXN ${cartTotal.toLocaleString("es-MX")}</p>
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Cupon comercial" />
            <div className="public-checkout-buttons">
              <button className="button" type="button" onClick={handleCheckout} disabled={loadingCheckout || cartTotal <= 0}>
                {loadingCheckout ? "Redirigiendo..." : paymentProvider === "mercadopago" ? "Pagar con Mercado Pago" : "Ir a checkout"}
              </button>
              <a className="button button-outline" href={`https://wa.me/52${data.branding?.contact_whatsapp ?? "5511791417"}`} target="_blank" rel="noreferrer">
                Solicitar cotizacion
              </a>
              <button className="button button-outline" type="button">
                Transferencia bancaria
              </button>
            </div>
            <p className="muted">Para mayoreo y credito comercial, usa el portal de distribuidores.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
