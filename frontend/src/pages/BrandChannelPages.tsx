import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../app/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { useAdminContextScope } from "../hooks/useAdminContextScope";
import { api } from "../services/api";
import {
  BrandChannelSettings,
  BrandAdminSettings,
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
type PublishState = "borrador" | "en revisión" | "publicado" | "requiere ajustes";

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
  if (state === "en revisión") return "chip chip-warning";
  if (state === "borrador") return "chip chip-neutral";
  return "chip chip-danger";
}

function asBrandWorkflow(config: StorefrontSnapshot | null): BrandSetupWorkflow | null {
  const payload = parseConfig(config?.config?.config_json);
  const workflow = payload.workflow;
  if (!workflow || typeof workflow !== "object") return null;
  return workflow as BrandSetupWorkflow;
}

function getStepStatus(workflow: BrandSetupWorkflow | null, code: string): string | null {
  const steps = (workflow as unknown as { steps?: Array<{ code: string; status: string; approved: boolean }> })?.steps ?? [];
  const found = steps.find((step) => step.code === code);
  if (!found) return null;
  if (found.approved) return "approved";
  return found.status ?? "pending";
}

function getPublishState(stepStatus: string | null, hasContent: boolean): PublishState {
  if (stepStatus === "approved") return "publicado";
  if (stepStatus === "in_progress") return "en revisión";
  if (hasContent) return "borrador";
  return "requiere ajustes";
}

function toBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
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
      const [tenantData, brandingData, snapshotData, productsData, distributorsData, locationsData, mercadoPagoData, channelData, brandAdminData] =
        await Promise.all([
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
  const landingExternalUrl = String(identityData.existing_landing_url ?? "").trim();
  const landingStep = getStepStatus(workflow, "landing_setup");
  const ecommerceStep = getStepStatus(workflow, "ecommerce_setup");
  const distributorsStep = getStepStatus(workflow, "distributors_setup");
  const posStep = getStepStatus(workflow, "pos_setup");

  const landingState = getPublishState(
    landingStep,
    landingExternal ? Boolean(landingExternalUrl) : Boolean(branding?.hero_title || snapshot?.config?.landing_enabled)
  );
  const publicState = getPublishState(ecommerceStep, products.length > 0 && categoriesCount > 0);
  const distributorState = getPublishState(
    distributorsStep,
    distributors.length > 0 || distributorPricingCount > 0 || toBoolean(ecommerceData.distributor_catalog_ready, false)
  );
  const posState = getPublishState(
    posStep,
    toBoolean(posSetupData.pos_enabled, false) || posLocations.length > 0 || channelSettings?.mercadopago_enabled === true
  );

  const landingUrl = landingExternal && landingExternalUrl ? landingExternalUrl : `/store/${tenantSlug}`;
  const publicUrl = `/store/${tenantSlug}`;
  const distributorsUrl = `/store/${tenantSlug}/distribuidores`;
  const posUrl = "/pos";
  const posPreviewUrl = `/templates/pos?tenant_slug=${encodeURIComponent(tenantSlug)}`;

  const runRegenerate = async (kind: "landing" | "public" | "distributors") => {
    if (!token || !tenantId) return;
    if (!isGlobalAdmin) {
      setError("Solo el panel global puede regenerar plantillas de canal.");
      return;
    }
    try {
      setRunningAction(true);
      setError("");
      setMessage("");
      if (kind === "landing") {
        await api.generateBrandSetupLanding(token, tenantId, true);
        setMessage("Landing regenerada correctamente para la marca activa.");
      } else {
        await api.applyBrandEcommerceTemplate(token, tenantId);
        setMessage("Plantilla de ecommerce regenerada correctamente para la marca activa.");
      }
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
        ? "Ecommerce público"
        : channel === "distributors"
          ? "Ecommerce distribuidores"
          : "POS / WebApp";

  const channelSubtitle =
    channel === "landing"
      ? "Centro de control de la landing comercial de la marca activa."
      : channel === "public"
        ? "Control del storefront público real con branding y estado de catálogo."
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
            Branding aplicado: {branding?.primary_color ?? "sin color principal"} / {branding?.secondary_color ?? "sin color secundario"}.
          </p>
          <p className="muted">Slug de operación: {tenant.slug}</p>
        </article>
      ) : null}

      {!loading && channel === "landing" ? (
        <>
          <article className="card">
            <h3>Estado de publicación</h3>
            <p className={statusClass(landingState)}>{landingState}</p>
            <ChannelStateLabel label="Landing externa" value={landingExternal ? "Sí" : "No"} />
            <ChannelStateLabel label="URL" value={landingExternal && landingExternalUrl ? landingExternalUrl : `${window.location.origin}${landingUrl}`} />
            <ChannelStateLabel label="Branding aplicado" value={branding ? "Sí" : "Pendiente"} />
            <ChannelStateLabel label="Modo" value={landingExternal ? "Externa" : "Interna"} />
          </article>
          <article className="card row-gap">
            <a className="button" href={landingUrl} target="_blank" rel="noreferrer">
              Ver landing
            </a>
            <a className="button button-outline" href={landingUrl} target="_blank" rel="noreferrer">
              Ver preview
            </a>
            <Link className="button button-outline" to="/admin/branding">
              Editar branding
            </Link>
            <button className="button button-outline" type="button" onClick={() => void runRegenerate("landing")} disabled={runningAction || !isGlobalAdmin || landingExternal}>
              Regenerar landing
            </button>
          </article>
        </>
      ) : null}

      {!loading && channel === "public" ? (
        <>
          <article className="card">
            <h3>Estado de ecommerce público</h3>
            <p className={statusClass(publicState)}>{publicState}</p>
            <ChannelStateLabel label="Productos cargados" value={products.length} />
            <ChannelStateLabel label="Categorías con productos" value={categoriesCount} />
            <ChannelStateLabel label="Banners activos" value={snapshot?.banners?.length ?? 0} />
            <ChannelStateLabel label="Moneda" value={brandAdminSettings?.currency_base_currency ?? "Pendiente"} />
            <ChannelStateLabel label="Idioma" value={brandAdminSettings?.language_primary ?? "Pendiente"} />
          </article>
          {products.length === 0 ? (
            <article className="card">
              <h3>Catálogo aún no cargado</h3>
              <p className="muted">Todavía no hay productos publicados para esta marca.</p>
              <div className="row-gap">
                <Link className="button" to="/admin/catalog/bulk-upload">
                  Carga masiva
                </Link>
                <Link className="button button-outline" to="/products">
                  Ir a productos
                </Link>
                <Link className="button button-outline" to="/categories">
                  Ir a categorías
                </Link>
              </div>
            </article>
          ) : null}
          <article className="card row-gap">
            <a className="button" href={publicUrl} target="_blank" rel="noreferrer">
              Ver ecommerce público
            </a>
            <a className="button button-outline" href={publicUrl} target="_blank" rel="noreferrer">
              Ver preview
            </a>
            <Link className="button button-outline" to="/products">
              Editar catálogo
            </Link>
            <button className="button button-outline" type="button" onClick={() => void runRegenerate("public")} disabled={runningAction || !isGlobalAdmin}>
              Regenerar plantilla pública
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
            <ChannelStateLabel label="Reglas por volumen" value={toBoolean(ecommerceData.volume_rules_ready, false) ? "Configuradas" : "Pendientes"} />
            <ChannelStateLabel label="Catálogo B2B" value={toBoolean(ecommerceData.distributor_catalog_ready, false) ? "Listo" : "Pendiente"} />
            <ChannelStateLabel label="Distribuidores registrados" value={distributors.length} />
          </article>
          {distributorPricingCount === 0 && distributors.length === 0 ? (
            <article className="card">
              <h3>Canal distribuidor en preparación</h3>
              <p className="muted">
                Aún no hay precios B2B ni distribuidores activos. Configura reglas comerciales para habilitar el canal.
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
            <a className="button" href={distributorsUrl} target="_blank" rel="noreferrer">
              Ver ecommerce distribuidores
            </a>
            <a className="button button-outline" href={distributorsUrl} target="_blank" rel="noreferrer">
              Ver preview
            </a>
            <Link className="button button-outline" to="/admin/distributors">
              Editar reglas comerciales
            </Link>
            <button className="button button-outline" type="button" onClick={() => void runRegenerate("distributors")} disabled={runningAction || !isGlobalAdmin}>
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
            <ChannelStateLabel label="WebApp habilitada" value={toBoolean(posSetupData.pos_enabled, false) ? "Sí" : "Pendiente"} />
            <ChannelStateLabel label="Puntos de venta" value={posLocations.length} />
            <ChannelStateLabel label="Empleados POS" value={posEmployees.length} />
            <ChannelStateLabel label="Mercado Pago POS" value={mercadoPago?.mercadopago_enabled ? "Configurado" : "Pendiente"} />
            <ChannelStateLabel label="NFC habilitado" value={channelSettings?.nfc_enabled ? "Sí" : "No"} />
          </article>
          {posLocations.length === 0 ? (
            <article className="card">
              <h3>POS aún no listo</h3>
              <p className="muted">Configura al menos un punto de venta para operar caja en la marca activa.</p>
            </article>
          ) : null}
          <article className="card row-gap">
            <a className="button" href={posUrl} target="_blank" rel="noreferrer">
              Abrir WebApp / POS
            </a>
            <a className="button button-outline" href={posPreviewUrl} target="_blank" rel="noreferrer">
              Ver preview POS
            </a>
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
