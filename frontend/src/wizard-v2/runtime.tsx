import { StorefrontPayload } from "../types/domain";
import { FamilyPreview } from "./components/FamilyPreview";
import { WizardV2BusinessModel, WizardV2Channel, WizardV2FamilyId } from "./types";

const CHANNEL_SUFFIXES: WizardV2Channel[] = ["distributor_store", "public_store", "landing", "webapp"];
const KNOWN_FAMILIES: WizardV2FamilyId[] = [
  "industrial_heavy_sales",
  "food_premium_delivery",
  "healthy_products",
  "barber_booking",
  "fashion_premium",
  "clinic_trust",
  "distributor_empire",
];

function parseBusinessModel(value: string): WizardV2BusinessModel | null {
  if (value.endsWith("_commission_based")) return "commission_based";
  if (value.endsWith("_fixed_subscription")) return "fixed_subscription";
  return null;
}

export function isWizardV2TemplateId(templateId?: string): boolean {
  return Boolean(templateId && templateId.endsWith("_v2"));
}

export function parseWizardV2TemplateId(templateId: string): { familyId: WizardV2FamilyId; channel: WizardV2Channel; model: WizardV2BusinessModel } | null {
  if (!isWizardV2TemplateId(templateId)) return null;
  const base = templateId.slice(0, -3);
  const model = parseBusinessModel(base);
  if (!model) return null;
  const withoutModel = base.replace(/_(commission_based|fixed_subscription)$/, "");
  const channel = CHANNEL_SUFFIXES.find((candidate) => withoutModel.endsWith(`_${candidate}`));
  if (!channel) return null;
  const familyCandidate = withoutModel.slice(0, -(channel.length + 1));
  if (!KNOWN_FAMILIES.includes(familyCandidate as WizardV2FamilyId)) return null;
  return {
    familyId: familyCandidate as WizardV2FamilyId,
    channel,
    model,
  };
}

export function resolveWizardV2RuntimeComponent(
  templateId: string,
  fallbackChannel: WizardV2Channel,
  payload: StorefrontPayload | null
): () => JSX.Element {
  const parsed = parseWizardV2TemplateId(templateId);
  const familyId = parsed?.familyId ?? "food_premium_delivery";
  const channel = parsed?.channel ?? fallbackChannel;
  const model = parsed?.model ?? "fixed_subscription";
  const brandName = payload?.tenant.name ?? "Marca";

  return function WizardV2ChannelRuntime(): JSX.Element {
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
        <FamilyPreview familyId={familyId} channel={channel} brandName={brandName} businessModel={model} />
      </section>
    );
  };
}
