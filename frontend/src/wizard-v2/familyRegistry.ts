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
  model: WizardV2BusinessModel,
  channelOverrides?: Partial<Record<WizardV2Channel, string>>
): WizardV2Family {
  return {
    family_id,
    sector,
    label,
    description,
    premium_notes,
    channel_templates: {
      landing: channelOverrides?.landing ?? buildTemplateId(family_id, "landing", model),
      public_store: channelOverrides?.public_store ?? buildTemplateId(family_id, "public_store", model),
      distributor_store: channelOverrides?.distributor_store ?? buildTemplateId(family_id, "distributor_store", model),
      webapp: channelOverrides?.webapp ?? buildTemplateId(family_id, "webapp", model),
    },
  };
}

export function getWizardV2FamilyRegistry(model: WizardV2BusinessModel): WizardV2Family[] {
  return [
    family(
      "industrial_heavy_sales",
      "maquinaria",
      "Industrial Heavy Sales",
      "Familia premium industrial para transmision de potencia, refacciones y venta tecnica consultiva.",
      [
        "Landing SEO/AEO para busquedas industriales en Mexico",
        "Catalogo publico robusto con enfoque de cotizacion y checkout Mercado Pago",
        "Portal distribuidores B2B con volumen, anticipo y pago manual supervisado"
      ],
      model,
      {
        distributor_store: buildTemplateId("distributor_empire", "distributor_store", model),
      }
    ),
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
    family(
      "fashion_premium",
      "ropa",
      "Fashion Premium",
      "Lookbook comercial de alto impacto para colecciones, drops y ticket premium.",
      ["Hero editorial de temporada", "Carriles de coleccion", "Tarjetas de producto con narrativa visual"],
      model
    ),
    family(
      "clinic_trust",
      "salud",
      "Clinic Trust",
      "Experiencia de confianza medica con conversion por especialidad y agenda.",
      ["FAQ clinica para SEO/AEO", "Bloques de credenciales", "CTA de reservacion inmediata"],
      model
    ),
    family(
      "distributor_empire",
      "retail",
      "Distributor Empire",
      "Arquitectura B2B premium para distribuidores, mayoreo y recompra recurrente.",
      ["Portal B2B con escalas", "Bloques de margen y volumen", "WebApp operativa comercial"],
      model
    ),
  ];
}
