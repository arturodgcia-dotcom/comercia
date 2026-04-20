import { WizardV2BusinessModel, WizardV2Channel, WizardV2Family, WizardV2FamilyId, WizardV2Sector } from "./types";

function buildTemplateId(familyId: WizardV2FamilyId, channel: WizardV2Channel, model: WizardV2BusinessModel): string {
  return `${familyId}_${channel}_${model}_v2`;
}

function family(
  family_id: WizardV2FamilyId,
  sector: WizardV2Sector,
  label: string,
  description: string,
  premium_notes: string[],
  model: WizardV2BusinessModel
): WizardV2Family {
  return {
    family_id,
    sector,
    label,
    description,
    premium_notes,
    channel_templates: {
      landing: buildTemplateId(family_id, "landing", model),
      public_store: buildTemplateId(family_id, "public_store", model),
      distributor_store: buildTemplateId(family_id, "distributor_store", model),
      webapp: buildTemplateId(family_id, "webapp", model),
    },
  };
}

export function getWizardV2FamilyRegistry(model: WizardV2BusinessModel): WizardV2Family[] {
  return [
    family(
      "food_premium_delivery",
      "alimentos",
      "Food Premium Delivery",
      "Landing y ecommerce de delivery premium con conversion inmediata y recompra.",
      ["Hero de combos de alto impacto", "Bloques de tiempo de entrega", "Oferta cruzada por horario"],
      model
    ),
    family(
      "healthy_products",
      "retail",
      "Healthy Products",
      "Experiencia premium para productos saludables con narrativa de beneficios y confianza.",
      ["Bloques por objetivo de salud", "Prueba social y contenido util", "CTA de compra recurrente"],
      model
    ),
    family(
      "barber_booking",
      "servicios",
      "Barber Booking",
      "Flujo premium para reservas de barberia con calendario, servicios y fidelizacion.",
      ["Agenda visible en primer pliegue", "Paquetes por estilo", "CTA de reserva inmediata"],
      model
    ),
  ];
}