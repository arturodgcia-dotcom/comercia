import { TemplateChannel, TemplateRegistryEntry, TemplateSector, TemplateStyle } from "../core/types";

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

export function buildTemplateId(sector: TemplateSector, channel: TemplateChannel, style: TemplateStyle): string {
  return `${sector}_${channel}_${style}_v1`;
}

export function buildComponentKey(sector: TemplateSector, channel: TemplateChannel, style: TemplateStyle): string {
  return `${sector}.${channel}.${style}`;
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = TEMPLATE_SECTORS.flatMap((sector) =>
  TEMPLATE_CHANNELS.flatMap((channel) =>
    TEMPLATE_STYLES.map((style) => ({
      template_id: buildTemplateId(sector, channel, style),
      channel,
      sector,
      style,
      status: style === "impacto" ? "approved" : style === "editorial" ? "draft" : "approved",
      component_key: buildComponentKey(sector, channel, style),
      version: 1,
      supports_banners: true,
      supports_brand_overrides: true,
    }))
  )
);

export const TEMPLATE_REGISTRY_BY_ID = new Map(TEMPLATE_REGISTRY.map((entry) => [entry.template_id, entry]));

