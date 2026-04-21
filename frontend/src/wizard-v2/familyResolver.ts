import { getWizardV2FamilyRegistry } from "./familyRegistry";
import { WizardV2BusinessModel, WizardV2Channel, WizardV2Family, WizardV2ResolveInput, WizardV2ResolvedChannel, WizardV2Sector } from "./types";

const SECTOR_FAMILY_PRIORITY: Partial<Record<WizardV2Sector, WizardV2Family["family_id"][]>> = {
  alimentos: ["food_premium_delivery"],
  ropa: ["fashion_premium"],
  retail: ["healthy_products"],
  salud: ["clinic_trust"],
  servicios: ["barber_booking"],
};

function pickFamily(input: WizardV2ResolveInput): WizardV2Family {
  const registry = getWizardV2FamilyRegistry(input.business_model);

  if (input.preferred_family_id) {
    const preferred = registry.find((item) => item.family_id === input.preferred_family_id);
    if (preferred) return preferred;
  }

  const candidates = registry.filter((item) => item.sector === input.sector);
  if (candidates.length) {
    if (input.business_goal === "expansion_b2b") {
      const b2b = registry.find((item) => item.family_id === "distributor_empire");
      if (b2b) return b2b;
    }
    return candidates[0];
  }

  const orderedIds = SECTOR_FAMILY_PRIORITY[input.sector] ?? [];
  const ordered = orderedIds
    .map((id) => registry.find((item) => item.family_id === id))
    .filter((item): item is WizardV2Family => Boolean(item));
  if (ordered.length) return ordered[0];

  if (input.business_goal === "expansion_b2b") {
    return registry.find((item) => item.family_id === "distributor_empire") ?? registry[0];
  }
  return registry[0];
}

export function resolveWizardV2ChannelTemplate(input: WizardV2ResolveInput, channel: WizardV2Channel): WizardV2ResolvedChannel {
  const family = pickFamily(input);
  return {
    family_id: family.family_id,
    label: family.label,
    template_id: family.channel_templates[channel],
    channel,
  };
}

export function resolveWizardV2Templates(input: WizardV2ResolveInput): {
  family: WizardV2Family;
  landing_template: string;
  public_store_template: string;
  distributor_store_template: string;
  webapp_template: string;
} {
  const family = pickFamily(input);
  return {
    family,
    landing_template: family.channel_templates.landing,
    public_store_template: family.channel_templates.public_store,
    distributor_store_template: family.channel_templates.distributor_store,
    webapp_template: family.channel_templates.webapp,
  };
}

export function normalizeWizardV2Model(value?: string | null): WizardV2BusinessModel {
  return value === "commission_based" ? "commission_based" : "fixed_subscription";
}
