export type WizardV2Sector =
  | "alimentos"
  | "ropa"
  | "servicios"
  | "maquinaria"
  | "salud"
  | "belleza"
  | "educacion"
  | "retail";

export type WizardV2Channel = "landing" | "public_store" | "distributor_store" | "webapp";
export type WizardV2Style = "impacto" | "editorial" | "minimal";
export type WizardV2BusinessModel = "fixed_subscription" | "commission_based";

export type WizardV2FamilyId =
  | "food_premium_delivery"
  | "healthy_products"
  | "barber_booking"
  | "fashion_premium"
  | "clinic_trust"
  | "distributor_empire";

export type WizardV2Family = {
  family_id: WizardV2FamilyId;
  sector: WizardV2Sector;
  label: string;
  description: string;
  premium_notes: string[];
  channel_templates: Record<WizardV2Channel, string>;
};

export type WizardV2ResolveInput = {
  sector: WizardV2Sector;
  style: WizardV2Style;
  business_model: WizardV2BusinessModel;
  business_goal: string;
  preferred_family_id?: WizardV2FamilyId | null;
};

export type WizardV2ResolvedChannel = {
  family_id: WizardV2FamilyId;
  label: string;
  template_id: string;
  channel: WizardV2Channel;
};
