import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { ApiError, api } from "../services/api";
import { buildBrandTheme, tokensToCssVars } from "../branding/multibrandTemplates";
import {
  Banner,
  Category,
  CurrencySettings,
  ExchangeRate,
  MembershipPlan,
  Product,
  StorefrontHomePayload,
  TenantConfig,
  WishlistItem,
} from "../types/domain";
import { calculatePlanTotals } from "../utils/monetization";

type CartMap = Record<number, number>;
const DEMO_CUSTOMER_ID = 1;

function isTulipanesTenant(data: StorefrontHomePayload): boolean {
  const name = data.tenant.name.toLowerCase();
  const slug = data.tenant.slug.toLowerCase();
  return name.includes("tulipanes") || slug.includes("tulipanes");
}

function buildTenantAwareDemoCategories(data: StorefrontHomePayload): Category[] {
  const base = isTulipanesTenant(data)
    ? ["Cosmetologia", "Podologia", "Diplomados", "Cursos", "Talleres", "Kits y materiales"]
    : ["Destacados", "Promociones", "Nuevos", "Servicios", "Especialidades", "Recomendados"];

  return base.map((name, index) => ({
    id: -100 - index,
    tenant_id: data.tenant.id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: `Categoria sugerida para ${data.tenant.name}.`,
    is_active: true,
  }));
}

