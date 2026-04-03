import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import { buildBrandChannelUrls } from "../utils/brandChannelUrls";
import {
  BrandAdminSettings,
  BrandChannelSettings,
  BrandSetupWorkflow,
  DistributorProfile,
  MercadoPagoSettings,
  PosEmployee,
  PosLocation,
  Product,
  StorefrontSnapshot,
  Tenant,
  TenantBranding,
} from "../types/domain";

type ChannelKey = "landing" | "public" | "distributors" | "pos";
type PublishState = "borrador" | "en revision" | "publicado" | "requiere ajustes";

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function statusClass(state: PublishState): string {
  if (state === "publicado") return "chip";
  if (state === "en revision") return "chip chip-warning";
  if (state === "borrador") return "chip chip-neutral";
  return "chip chip-danger";
}

function asBrandWorkflow(config: StorefrontSnapshot | null): BrandSetupWorkflow | null {
  const payload = parseConfig(config?.config?.config_json);
  const workflow = payload.workflow;
  if (!workflow || typeof workflow !== "object") return null;
  return workflow as BrandSetupWorkflow;
}

function getStep(workflow: BrandSetupWorkflow | null, code: string) {
  const steps = (workflow as unknown as { steps?: Array<{ code: string; status: string; approved: boolean; updated_at?: string | null }> })
    ?.steps ?? [];
  return steps.find((step) => step.code === code) ?? null;
}

function getPublishState(stepStatus: string | null, hasContent: boolean): PublishState {
  if (stepStatus === "approved") return "publicado";
  if (stepStatus === "in_progress") return "en revision";
  if (hasContent) return "borrador";
  return "requiere ajustes";
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "Sin registro";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return date.toLocaleString("es-MX");
}

function normalizeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return null;
  }
}

function isDemoOrUnusableExternalUrl(url: string | null): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith(".demo") ||
      host.endsWith(".local") ||
      host.endsWith(".invalid") ||
      host.includes("example")
    );
  } catch {
    return true;
  }
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function ChannelStateLabel({ label, value }: { label: string; value: string | number }) {
  return (
    <p style={{ margin: "0" }}>
      <strong>{label}:</strong> {value}
    </p>
  );
}

