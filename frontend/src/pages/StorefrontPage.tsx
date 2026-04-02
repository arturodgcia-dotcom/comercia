import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { ReinpiaStorefrontLanding } from "./ReinpiaStorefrontLanding";
import { ApiError, api } from "../services/api";
import { buildBrandTheme, tokensToCssVars } from "../branding/multibrandTemplates";
import { CurrencySettings, ExchangeRate, Product, StorefrontHomePayload, TenantConfig, WishlistItem } from "../types/domain";
import { calculatePlanTotals } from "../utils/monetization";

type CartMap = Record<number, number>;
const DEMO_CUSTOMER_ID = 1;

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [data, setData] = useState<StorefrontHomePayload | null>(null);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingUpsell, setLoadingUpsell] = useState(false);
  const [cart, setCart] = useState<CartMap>({});
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [wantsRecurring, setWantsRecurring] = useState(false);
  const [upsell, setUpsell] = useState<Product[]>([]);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("MXN");
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    if (!tenantSlug) return;
    setError("");
    setErrorDetail("");
    api
      .getStorefrontHomeData(tenantSlug)
      .then(async (homeData) => {
        setData(homeData);
        const settings = await api.getCurrencySettings(homeData.tenant.id).catch(() => null);
        const exchangeRates = await api.getExchangeRates().catch(() => []);
        if (settings) {
          setCurrencySettings(settings);
          setSelectedCurrency(settings.base_currency);
        }
        setRates(exchangeRates);
        const config = await api.getTenantConfig({ tenantSlug }).catch(() => null);
        setTenantConfig(config);
        try {
          setWishlist(await api.getWishlist(homeData.tenant.id, DEMO_CUSTOMER_ID));
        } catch {
          setWishlist([]);
        }
      })
      .catch((err: unknown) => {
        const endpoint = `/api/v1/storefront/${tenantSlug}/home-data`;
        console.error(`[Storefront] Error loading endpoint ${endpoint}`, err);
        if (err instanceof ApiError && err.status === 404) {
          setError("No encontramos esta tienda o no esta activa.");
          setErrorDetail("Verifica el slug del tenant o confirma que el tenant este activo en backend.");
          return;
        }
        if (err instanceof TypeError) {
          setError("No se pudo cargar la tienda en este momento.");
          setErrorDetail("Revisa que el backend este corriendo y que CORS permita el puerto actual del frontend.");
          return;
        }
        setError("No se pudo cargar la tienda en este momento.");
        setErrorDetail(err instanceof Error ? err.message : "Fallo inesperado al consultar storefront.");
      });
  }, [tenantSlug, retryTick]);

  const allProducts = useMemo(() => {
    if (!data) return [];
    const unique = new Map<number, Product>();
    [...data.featured_products, ...data.recent_products, ...data.promo_products, ...data.best_sellers].forEach((product) =>
      unique.set(product.id, product)
    );
    return Array.from(unique.values());
  }, [data, tenantConfig]);

  const channelThemeStyle = useMemo(() => {
    if (!data) return undefined;
    const theme = buildBrandTheme(
      {
        key: data.tenant.slug,
        name: data.tenant.name,
        slug: data.tenant.slug,
        logoText: data.tenant.name,
        logoAccent: "",
        primaryColor: data.branding?.primary_color ?? "#0d3e86",
        secondaryColor: data.branding?.secondary_color ?? "#80b8f5",
        supportColor: "#3a8bf2",
        bgSoft: "#eef4ff",
        promptMaster: "",
        businessType: (data.tenant.business_type === "services" || data.tenant.business_type === "mixed" ? data.tenant.business_type : "products"),
        tone: "premium",
        baseImages: [],
        hasExistingLanding: true,
        monetizationPlan: tenantConfig?.plan_type === "commission" ? "commission" : "subscription",
        copy: {
          headline: data.branding?.hero_title ?? data.tenant.name,
          subtitle: data.branding?.hero_subtitle ?? "Ecommerce publico con identidad de marca sincronizada.",
          ctaPrimary: "Comprar ahora",
          ctaSecondary: "Canal distribuidores",
          valueProp: "Misma base visual en landing, ecommerce y POS."
        }
      },
      "public_store"
    );
    return tokensToCssVars(theme);
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

  const getDisplayPrice = (amount: number, currency: string) => {
    const settings = currencySettings;
    if (!settings || currency === settings.base_currency) return Number(amount);
    const rate = rates.find((r) => r.base_currency === settings.base_currency && r.target_currency === currency);
    if (!rate) return Number(amount);
    return Number(amount) * Number(rate.rate);
  };

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + getDisplayPrice(Number(item.product.price_public), selectedCurrency) * item.quantity, 0),
    [cartItems, selectedCurrency, rates, currencySettings]
  );

  const financialSummary = useMemo(() => {
    if (!tenantConfig) return calculatePlanTotals({ subtotal }, "subscription");
    return calculatePlanTotals({ subtotal }, tenantConfig.plan_type, tenantConfig.commission_rules);
  }, [subtotal, tenantConfig]);

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

  if (error) {
    return (
      <main className="storefront">
        <section className="store-banner">
          <h2>No se pudo cargar la tienda en este momento</h2>
          <p>{error}</p>
          {errorDetail ? <p className="error">{errorDetail}</p> : null}
          <button className="button" type="button" onClick={() => setRetryTick((value) => value + 1)}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }
  if (!data) return <p>Cargando storefront...</p>;
  if (data.tenant.slug.toLowerCase() === "reinpia") return <ReinpiaStorefrontLanding data={data} />;

  const primary = data.branding?.primary_color ?? "#0d3e86";
  const secondary = data.branding?.secondary_color ?? "#8dc4ff";

  return (
    <main className="storefront premium-store" style={channelThemeStyle}>
      <section className="store-hero premium-hero" style={{ background: `linear-gradient(130deg, ${primary}, ${secondary})` }}>
        <div className="row-gap" style={{ justifyContent: "space-between" }}>
          <LanguageSelector />
          {currencySettings ? (
            <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
              {currencySettings.enabled_currencies.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          ) : null}
        </div>
        <p className="marketing-eyebrow">Marca cliente en ComerCia</p>
        {tenantConfig ? <p className="chip">{tenantConfig.checkout_badge}</p> : null}
        <h1>{data.branding?.hero_title ?? data.tenant.name}</h1>
        <p>{data.branding?.hero_subtitle ?? "Experiencia comercial premium con ecommerce y canal distribuidor separados."}</p>
        <div className="store-actions">
          <Link to={`/store/${data.tenant.slug}/distribuidores`} className="button">
            Canal distribuidores
          </Link>
          <Link to={`/store/${data.tenant.slug}/distribuidores/registro`} className="button button-outline">
            Quiero ser distribuidor
          </Link>
          {(data.tenant.business_type === "services" || data.tenant.business_type === "mixed") && (
            <Link to={`/store/${data.tenant.slug}/services`} className="button button-outline">
              Ver servicios
            </Link>
          )}
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h3>Venta directa</h3>
          <p>Catálogo público con promociones, favoritos y checkout online.</p>
        </article>
        <article className="card">
          <h3>Canal comercial</h3>
          <p>Ruta separada para distribuidores con reglas de negocio por volumen.</p>
        </article>
        <article className="card">
          <h3>Operación inteligente</h3>
          <p>Preparado para fidelización, recurrencia, logística y reportes de crecimiento.</p>
        </article>
      </section>

      <section className="store-banner">
        <h2>Categorías</h2>
        <div className="chip-row">
          {data.categories.map((category) => (
            <span key={category.id} className="chip">{category.name}</span>
          ))}
        </div>
      </section>

      <section className="store-banner">
        <h2>Banners</h2>
        <div className="card-grid">
          {(data.banners ?? []).map((banner) => (
            <article key={banner.id} className="card">
              <h3>{banner.title}</h3>
              {banner.subtitle ? <p>{banner.subtitle}</p> : null}
              {banner.image_url ? <img src={banner.image_url} alt={banner.title} className="store-banner-image" /> : null}
              <p className="muted">Posición: {banner.position}</p>
            </article>
          ))}
        </div>
      </section>

      <ProductRail
        title="Destacados"
        products={data.featured_products}
        tenantSlug={data.tenant.slug}
        cart={cart}
        onAdd={updateCart}
        onWishlist={addToWishlist}
        wishlist={wishlist}
        selectedCurrency={selectedCurrency}
        getDisplayPrice={getDisplayPrice}
      />
      <ProductRail
        title="Promociones"
        products={data.promo_products}
        tenantSlug={data.tenant.slug}
        cart={cart}
        onAdd={updateCart}
        onWishlist={addToWishlist}
        wishlist={wishlist}
        selectedCurrency={selectedCurrency}
        getDisplayPrice={getDisplayPrice}
      />
      <ProductRail
        title="Nuevos ingresos"
        products={data.recent_products}
        tenantSlug={data.tenant.slug}
        cart={cart}
        onAdd={updateCart}
        onWishlist={addToWishlist}
        wishlist={wishlist}
        selectedCurrency={selectedCurrency}
        getDisplayPrice={getDisplayPrice}
      />
      <ProductRail
        title="Más vendidos"
        products={data.best_sellers}
        tenantSlug={data.tenant.slug}
        cart={cart}
        onAdd={updateCart}
        onWishlist={addToWishlist}
        wishlist={wishlist}
        selectedCurrency={selectedCurrency}
        getDisplayPrice={getDisplayPrice}
      />

      <section className="store-layout">
        <article className="store-banner">
          <h2>Membresías y recompra</h2>
          <div className="card-grid">
            {data.membership_plans.map((plan) => (
              <article key={plan.id} className="card">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <p>Duración: {plan.duration_days} días</p>
                <p>Precio: ${Number(plan.price).toLocaleString("es-MX")}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="store-banner">
          <h2>Carrito y checkout</h2>
          <p>Subtotal: {selectedCurrency} {financialSummary.subtotal.toLocaleString("es-MX")}</p>
          {tenantConfig?.plan_type === "commission" ? (
            <>
              <p>Comision COMERCIA: {selectedCurrency} {financialSummary.commission.toLocaleString("es-MX")}</p>
              <p className="muted">
                Comision por uso de plataforma ({(financialSummary.commissionRate * 100).toFixed(2)}% - {financialSummary.commissionRule})
              </p>
              <p>Total: {selectedCurrency} {financialSummary.total.toLocaleString("es-MX")}</p>
            </>
          ) : (
            <p className="chip">Sin comision - incluido en tu plan</p>
          )}
          {currencySettings?.display_mode === "localized_checkout" ? (
            <p>El checkout intentará cobrar en moneda local cuando el flujo lo soporte. Fallback: moneda base.</p>
          ) : (
            <p>El checkout cobra en moneda base. La moneda elegida solo se usa para visualización.</p>
          )}
          <input placeholder="Código de cupón" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <label className="checkbox">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            Aplicar puntos de fidelización
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={wantsRecurring} onChange={(e) => setWantsRecurring(e.target.checked)} />
            Programar compra recurrente
          </label>
          {wantsRecurring ? <p className="muted">La recurrencia queda marcada para activarse desde panel admin en este MVP.</p> : null}
          <h3>Upsell previo al pago</h3>
          {loadingUpsell ? <p>Cargando upsell...</p> : null}
          <div className="card-grid">
            {upsell.map((product) => (
              <article key={product.id} className="card">
                <h4>{product.name}</h4>
                <button className="button button-outline" type="button" onClick={() => updateCart(product.id, (cart[product.id] ?? 0) + 1)}>
                  Agregar
                </button>
              </article>
            ))}
          </div>
          <button className="button" type="button" onClick={handleCheckout} disabled={loadingCheckout || cartItems.length === 0}>
            {loadingCheckout ? "Redirigiendo..." : "Comprar ahora"}
          </button>
        </aside>
      </section>

      <section className="store-banner">
        <h2>Contacto</h2>
        <p>Email: {data.branding?.contact_email ?? "contacto@marca.com"}</p>
        <p>WhatsApp: {data.branding?.contact_whatsapp ?? "Disponible bajo solicitud"}</p>
      </section>
    </main>
  );
}

function ProductRail({
  title,
  products,
  tenantSlug,
  cart,
  onAdd,
  onWishlist,
  wishlist,
  selectedCurrency,
  getDisplayPrice
}: {
  title: string;
  products: Product[];
  tenantSlug: string;
  cart: CartMap;
  onAdd: (productId: number, quantity: number) => void;
  onWishlist: (productId: number) => void;
  wishlist: WishlistItem[];
  selectedCurrency: string;
  getDisplayPrice: (amount: number, currency: string) => number;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="card-grid">
        {products.map((product) => (
          <article key={product.id} className="card product-card-premium">
            <div className="product-badge-row">
              {product.is_featured ? <span className="chip">Destacado</span> : null}
              {product.is_active ? <span className="chip">Disponible</span> : <span className="chip">Inactivo</span>}
            </div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="product-price">{selectedCurrency} {Number(getDisplayPrice(Number(product.price_public), selectedCurrency)).toLocaleString("es-MX")}</p>
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
    </section>
  );
}
