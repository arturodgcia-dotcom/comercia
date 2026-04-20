import { StorefrontPayload } from "../../types/domain";
import { buildSectorChannelComponent } from "../core/SectorTemplateRenderer";
import { ResolvedTemplate, TemplateChannel, TemplateSector, TemplateStyle } from "../core/types";
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

function resolveContext(payload: StorefrontPayload | null): { sector: TemplateSector; style: TemplateStyle } {
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
  return { sector, style };
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
  const style = registryEntry?.style ?? context.style;
  const resolvedTemplateId = registryEntry?.template_id ?? buildTemplateId(sector, channel, style);
  const componentKey = registryEntry?.component_key ?? buildComponentKey(sector, channel, style);

  const component = buildSectorChannelComponent({
    channel,
    sector,
    style,
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
    banner_set: SECTOR_CATALOG[sector].banners[channel],
    overrides: {
      logoText: payload?.tenant.name,
      primaryColor: payload?.branding?.primary_color ?? undefined,
      secondaryColor: payload?.branding?.secondary_color ?? undefined,
      heroTitle: payload?.branding?.hero_title ?? undefined,
      heroSubtitle: payload?.branding?.hero_subtitle ?? undefined,
      ctaPrimary: SECTOR_CATALOG[sector].theme.ctaPrimary,
      ctaSecondary: SECTOR_CATALOG[sector].theme.ctaSecondary,
      promotionLabel: `${SECTOR_CATALOG[sector].theme.label} premium`,
    },
  };

  return { component, resolved };
}