function buildTenantAwareDemoProducts(data: StorefrontHomePayload, categories: Category[]): Product[] {
  if (isTulipanesTenant(data)) {
    const drafts = [
      ["Diplomado Integral en Cosmetologia", "Formacion profesional con enfoque practico y certificacion.", 4850],
      ["Diplomado Profesional en Podologia", "Programa avanzado para atencion clinica y comercial.", 5200],
      ["Curso Intensivo de Manicure Avanzado", "Curso corto orientado a salida laboral inmediata.", 1890],
      ["Taller de Tecnicas de Colorimetria", "Especializacion para estilismo y asesoria de imagen.", 1450],
      ["Kit de Practica Profesional", "Material base para iniciar practicas en laboratorio.", 1190],
      ["Paquete de Inscripcion + Materiales", "Beneficio de temporada para nuevas inscripciones.", 2590],
    ] as const;
    return drafts.map((row, index) => ({
      id: -1000 - index,
      tenant_id: data.tenant.id,
      category_id: categories[index % categories.length]?.id,
      name: row[0],
      slug: row[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: row[1],
      price_public: row[2],
      price_wholesale: undefined,
      price_retail: undefined,
      stripe_product_id: null,
      stripe_price_id_public: null,
      stripe_price_id_retail: null,
      stripe_price_id_wholesale: null,
      is_featured: index < 3,
      is_active: true,
    }));
  }

  const generic = [
    ["Programa destacado de temporada", "Oferta principal para captacion y conversion comercial.", 1990],
    ["Paquete premium de lanzamiento", "Incluye beneficios clave para nuevos clientes.", 2490],
    ["Servicio especializado", "Atencion profesional con seguimiento personalizado.", 1390],
    ["Bundle promocional", "Combinacion de servicios/productos con descuento.", 1590],
    ["Curso o taller recomendado", "Contenido de alto valor para crecimiento del cliente.", 1290],
    ["Kit de apoyo", "Material complementario para mejorar experiencia.", 890],
  ] as const;
  return generic.map((row, index) => ({
    id: -2000 - index,
    tenant_id: data.tenant.id,
    category_id: categories[index % categories.length]?.id,
    name: row[0],
    slug: row[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: row[1],
    price_public: row[2],
    price_wholesale: undefined,
    price_retail: undefined,
    stripe_product_id: null,
    stripe_price_id_public: null,
    stripe_price_id_retail: null,
    stripe_price_id_wholesale: null,
    is_featured: index < 3,
    is_active: true,
  }));
}

function buildTenantAwareDemoBanners(data: StorefrontHomePayload): Banner[] {
  const isTulipanes = isTulipanesTenant(data);
  const rows = isTulipanes
    ? [
        ["Inscripciones abiertas", "Cupos disponibles para la nueva generacion.", "hero"],
        ["Diplomado en cosmetologia", "Inicia este mes con plan academico profesional.", "store_top"],
        ["Formacion profesional en podologia", "Programa con practica guiada y certificacion.", "store_top"],
        ["Paquetes de inscripcion y materiales", "Aprovecha promociones por temporada.", "checkout_upsell"],
      ]
    : [
        ["Oferta principal activa", "Promocion comercial destacada para nuevos clientes.", "hero"],
        ["Coleccion recomendada", "Productos y servicios con mayor conversion.", "store_top"],
      ];
  return rows.map((row, index) => ({
    id: -3000 - index,
    tenant_id: data.tenant.id,
    storefront_config_id: undefined,
    title: row[0],
    subtitle: row[1],
    image_url: undefined,
    target_type: "promotion",
    target_value: undefined,
    position: row[2],
    priority: index + 1,
    starts_at: undefined,
    ends_at: undefined,
    is_active: true,
  }));
}

function buildTenantAwareDemoMemberships(data: StorefrontHomePayload): MembershipPlan[] {
  if (isTulipanesTenant(data)) {
    return [
      {
        id: -4001,
        tenant_id: data.tenant.id,
        name: "Membresia Alumno Activo",
        description: "Acceso a beneficios en talleres y materiales durante 90 dias.",
        duration_days: 90,
        price: 690,
        points_multiplier: 1,
        benefits_json: undefined,
        is_active: true,
      },
    ];
  }
  return [];
}

export function StorefrontPage() {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
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
  const isPreviewMode = searchParams.get("preview") === "1";

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

  const effectiveCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.length > 0 ? data.categories : buildTenantAwareDemoCategories(data);
  }, [data, tenantConfig]);

  const effectiveBanners = useMemo(() => {
    if (!data) return [];
    const banners = data.banners ?? [];
    return banners.length > 0 ? banners : buildTenantAwareDemoBanners(data);
  }, [data]);

  const hasRealProducts = useMemo(() => {
    if (!data) return false;
    return (
      data.featured_products.length > 0 ||
      data.promo_products.length > 0 ||
      data.recent_products.length > 0 ||
      data.best_sellers.length > 0
    );
  }, [data]);

  const effectiveFeaturedProducts = useMemo(() => {
    if (!data) return [];
    if (data.featured_products.length > 0) return data.featured_products;
    return buildTenantAwareDemoProducts(data, effectiveCategories).slice(0, 6);
  }, [data, effectiveCategories]);

  const effectivePromoProducts = useMemo(() => {
    if (!data) return [];
    if (data.promo_products.length > 0) return data.promo_products;
    const demo = buildTenantAwareDemoProducts(data, effectiveCategories);
    return demo.slice(2, 8);
  }, [data, effectiveCategories]);

  const effectiveRecentProducts = useMemo(() => {
    if (!data) return [];
    if (data.recent_products.length > 0) return data.recent_products;
    const demo = buildTenantAwareDemoProducts(data, effectiveCategories);
    return demo.slice(1, 7);
  }, [data, effectiveCategories]);

  const effectiveBestSellerProducts = useMemo(() => {
    if (!data) return [];
    if (data.best_sellers.length > 0) return data.best_sellers;
    const demo = buildTenantAwareDemoProducts(data, effectiveCategories);
    return demo.slice(0, 6);
  }, [data, effectiveCategories]);

  const effectiveMembershipPlans = useMemo(() => {
    if (!data) return [];
    return data.membership_plans.length > 0 ? data.membership_plans : buildTenantAwareDemoMemberships(data);
  }, [data]);

  const allProducts = useMemo(() => {
    if (!data) return [];
    const unique = new Map<number, Product>();
    [
      ...effectiveFeaturedProducts,
      ...effectiveRecentProducts,
      ...effectivePromoProducts,
      ...effectiveBestSellerProducts,
    ].forEach((product) =>
      unique.set(product.id, product)
    );
    return Array.from(unique.values());
  }, [data, effectiveFeaturedProducts, effectiveRecentProducts, effectivePromoProducts, effectiveBestSellerProducts]);

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
        {isPreviewMode ? <p className="chip chip-neutral">Modo preview de ecommerce publico</p> : null}
        {!hasRealProducts ? <p className="chip chip-warning">Mostrando catalogo demo tenant-aware</p> : null}
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
          <p>Catalogo publico con promociones, favoritos y checkout online.</p>
        </article>
        <article className="card">
          <h3>Canal comercial</h3>
          <p>Ruta separada para distribuidores con reglas de negocio por volumen.</p>
        </article>
        <article className="card">
          <h3>Operacion inteligente</h3>
          <p>Preparado para fidelizacion, recurrencia, logistica y reportes de crecimiento.</p>
        </article>
      </section>

      <section className="store-banner">
        <h2>Categorias</h2>
        <div className="chip-row">
          {effectiveCategories.map((category) => (
            <span key={category.id} className="chip">{category.name}</span>
          ))}
        </div>
      </section>

      <section className="store-banner">
        <h2>Banners</h2>
        <div className="card-grid">
          {effectiveBanners.map((banner) => (
            <article key={banner.id} className="card">
              <h3>{banner.title}</h3>
              {banner.subtitle ? <p>{banner.subtitle}</p> : null}
              {banner.image_url ? <img src={banner.image_url} alt={banner.title} className="store-banner-image" /> : null}
              <p className="muted">Posicion: {banner.position}</p>
            </article>
          ))}
        </div>
      </section>

      <ProductRail
        title="Destacados"
        products={effectiveFeaturedProducts}
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
        products={effectivePromoProducts}
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
        products={effectiveRecentProducts}
        tenantSlug={data.tenant.slug}
        cart={cart}
        onAdd={updateCart}
        onWishlist={addToWishlist}
        wishlist={wishlist}
        selectedCurrency={selectedCurrency}
        getDisplayPrice={getDisplayPrice}
      />
      <ProductRail
        title="Mas vendidos"
        products={effectiveBestSellerProducts}
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
          <h2>Membresias y recompra</h2>
          <div className="card-grid">
            {effectiveMembershipPlans.map((plan) => (
              <article key={plan.id} className="card">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <p>Duracion: {plan.duration_days} dias</p>
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
            <p>El checkout intentara cobrar en moneda local cuando el flujo lo soporte. Fallback: moneda base.</p>
          ) : (
            <p>El checkout cobra en moneda base. La moneda elegida solo se usa para visualizacion.</p>
          )}
          <input placeholder="Codigo de cupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <label className="checkbox">
            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
            Aplicar puntos de fidelizacion
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
