export const OFFICIAL_LANDING_TEMPLATE = "approved_landing_v1";
export const OFFICIAL_PUBLIC_STORE_TEMPLATE = "approved_public_v1";
export const OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE = "approved_b2b_v1";

export type OfficialChannelTemplateKey =
  | "landing_template"
  | "public_store_template"
  | "distributor_store_template";

export type OfficialChannelTemplates = {
  landing_template: string;
  public_store_template: string;
  distributor_store_template: string;
};

export const OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS: OfficialChannelTemplates = {
  landing_template: OFFICIAL_LANDING_TEMPLATE,
  public_store_template: OFFICIAL_PUBLIC_STORE_TEMPLATE,
  distributor_store_template: OFFICIAL_DISTRIBUTOR_STORE_TEMPLATE,
};

function parseConfig(raw?: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeTemplateId(value: unknown, fallback: string): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export function resolveOfficialChannelTemplatesFromConfig(configJson?: string | null): OfficialChannelTemplates {
  const parsed = parseConfig(configJson);
  const workflow = (parsed.workflow as Record<string, unknown> | undefined) ?? {};
  const channelTemplates = (parsed.channel_templates as Record<string, unknown> | undefined) ?? {};

  const legacyLandingTemplate =
    workflow.selected_template ??
    parsed.selected_template ??
    parsed.landing_template ??
    parsed.landing_mode;

  return {
    landing_template: normalizeTemplateId(
      parsed.landing_template ?? channelTemplates.landing_template ?? legacyLandingTemplate,
      OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.landing_template
    ),
    public_store_template: normalizeTemplateId(
      parsed.public_store_template ?? channelTemplates.public_store_template,
      OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.public_store_template
    ),
    distributor_store_template: normalizeTemplateId(
      parsed.distributor_store_template ?? channelTemplates.distributor_store_template,
      OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS.distributor_store_template
    ),
  };
}
