import { ComponentType } from "react";

export type TemplateStatus = "approved" | "draft" | "legacy" | "hidden";
export type TemplateChannel = "landing" | "public_store" | "distributor_store" | "webapp";
export type TemplateSector =
  | "alimentos"
  | "ropa"
  | "servicios"
  | "maquinaria"
  | "salud"
  | "belleza"
  | "educacion"
  | "retail"
  | "distribuidores";
export type TemplateStyle = "impacto" | "editorial" | "minimal";

export type TemplateRegistryEntry = {
  template_id: string;
  channel: TemplateChannel;
  sector: TemplateSector;
  style: TemplateStyle;
  status: TemplateStatus;
  component_key: string;
  version: number;
  supports_banners: boolean;
  supports_brand_overrides: boolean;
};

export type ResolvedTemplate = {
  template_id: string;
  component_key: string;
  channel: TemplateChannel;
  sector: TemplateSector;
  style: TemplateStyle;
  banner_set: string[];
  overrides: {
    logoText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    promotionLabel?: string;
  };
};

export type TemplateComponent = ComponentType;
