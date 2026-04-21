import { StorefrontPayload } from "../types/domain";
import { BrandTemplateInput } from "../branding/multibrandTemplates";
import { StorefrontDistributorsPage } from "../pages/StorefrontDistributorsPage";
import { StorefrontLandingPage } from "../pages/StorefrontLandingPage";
import { StorefrontPage } from "../pages/StorefrontPage";
import { StorePOSTemplate } from "../pages/templates/StorePOSTemplate";
import { FamilyPreview } from "./components/FamilyPreview";
import { WizardV2BusinessModel, WizardV2Channel, WizardV2FamilyId } from "./types";

const CHANNEL_SUFFIXES: WizardV2Channel[] = ["distributor_store", "public_store", "landing", "webapp"];
const KNOWN_FAMILIES: WizardV2FamilyId[] = [
  "industrial_heavy_sales",
  "food_premium_delivery",
  "healthy_products",
  "barber_booking",
  "fashion_premium",
  "clinic_trust",
  "distributor_empire",
];

function parseBusinessModel(value: string): WizardV2BusinessModel | null {
  if (value.endsWith("_commission_based")) return "commission_based";
  if (value.endsWith("_fixed_subscription")) return "fixed_subscription";
  return null;
}

function normalizeBusinessType(value?: string | null): "products" | "services" | "mixed" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "products" || normalized === "services" || normalized === "mixed") return normalized;
  return "mixed";
}

function buildRuntimeBrandInput(
  payload: StorefrontPayload | null,
  familyId: WizardV2FamilyId,
  model: WizardV2BusinessModel,
  channel: WizardV2Channel
): BrandTemplateInput {
  const brandName = payload?.tenant.name ?? "Marca";
  const slug = payload?.tenant.slug ?? "marca";
  const primaryColor = payload?.branding?.primary_color ?? (familyId === "industrial_heavy_sales" ? "#1d3557" : "#1f5fc2");
  const secondaryColor = payload?.branding?.secondary_color ?? (familyId === "industrial_heavy_sales" ? "#ff9f1c" : "#3f92ff");
  const supportColor = familyId === "industrial_heavy_sales" ? "#f7b733" : "#2e9af6";
  const businessType = normalizeBusinessType(payload?.tenant.business_type);
  const promptMaster =
    familyId === "industrial_heavy_sales"
      ? "Distribucion industrial de transmision de potencia y refacciones con foco en cotizacion rapida y recompra."
      : "Experiencia comercial premium por canal.";

  const fallbackHeadlines: Record<WizardV2Channel, string> = {
    landing: `${brandName}: propuesta comercial premium por canal`,
    public_store: `${brandName}: catalogo ecommerce de alta conversion`,
    distributor_store: `${brandName}: portal B2B de volumen`,
    webapp: `${brandName}: operacion comercial en tiempo real`,
  };

  return {
    key: slug,
    name: brandName,
    slug,
    logoText: brandName,
    logoAccent: familyId === "industrial_heavy_sales" ? "Industrial" : "",
    primaryColor,
    secondaryColor,
    supportColor,
    bgSoft: familyId === "industrial_heavy_sales" ? "#eef3f8" : "#f3f7ff",
    promptMaster,
    businessType,
    tone: familyId === "industrial_heavy_sales" ? "tecnologico" : "premium",
    baseImages: [],
    hasExistingLanding: false,
    monetizationPlan: model === "commission_based" ? "commission" : "subscription",
    copy: {
      headline: payload?.branding?.hero_title ?? fallbackHeadlines[channel],
      subtitle:
        payload?.branding?.hero_subtitle ??
        (familyId === "industrial_heavy_sales"
          ? "Entregamos soluciones en transmision de potencia con cobertura Mexico y Latinoamerica."
          : "Activa una experiencia comercial premium con identidad por canal."),
      ctaPrimary: "Cotizar ahora",
      ctaSecondary: "Hablar por WhatsApp",
      valueProp:
        familyId === "industrial_heavy_sales"
          ? "Excelente calidad al mejor precio con atencion postventa especializada."
          : "Arquitectura visual premium por canal.",
    },
  };
}

function renderWizardV2Runtime(
  familyId: WizardV2FamilyId,
  channel: WizardV2Channel,
  model: WizardV2BusinessModel,
  payload: StorefrontPayload | null
): JSX.Element {
  const brandInput = buildRuntimeBrandInput(payload, familyId, model, channel);
  const tenantSlug = payload?.tenant.slug;
  const industrialMode = familyId === "industrial_heavy_sales" || familyId === "distributor_empire";

  if (channel === "public_store") {
    return <StorefrontPage />;
  }

  if (channel === "distributor_store") {
    return <StorefrontDistributorsPage />;
  }

  if (channel === "webapp") {
    return (
      <StorePOSTemplate
        brandInputOverride={brandInput}
        tenantSlugOverride={tenantSlug}
        hideDemoBadge
        industrialMode={industrialMode}
      />
    );
  }

  if (channel === "landing") {
    return <StorefrontLandingPage />;
  }

  return <FamilyPreview familyId={familyId} channel={channel} brandName={brandInput.name} businessModel={model} />;
}

export function isWizardV2TemplateId(templateId?: string): boolean {
  return Boolean(templateId && templateId.endsWith("_v2"));
}

export function parseWizardV2TemplateId(templateId: string): { familyId: WizardV2FamilyId; channel: WizardV2Channel; model: WizardV2BusinessModel } | null {
  if (!isWizardV2TemplateId(templateId)) return null;
  const base = templateId.slice(0, -3);
  const model = parseBusinessModel(base);
  if (!model) return null;
  const withoutModel = base.replace(/_(commission_based|fixed_subscription)$/, "");
  const channel = CHANNEL_SUFFIXES.find((candidate) => withoutModel.endsWith(`_${candidate}`));
  if (!channel) return null;
  const familyCandidate = withoutModel.slice(0, -(channel.length + 1));
  if (!KNOWN_FAMILIES.includes(familyCandidate as WizardV2FamilyId)) return null;
  return {
    familyId: familyCandidate as WizardV2FamilyId,
    channel,
    model,
  };
}

export function resolveWizardV2RuntimeComponent(
  templateId: string,
  fallbackChannel: WizardV2Channel,
  payload: StorefrontPayload | null
): () => JSX.Element {
  const parsed = parseWizardV2TemplateId(templateId);
  const familyId = parsed?.familyId ?? "food_premium_delivery";
  const channel = parsed?.channel ?? fallbackChannel;
  const model = parsed?.model ?? "fixed_subscription";

  return function WizardV2ChannelRuntime(): JSX.Element {
    return renderWizardV2Runtime(familyId, channel, model, payload);
  };
}