function BrandChannelShell({ channel }: { channel: ChannelKey }) {
  const { token, user } = useAuth();
  const { tenantId } = useAdminContextScope();
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastRegenerated, setLastRegenerated] = useState<Record<ChannelKey, string | null>>({
    landing: null,
    public: null,
    distributors: null,
    pos: null,
  });

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [snapshot, setSnapshot] = useState<StorefrontSnapshot | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [posLocations, setPosLocations] = useState<PosLocation[]>([]);
  const [posEmployees, setPosEmployees] = useState<PosEmployee[]>([]);
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoSettings | null>(null);
  const [channelSettings, setChannelSettings] = useState<BrandChannelSettings | null>(null);
  const [brandAdminSettings, setBrandAdminSettings] = useState<BrandAdminSettings | null>(null);

  const tenantSlug = tenant?.slug ?? "sin-slug";
  const isGlobalAdmin = user?.role === "reinpia_admin";

  const load = async () => {
    if (!token) return;
    if (!tenantId) {
      setError("No hay marca activa seleccionada.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const [
        tenantData,
        brandingData,
        snapshotData,
        productsData,
        distributorsData,
        locationsData,
        mercadoPagoData,
        channelData,
        brandAdminData,
      ] = await Promise.all([
        api.getTenantById(token, tenantId),
        api.getTenantBranding(token, tenantId).catch(() => null),
        api.getTenantStorefrontConfig(token, tenantId).catch(() => null),
        api.getProductsByTenant(token, tenantId).catch(() => []),
        api.getDistributorsByTenant(token, tenantId).catch(() => []),
        api.getPosLocations(token, tenantId).catch(() => []),
        api.getMercadoPagoSettings(token, tenantId).catch(() => null),
        api.getBrandChannelSettings(token, tenantId).catch(() => null),
        api.getBrandAdminSettings(token, tenantId).catch(() => null),
      ]);

      const employeeGroups = await Promise.all(
        locationsData.map((location) => api.getPosEmployeesByLocation(token, location.id).catch(() => []))
      );

      setTenant(tenantData);
      setBranding(brandingData);
      setSnapshot(snapshotData);
      setProducts(productsData);
      setDistributors(distributorsData);
      setPosLocations(locationsData);
      setPosEmployees(employeeGroups.flat());
      setMercadoPago(mercadoPagoData);
      setChannelSettings(channelData);
      setBrandAdminSettings(brandAdminData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el canal de la marca.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, tenantId, channel]);

  const parsedConfig = useMemo(() => parseConfig(snapshot?.config?.config_json), [snapshot?.config?.config_json]);
  const workflow = useMemo(() => asBrandWorkflow(snapshot), [snapshot]);
  const identityData = (parsedConfig.identity_data as Record<string, unknown> | undefined) ?? {};
  const ecommerceData = (parsedConfig.ecommerce_data as Record<string, unknown> | undefined) ?? {};
  const posSetupData = (parsedConfig.pos_setup_data as Record<string, unknown> | undefined) ?? {};

  const categoriesCount = useMemo(() => {
    const ids = new Set(products.map((item) => item.category_id).filter(Boolean));
    return ids.size;
  }, [products]);

  const distributorPricingCount = useMemo(
    () => products.filter((item) => Number(item.price_wholesale ?? 0) > 0).length,
    [products]
  );

  const landingExternal = toBoolean(identityData.has_existing_landing, false);
  const landingExternalRaw = String(identityData.existing_landing_url ?? "").trim();
  const landingExternalUrl = normalizeExternalUrl(landingExternalRaw);
  const landingExternalDemo = isDemoOrUnusableExternalUrl(landingExternalUrl);
  const canUseExternalLanding = Boolean(landingExternal && landingExternalUrl && !landingExternalDemo);

  const landingStep = getStep(workflow, "landing_setup");
  const ecommerceStep = getStep(workflow, "ecommerce_setup");
  const distributorsStep = getStep(workflow, "distributors_setup");
  const posStep = getStep(workflow, "pos_setup");

  const landingState = getPublishState(
    landingStep?.status ?? null,
    canUseExternalLanding ? true : Boolean(branding?.hero_title || snapshot?.config?.landing_enabled)
  );
  const publicState = getPublishState(ecommerceStep?.status ?? null, products.length > 0 && categoriesCount > 0);
  const distributorState = getPublishState(
    distributorsStep?.status ?? null,
    distributors.length > 0 || distributorPricingCount > 0 || toBoolean(ecommerceData.distributor_catalog_ready, false)
  );
  const posState = getPublishState(
    posStep?.status ?? null,
    toBoolean(posSetupData.pos_enabled, false) ||
      posLocations.length > 0 ||
      channelSettings?.mercadopago_enabled === true
  );

  const urls = buildBrandChannelUrls(tenantSlug);
  const landingInternalUrl = urls.landingInternalUrl;
  const landingPreviewInternalUrl = urls.landingPreviewInternalUrl;
  const landingUrl = canUseExternalLanding ? landingExternalUrl! : landingInternalUrl;
  const landingPreviewUrl = landingPreviewInternalUrl;
  const publicUrl = urls.publicUrl;
  const distributorsUrl = urls.distributorsUrl;
  const posPreviewUrl = urls.posPreviewUrl;
  const posUrl = posPreviewUrl;

  const runRegenerate = async (kind: "landing" | "public" | "distributors") => {
    if (!token || !tenantId) return;
    setRunningAction(true);
    setError("");
    setMessage("");
    try {
      if (!isGlobalAdmin) {
        if (kind === "landing" && branding) {
          await api.upsertTenantBranding(token, tenantId, {
            hero_title: branding.hero_title ?? tenant?.name ?? "",
            hero_subtitle: branding.hero_subtitle ?? "",
          });
        } else if (channelSettings) {
          await api.updateBrandChannelSettings(token, tenantId, {
            nfc_enabled: channelSettings.nfc_enabled,
            mercadopago_enabled: channelSettings.mercadopago_enabled,
          });
        }
        const now = new Date().toISOString();
        setLastRegenerated((prev) => ({ ...prev, [kind]: now }));
        setMessage("Regeneracion registrada correctamente para la marca activa.");
        await load();
        return;
      }

      if (kind === "landing") {
        await api.generateBrandSetupLanding(token, tenantId, true);
        setMessage("Landing regenerada correctamente para la marca activa.");
      } else {
        await api.applyBrandEcommerceTemplate(token, tenantId);
        setMessage("Plantilla de ecommerce regenerada correctamente para la marca activa.");
      }
      const now = new Date().toISOString();
      setLastRegenerated((prev) => ({ ...prev, [kind]: now }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible regenerar la plantilla.");
    } finally {
      setRunningAction(false);
    }
  };

  const channelTitle =
    channel === "landing"
      ? "Landing de la marca"
      : channel === "public"
        ? "Ecommerce publico"
        : channel === "distributors"
          ? "Ecommerce distribuidores"
          : "POS / WebApp";

  const channelSubtitle =
    channel === "landing"
      ? "Centro de control de la landing comercial de la marca activa."
      : channel === "public"
        ? "Control del storefront publico real con branding y estado de catalogo."
        : channel === "distributors"
          ? "Control del canal B2B real para distribuidores y comercios."
          : "Control operativo de WebApp/POS con puntos de venta y cobros digitales.";

  return (
    <section>
      <PageHeader title={channelTitle} subtitle={channelSubtitle} />
      {loading ? <p className="muted">Cargando estado del canal...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      {!loading && tenant ? (
        <article className="card">
          <h3>Marca activa: {tenant.name}</h3>
          <p className="muted">
            Branding aplicado: {branding?.primary_color ?? "sin color principal"} /{" "}
            {branding?.secondary_color ?? "sin color secundario"}.
          </p>
          <p className="muted">Slug de operacion: {tenant.slug}</p>
        </article>
      ) : null}

      {!loading && channel === "landing" ? (
        <>
          <article className="card">
            <h3>Estado de publicacion</h3>
            <p className={statusClass(landingState)}>{landingState}</p>
            <ChannelStateLabel label="Landing externa" value={landingExternal ? "Si" : "No"} />
            <ChannelStateLabel label="Modo" value={canUseExternalLanding ? "Externa publicada" : "Interna tenant-aware"} />
            <ChannelStateLabel
              label="URL que abrira Ver landing"
              value={canUseExternalLanding ? landingUrl : `${window.location.origin}${landingUrl}`}
            />
            <ChannelStateLabel
              label="URL que abrira Ver preview"
              value={`${window.location.origin}${landingPreviewUrl}`}
            />
            <ChannelStateLabel label="Branding aplicado" value={branding ? "Si" : "Pendiente"} />
            <ChannelStateLabel
              label="Ultima regeneracion"
              value={formatDateLabel(lastRegenerated.landing ?? landingStep?.updated_at ?? null)}
            />
            {landingExternal && landingExternalDemo ? (
              <p className="muted">
                URL externa de demo/no desplegada. Se usa preview interno para evitar enlaces sin resolucion real.
              </p>
            ) : null}
            {canUseExternalLanding ? (
              <p className="muted">
                Landing externa valida detectada. El preview abre la version interna tenant-aware para validacion operativa.
              </p>
            ) : null}
          </article>
          <article className="card row-gap">
            <button className="button" type="button" onClick={() => openInNewTab(landingUrl)}>
              Ver landing
            </button>
            <button className="button button-outline" type="button" onClick={() => openInNewTab(landingPreviewUrl)}>
              Ver preview
            </button>
            <Link className="button button-outline" to="/admin/branding">
              Editar branding
            </Link>
            <button className="button button-outline" type="button" onClick={() => void runRegenerate("landing")} disabled={runningAction}>
              Regenerar landing
            </button>
          </article>
        </>
      ) : null}

      {!loading && channel === "public" ? (
        <>
          <article className="card">
            <h3>Estado de ecommerce publico</h3>
            <p className={statusClass(publicState)}>{publicState}</p>
            <ChannelStateLabel label="Productos cargados" value={products.length} />
            <ChannelStateLabel label="Categorias con productos" value={categoriesCount} />
            <ChannelStateLabel label="Banners activos" value={snapshot?.banners?.length ?? 0} />
            <ChannelStateLabel label="Moneda" value={brandAdminSettings?.currency_base_currency ?? "Pendiente"} />
            <ChannelStateLabel label="Idioma" value={brandAdminSettings?.language_primary ?? "Pendiente"} />
            <ChannelStateLabel label="Ruta ecommerce publico" value={`${window.location.origin}${publicUrl}`} />
            <ChannelStateLabel
              label="Ultima regeneracion"
              value={formatDateLabel(lastRegenerated.public ?? ecommerceStep?.updated_at ?? null)}
            />
          </article>
          {products.length === 0 ? (
            <article className="card">
              <h3>Catalogo aun no cargado</h3>
              <p className="muted">Todavia no hay productos publicados para esta marca.</p>
              <div className="row-gap">
                <Link className="button" to="/admin/catalog/bulk-upload">
                  Carga masiva
                </Link>
                <Link className="button button-outline" to="/products">
                  Ir a productos
                </Link>
                <Link className="button button-outline" to="/categories">
                  Ir a categorias
                </Link>
              </div>
            </article>
          ) : null}
          <article className="card row-gap">
            <button className="button" type="button" onClick={() => openInNewTab(publicUrl)}>
              Ver ecommerce publico
            </button>
            <button className="button button-outline" type="button" onClick={() => openInNewTab(publicUrl)}>
              Ver preview
            </button>
            <Link className="button button-outline" to="/products">
              Editar catalogo
            </Link>
            <button className="button button-outline" type="button" onClick={() => void runRegenerate("public")} disabled={runningAction}>
              Regenerar plantilla publica
            </button>
          </article>
        </>
      ) : null}

      {!loading && channel === "distributors" ? (
        <>
          <article className="card">
            <h3>Estado de ecommerce distribuidores</h3>
            <p className={statusClass(distributorState)}>{distributorState}</p>
            <ChannelStateLabel label="Productos con precio distribuidor" value={distributorPricingCount} />
            <ChannelStateLabel
              label="Reglas por volumen"
              value={toBoolean(ecommerceData.volume_rules_ready, false) ? "Configuradas" : "Pendientes"}
            />
            <ChannelStateLabel
              label="Catalogo B2B"
              value={toBoolean(ecommerceData.distributor_catalog_ready, false) ? "Listo" : "Pendiente"}
            />
            <ChannelStateLabel label="Distribuidores registrados" value={distributors.length} />
            <ChannelStateLabel label="Ruta canal distribuidores" value={`${window.location.origin}${distributorsUrl}`} />
            <ChannelStateLabel
              label="Ultima regeneracion"
              value={formatDateLabel(lastRegenerated.distributors ?? distributorsStep?.updated_at ?? null)}
            />
          </article>
          {distributorPricingCount === 0 && distributors.length === 0 ? (
            <article className="card">
              <h3>Canal distribuidor en preparacion</h3>
              <p className="muted">
                Aun no hay precios B2B ni distribuidores activos. Configura reglas comerciales para habilitar el canal.
              </p>
              <div className="row-gap">
                <Link className="button" to="/admin/distributors">
                  Ir a distribuidores
                </Link>
                <Link className="button button-outline" to="/products">
                  Ajustar precios por producto
                </Link>
              </div>
            </article>
          ) : null}
          <article className="card row-gap">
            <button className="button" type="button" onClick={() => openInNewTab(distributorsUrl)}>
              Ver ecommerce distribuidores
            </button>
            <button className="button button-outline" type="button" onClick={() => openInNewTab(distributorsUrl)}>
              Ver preview
            </button>
            <Link className="button button-outline" to="/admin/distributors">
              Editar reglas comerciales
            </Link>
            <button
              className="button button-outline"
              type="button"
              onClick={() => void runRegenerate("distributors")}
              disabled={runningAction}
            >
              Regenerar plantilla distribuidor
            </button>
          </article>
        </>
      ) : null}

      {!loading && channel === "pos" ? (
        <>
          <article className="card">
            <h3>Estado POS / WebApp</h3>
            <p className={statusClass(posState)}>{posState}</p>
            <ChannelStateLabel label="WebApp habilitada" value={toBoolean(posSetupData.pos_enabled, false) ? "Si" : "Pendiente"} />
            <ChannelStateLabel label="Puntos de venta" value={posLocations.length} />
            <ChannelStateLabel label="Empleados POS" value={posEmployees.length} />
            <ChannelStateLabel
              label="Mercado Pago POS"
              value={mercadoPago?.mercadopago_enabled ? "Configurado" : "Pendiente"}
            />
            <ChannelStateLabel label="NFC habilitado" value={channelSettings?.nfc_enabled ? "Si" : "No"} />
            <ChannelStateLabel label="Ruta POS" value={`${window.location.origin}${posUrl}`} />
            <ChannelStateLabel
              label="Ultima regeneracion"
              value={formatDateLabel(lastRegenerated.pos ?? posStep?.updated_at ?? null)}
            />
          </article>
          {posLocations.length === 0 ? (
            <article className="card">
              <h3>POS aun no listo</h3>
              <p className="muted">Configura al menos un punto de venta para operar caja en la marca activa.</p>
            </article>
          ) : null}
          <article className="card row-gap">
            <button className="button" type="button" onClick={() => openInNewTab(posUrl)}>
              Abrir WebApp / POS
            </button>
            <button className="button button-outline" type="button" onClick={() => openInNewTab(posPreviewUrl)}>
              Ver preview POS
            </button>
            <Link className="button button-outline" to="/pos/locations">
              Configurar puntos de venta
            </Link>
            <Link className="button button-outline" to="/admin/settings/payments/mercadopago">
              Configurar cobros POS
            </Link>
          </article>
        </>
      ) : null}
    </section>
  );
}

export function BrandLandingChannelPage() {
  return <BrandChannelShell channel="landing" />;
}

export function BrandPublicEcommerceChannelPage() {
  return <BrandChannelShell channel="public" />;
}

export function BrandDistributorsChannelPage() {
  return <BrandChannelShell channel="distributors" />;
}

export function BrandPosChannelPage() {
  return <BrandChannelShell channel="pos" />;
}
