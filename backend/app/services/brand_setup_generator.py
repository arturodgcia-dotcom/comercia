from __future__ import annotations

from app.schemas.brand_setup import BrandGeneratedContent, BrandIdentityData, BrandLandingDraft, BrandLandingSection


def generate_brand_content(identity: BrandIdentityData, prompt_master: str) -> BrandGeneratedContent:
    tone = identity.brand_tone.strip() or "profesional"
    business = identity.business_description.strip()
    brand_name = identity.brand_name.strip()
    prompt = prompt_master.strip()
    sections = [
        "Hero con propuesta de valor clara",
        "Beneficios diferenciales",
        "Oferta principal",
        "Testimonios y confianza",
        "CTA de contacto/diagnostico",
    ]
    base_copy = (
        f"{brand_name} impulsa {business.lower()} con una experiencia comercial ordenada. "
        f"Esta propuesta usa un tono {tone} para conectar con su audiencia y convertir visitas en ventas."
    )
    value_prop = (
        f"Convertimos la oferta de {brand_name} en una experiencia comercial clara, medible y lista para escalar."
    )
    if prompt:
        base_copy = f"{base_copy} Enfoque solicitado: {prompt}"
    return BrandGeneratedContent(
        prompt_master=prompt,
        value_proposition=value_prop,
        communication_tone=tone,
        suggested_sections=sections,
        base_copy=base_copy,
    )


def generate_landing_draft(identity: BrandIdentityData, generated: BrandGeneratedContent) -> BrandLandingDraft:
    brand_name = identity.brand_name
    hero_title = f"{brand_name}: crecimiento comercial con estructura"
    hero_subtitle = generated.base_copy
    sections = [
        BrandLandingSection(
            title="Por que elegirnos",
            body=f"{generated.value_proposition} Diseñamos un recorrido simple para que cada visita tenga una accion clara.",
        ),
        BrandLandingSection(
            title="Que obtienes desde el inicio",
            body=(
                "Landing premium, canal ecommerce listo para conversion y seguimiento comercial "
                "alineado al momento de tu negocio."
            ),
        ),
        BrandLandingSection(
            title="Como trabajamos",
            body="Diagnostico, activacion rapida y optimizacion continua con indicadores operativos.",
        ),
    ]
    return BrandLandingDraft(
        hero_title=hero_title,
        hero_subtitle=hero_subtitle,
        cta_primary="Solicitar diagnostico",
        cta_secondary="Hablar con un asesor",
        sections=sections,
        contact_cta="Agenda una llamada para activar tu marca con plan de crecimiento.",
    )
