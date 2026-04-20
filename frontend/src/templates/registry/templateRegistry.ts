import { TemplateBusinessModel, TemplateChannel, TemplateRegistryEntry, TemplateSector, TemplateStyle } from "../core/types";
import { SECTOR_CATALOG } from "../sectors/sectorCatalog";

export const TEMPLATE_CHANNELS: TemplateChannel[] = ["landing", "public_store", "distributor_store", "webapp"];
export const TEMPLATE_SECTORS: TemplateSector[] = [
  "alimentos",
  "ropa",
  "servicios",
  "maquinaria",
  "salud",
  "belleza",
  "educacion",
  "retail",
  "distribuidores",
];
export const TEMPLATE_STYLES: TemplateStyle[] = ["impacto", "editorial", "minimal"];
export const TEMPLATE_BUSINESS_MODELS: TemplateBusinessModel[] = ["fixed_subscription", "commission_based"];

export function buildTemplateId(
  sector: TemplateSector,
  channel: TemplateChannel,
  style: TemplateStyle,
  businessModel: TemplateBusinessModel
): string {
  return `${sector}_${channel}_${style}_${businessModel}_v1`;
}

export function buildComponentKey(
  sector: TemplateSector,
  channel: TemplateChannel,
  style: TemplateStyle,
  businessModel: TemplateBusinessModel
): string {
  return `${sector}.${channel}.${style}.${businessModel}`;
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = TEMPLATE_SECTORS.flatMap((sector) =>
  TEMPLATE_CHANNELS.flatMap((channel) =>
    TEMPLATE_STYLES.flatMap((style) =>
      TEMPLATE_BUSINESS_MODELS.map((businessModel) => ({
        template_id: buildTemplateId(sector, channel, style, businessModel),
        channel,
        sector,
        style,
        business_model: businessModel,
        status: style === "impacto" ? "approved" : style === "editorial" ? "draft" : "approved",
        component_key: buildComponentKey(sector, channel, style, businessModel),
        version: 1,
        supports_banners: true,
        supports_brand_overrides: true,
        seo_profile: SECTOR_CATALOG[sector].seo,
        aeo_profile: SECTOR_CATALOG[sector].aeo,
      }))
    )
  )
);

export const TEMPLATE_REGISTRY_BY_ID = new Map(TEMPLATE_REGISTRY.map((entry) => [entry.template_id, entry]));
