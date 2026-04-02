import { CSSProperties } from "react";
import { BrandIdentityData, TenantBranding } from "../types/domain";

export type BrandTone = "premium" | "cercano" | "corporativo" | "juvenil" | "elegante" | "tecnologico";
export type BrandBusinessType = "products" | "services" | "mixed";
export type BrandChannel = "landing" | "public_store" | "distributor_store" | "pos";
export type MonetizationPlanType = "commission" | "subscription";

export interface BrandTemplateInput {
  key: string;
  name: string;
  slug: string;
  logoText: string;
  logoAccent?: string;
  primaryColor: string;
  secondaryColor: string;
  supportColor: string;
  bgSoft: string;
  promptMaster: string;
  businessType: BrandBusinessType;
  tone: BrandTone;
  heroImage?: string;
  baseImages: string[];
  hasExistingLanding: boolean;
  existingLandingUrl?: string;
  monetizationPlan: MonetizationPlanType;
  copy: {
    headline: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    valueProp: string;
  };
}

export interface BrandThemeTokens {
  channel: BrandChannel;
  key: string;
  name: string;
  slug: string;
  logoText: string;
  logoAccent: string;
  headline: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  valueProp: string;
  businessType: BrandBusinessType;
  tone: BrandTone;
  hasExistingLanding: boolean;
  existingLandingUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  supportColor: string;
  bgSoft: string;
  bgMuted: string;
  heroGradient: string;
  ctaGradient: string;
  surfaceGradient: string;
  panelTint: string;
  fontHeading: string;
  fontBody: string;
  radius: string;
  channelBadge: string;
  leadQuestion: string;
  monetizationPlan: MonetizationPlanType;
  baseImages: string[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => `${c}${c}`).join("") : value;
  const parsed = Number.parseInt(full, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getToneFonts(tone: BrandTone): { heading: string; body: string; radius: string } {
  if (tone === "elegante") {
    return {
      heading: "\"Manrope\", \"Avenir Next\", \"Segoe UI\", sans-serif",
      body: "\"Public Sans\", \"Segoe UI\", sans-serif",
      radius: "18px"
    };
  }
  if (tone === "corporativo") {
    return {
      heading: "\"Sora\", \"Avenir Next\", \"Segoe UI\", sans-serif",
      body: "\"Inter\", \"Segoe UI\", sans-serif",
      radius: "14px"
    };
  }
  if (tone === "juvenil") {
    return {
      heading: "\"Outfit\", \"Trebuchet MS\", sans-serif",
      body: "\"Nunito Sans\", \"Segoe UI\", sans-serif",
      radius: "20px"
    };
  }
  if (tone === "cercano") {
    return {
      heading: "\"DM Sans\", \"Segoe UI\", sans-serif",
      body: "\"Nunito Sans\", \"Segoe UI\", sans-serif",
      radius: "16px"
    };
  }
  if (tone === "tecnologico") {
    return {
      heading: "\"Space Grotesk\", \"Sora\", \"Segoe UI\", sans-serif",
      body: "\"Manrope\", \"Segoe UI\", sans-serif",
      radius: "16px"
    };
  }
  return {
    heading: "\"Sora\", \"Avenir Next\", \"Segoe UI\", sans-serif",
    body: "\"Inter\", \"Segoe UI\", sans-serif",
    radius: "16px"
  };
}

function resolveChannelBadge(channel: BrandChannel): string {
  if (channel === "landing") return "Landing comercial";
  if (channel === "public_store") return "Ecommerce publico";
  if (channel === "distributor_store") return "Canal distribuidores";
  return "WebApp POS";
}

function resolveLeadQuestion(channel: BrandChannel, businessType: BrandBusinessType): string {
  if (channel === "landing") return "Quieres activar tu ecosistema comercial completo?";
  if (channel === "distributor_store") return "Buscas operar con precios de volumen y recompra?";
  if (channel === "pos") return "Quieres vender en punto fisico y web con la misma data?";
  if (businessType === "services") return "Quieres capturar citas y pagos online en una sola vista?";
  if (businessType === "mixed") return "Quieres vender productos y servicios sin duplicar operacion?";
  return "Quieres convertir visitas en compras recurrentes con IA?";
}

export function buildBrandTheme(input: BrandTemplateInput, channel: BrandChannel): BrandThemeTokens {
  const fonts = getToneFonts(input.tone);
  const isPos = channel === "pos";
  const isDistributor = channel === "distributor_store";
  const isLanding = channel === "landing";
  const muted = rgba(input.primaryColor, 0.08);
  const panelTint = rgba(input.secondaryColor, 0.08);

  const channelAdjustedHeadline =
    isLanding && input.hasExistingLanding
      ? `${input.name}: integra ecommerce, distribuidores y POS sin rehacer tu landing actual`
      : input.copy.headline;

  const channelAdjustedCtaPrimary =
    isPos ? "Activar POS de marca" : isDistributor ? "Solicitar acceso comercial" : input.copy.ctaPrimary;
  const channelAdjustedCtaSecondary =
    isLanding && input.hasExistingLanding ? "Conectar landing existente" : input.copy.ctaSecondary;

  return {
    channel,
    key: input.key,
    name: input.name,
    slug: input.slug,
    logoText: input.logoText,
    logoAccent: input.logoAccent ?? "",
    headline: channelAdjustedHeadline,
    subtitle: input.copy.subtitle,
    ctaPrimary: channelAdjustedCtaPrimary,
    ctaSecondary: channelAdjustedCtaSecondary,
    valueProp: input.copy.valueProp,
    businessType: input.businessType,
    tone: input.tone,
    hasExistingLanding: input.hasExistingLanding,
    existingLandingUrl: input.existingLandingUrl,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    supportColor: input.supportColor,
    bgSoft: input.bgSoft,
    bgMuted: muted,
    heroGradient: `linear-gradient(140deg, ${input.primaryColor}, ${input.secondaryColor})`,
    ctaGradient: isPos
      ? `linear-gradient(135deg, ${input.secondaryColor}, ${input.primaryColor})`
      : `linear-gradient(135deg, ${input.primaryColor}, ${input.supportColor})`,
    surfaceGradient: isDistributor
      ? `linear-gradient(140deg, ${rgba(input.primaryColor, 0.05)}, ${rgba(input.secondaryColor, 0.12)})`
      : `linear-gradient(140deg, #ffffff, ${panelTint})`,
    panelTint,
    fontHeading: fonts.heading,
    fontBody: fonts.body,
    radius: fonts.radius,
    channelBadge: resolveChannelBadge(channel),
    leadQuestion: resolveLeadQuestion(channel, input.businessType),
    monetizationPlan: input.monetizationPlan,
    baseImages: input.baseImages
  };
}

export function tokensToCssVars(tokens: BrandThemeTokens): CSSProperties {
  return {
    ["--brand" as string]: tokens.primaryColor,
    ["--brand-soft" as string]: tokens.panelTint,
    ["--brand-primary" as string]: tokens.primaryColor,
    ["--brand-secondary" as string]: tokens.secondaryColor,
    ["--brand-support" as string]: tokens.supportColor,
    ["--brand-bg-soft" as string]: tokens.bgSoft,
    ["--brand-bg-muted" as string]: tokens.bgMuted,
    ["--brand-hero-gradient" as string]: tokens.heroGradient,
    ["--brand-cta-gradient" as string]: tokens.ctaGradient,
    ["--brand-surface-gradient" as string]: tokens.surfaceGradient,
    ["--brand-panel-tint" as string]: tokens.panelTint,
    ["--brand-font-heading" as string]: tokens.fontHeading,
    ["--brand-font-body" as string]: tokens.fontBody,
    ["--brand-radius" as string]: tokens.radius
  } as CSSProperties;
}

export function resolveBrandInputFromIdentity(
  identity: BrandIdentityData,
  branding?: TenantBranding,
  fallback?: Partial<BrandTemplateInput>
): BrandTemplateInput {
  return {
    key: fallback?.key ?? identity.brand_name.toLowerCase().replace(/\s+/g, "-"),
    name: identity.brand_name,
    slug: fallback?.slug ?? identity.brand_name.toLowerCase().replace(/\s+/g, "-"),
    logoText: identity.brand_name,
    logoAccent: "",
    primaryColor: branding?.primary_color ?? identity.primary_color ?? "#123f87",
    secondaryColor: branding?.secondary_color ?? identity.secondary_color ?? "#3c7de5",
    supportColor: "#2e9af6",
    bgSoft: "#f3f7ff",
    promptMaster: fallback?.promptMaster ?? "",
    businessType: identity.business_type as BrandBusinessType,
    tone: (identity.brand_tone?.toLowerCase() as BrandTone) ?? "premium",
    heroImage: fallback?.heroImage,
    baseImages: identity.base_image_asset_ids ?? [],
    hasExistingLanding: identity.has_existing_landing,
    existingLandingUrl: identity.existing_landing_url ?? undefined,
    monetizationPlan: "subscription",
    copy: {
      headline: branding?.hero_title ?? `${identity.brand_name}: vende mejor con ecommerce, distribuidores y POS conectados`,
      subtitle:
        branding?.hero_subtitle ??
        "Activa una experiencia comercial premium con automatizacion inteligente y arquitectura escalable.",
      ctaPrimary: "Comenzar implementacion",
      ctaSecondary: "Solicitar diagnostico",
      valueProp: "Una sola base visual y operativa para todo tu ecosistema."
    }
  };
}

export const MULTIBRAND_DEMO_INPUTS: Record<string, BrandTemplateInput> = {
  reinpia: {
    key: "reinpia",
    name: "REINPIA",
    slug: "reinpia",
    logoText: "REINPIA",
    logoAccent: "Labs",
    primaryColor: "#0b2d63",
    secondaryColor: "#1f5fc2",
    supportColor: "#3f92ff",
    bgSoft: "#eef4ff",
    promptMaster:
      "Plataforma tecnologica y corporativa para ecommerce multicanal, automatizacion de ventas y crecimiento de marcas.",
    businessType: "mixed",
    tone: "tecnologico",
    baseImages: ["dashboard-ia", "ecommerce-hero", "pos-panel"],
    hasExistingLanding: false,
    monetizationPlan: "commission",
    copy: {
      headline: "REINPIA activa ecosistemas comerciales inteligentes para marcas en expansion",
      subtitle:
        "Conecta landing, ecommerce, distribuidores y POS con una sola arquitectura visual y datos unificados.",
      ctaPrimary: "Activar ecosistema REINPIA",
      ctaSecondary: "Ver demo corporativa",
      valueProp: "Tecnologia empresarial aplicada a conversion, operacion y escalamiento."
    }
  },
  tulipanes: {
    key: "tulipanes",
    name: "Instituto Tulipanes Rojos",
    slug: "instituto-tulipanes-rojos",
    logoText: "Instituto Tulipanes",
    logoAccent: "Rojos",
    primaryColor: "#5a3d66",
    secondaryColor: "#c78ea8",
    supportColor: "#8f5f79",
    bgSoft: "#faf4f8",
    promptMaster:
      "Instituto educativo-profesional premium con enfoque en experiencia, confianza y acompanamiento cercano.",
    businessType: "services",
    tone: "elegante",
    baseImages: ["aula-premium", "asesoria", "agenda-servicios"],
    hasExistingLanding: true,
    existingLandingUrl: "https://institutotulipanes.com",
    monetizationPlan: "subscription",
    copy: {
      headline: "Instituto Tulipanes Rojos: experiencia educativa premium con conversion digital elegante",
      subtitle:
        "Diseño profesional, agenda de servicios, membresias y canal comercial en una misma identidad de marca.",
      ctaPrimary: "Solicitar admision",
      ctaSecondary: "Agendar asesoria",
      valueProp: "Elegancia, claridad comercial y tecnologia para escalar servicios."
    }
  }
};

export function getDemoBrandInput(brandKey: string | null | undefined): BrandTemplateInput {
  const key = (brandKey ?? "reinpia").toLowerCase();
  return MULTIBRAND_DEMO_INPUTS[key] ?? MULTIBRAND_DEMO_INPUTS.reinpia;
}
