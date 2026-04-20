import { ComponentType } from "react";

export type TemplateStatus = "approved" | "draft" | "legacy" | "hidden";
export type TemplateChannel = "landing" | "public_store" | "distributor_store" | "webapp";
export type TemplateBusinessModel = "fixed_subscription" | "commission_based";
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

export type SeoProfile = {
  title_template: string;
  meta_description_template: string;
  h1_template: string;
  h2_topics: string[];
  h3_topics: string[];
  faq_questions: string[];
  quick_answer_blocks: string[];
  schema_type: "Organization" | "LocalBusiness" | "Store";
};

export type AeoProfile = {
  answer_intents: string[];
  snippets: string[];
  assistant_prompts: string[];
};

export type TemplateRegistryEntry = {
  template_id: string;
  channel: TemplateChannel;
  sector: TemplateSector;
  style: TemplateStyle;
  business_model: TemplateBusinessModel;
  status: TemplateStatus;
  component_key: string;
  version: number;
  supports_banners: boolean;
  supports_brand_overrides: boolean;
  seo_profile: SeoProfile;
  aeo_profile: AeoProfile;
};

export type ResolvedTemplate = {
  template_id: string;
  component_key: string;
  channel: TemplateChannel;
  sector: TemplateSector;
  style: TemplateStyle;
  business_model: TemplateBusinessModel;
  banner_set: string[];
  seo_profile: SeoProfile;
  aeo_profile: AeoProfile;
  overrides: {
    logoText?: string;
    primaryColor?: string;
    secondaryColor?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    promotionLabel?: string;
    tone?: string;
  };
};

export type TemplateComponent = ComponentType;
