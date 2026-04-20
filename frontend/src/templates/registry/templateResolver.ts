import { StorefrontPayload } from "../../types/domain";
import { buildSectorChannelComponent } from "../core/SectorTemplateRenderer";
import { ResolvedTemplate, TemplateBusinessModel, TemplateChannel, TemplateSector, TemplateStyle } from "../core/types";
import { SECTOR_CATALOG } from "../sectors/sectorCatalog";
import { buildComponentKey, buildTemplateId, TEMPLATE_REGISTRY_BY_ID } from "./templateRegistry";

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeSector(value?: string | null): TemplateSector {
  const normalized = String(value ?? "").trim().toLowerCase();
  const aliases: Record<string, TemplateSector> = {
    alimentos: "alimentos",
    restaurante: "alimentos",
    comida: "alimentos",
    ropa: "ropa",
    moda: "ropa",
    servicios: "servicios",
    barberia: "servicios",
    maquinaria: "maquinaria",
    industrial: "maquinaria",
    salud: "salud",
    belleza: "belleza",
    educacion: "educacion",
    retail: "retail",
    distribuidores: "distribuidores",
    b2b: "distribuidores",
  };
  return aliases[normalized] ?? "retail";
}

function normalizeStyle(value?: string | null): TemplateStyle {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "impacto" || normalized === "editorial" || normalized === "minimal") return normalized;
  return "impacto";
}

function normalizeBusinessModel(value?: string | null): TemplateBusinessModel {
  return value === "commission_based" ? "commission_based" : "fixed_subscription";
}

function resolveContext(payload: StorefrontPayload | null): {
  sector: TemplateSector;
  style: TemplateStyle;
  businessModel: TemplateBusinessModel;
  businessGoal: string;
} {
  const parsed = parseConfig(payload?.storefront_config?.config_json);
  const identity = (parsed.identity_data as Record<string, unknown> | undefined) ?? {};
  const businessType = String(payload?.tenant.business_type ?? "").toLowerCase();
  const sector =
    String(identity.sector ?? "").trim() !== ""
      ? normalizeSector(String(identity.sector))
      : businessType === "services"
        ? "servicios"
        : businessType === "products"
          ? "retail"
          : "distribuidores";
  const style = normalizeStyle(String(identity.visual_style ?? "impacto"));
  const businessModel = normalizeBusinessModel(String(payload?.tenant.billing_model ?? parsed.billing_model ?? "fixed_subscription"));
  const businessGoal = String(identity.business_goal ?? "conversion");
  return { sector, style, businessModel, businessGoal };
}

export function resolveTemplateForChannel(
  payload: StorefrontPayload | null,
  channel: TemplateChannel,
  templateId?: string
): {
  component: ReturnType<typeof buildSectorChannelComponent>;
  resolved: ResolvedTemplate;
} {
  const context = resolveContext(payload);
  const registryEntry = templateId ? TEMPLATE_REGISTRY_BY_ID.get(templateId) : undefined;

  const sector = registryEntry?.sector ?? context.sector;
  const style =
    registryEntry?.style ??
    (context.businessGoal === "expansion_b2b" && (channel === "distributor_store" || channel === "webapp") && context.style === "minimal"
      ? "impacto"
      : context.style);
  const businessModel = registryEntry?.business_model ?? context.businessModel;
  const resolvedTemplateId = registryEntry?.template_id ?? buildTemplateId(sector, channel, style, businessModel);
  const componentKey = registryEntry?.component_key ?? buildComponentKey(sector, channel, style, businessModel);
  const seoProfile = registryEntry?.seo_profile ?? SECTOR_CATALOG[sector].seo;
  const aeoProfile = registryEntry?.aeo_profile ?? SECTOR_CATALOG[sector].aeo;
  const businessCopy = SECTOR_CATALOG[sector].businessCopy[businessModel];

  const component = buildSectorChannelComponent({
    channel,
    sector,
    style,
    businessModel,
    businessGoal: context.businessGoal,
    brandName: payload?.tenant.name ?? "Marca",
    primaryOverride: payload?.branding?.primary_color,
    secondaryOverride: payload?.branding?.secondary_color,
    heroTitle: payload?.branding?.hero_title,
    heroSubtitle: payload?.branding?.hero_subtitle,
  });

  const resolved: ResolvedTemplate = {
    template_id: resolvedTemplateId,
    component_key: componentKey,
    channel,
    sector,
    style,
    business_model: businessModel,
    banner_set: SECTOR_CATALOG[sector].banners[channel],
    seo_profile: seoProfile,
    aeo_profile: aeoProfile,
    overrides: {
      logoText: payload?.tenant.name,
      primaryColor: payload?.branding?.primary_color ?? undefined,
      secondaryColor: payload?.branding?.secondary_color ?? undefined,
      heroTitle: payload?.branding?.hero_title ?? undefined,
      heroSubtitle: payload?.branding?.hero_subtitle ?? undefined,
      ctaPrimary: businessCopy.cta,
      ctaSecondary: SECTOR_CATALOG[sector].theme.ctaSecondary,
      promotionLabel: businessCopy.badge,
      tone: businessCopy.argument,
    },
  };

  return { component, resolved };
}
