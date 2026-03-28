from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Banner, StorefrontConfig, Tenant, TenantBranding


def initialize_storefront(db: Session, tenant: Tenant) -> StorefrontConfig:
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    if not branding:
        branding = TenantBranding(
            tenant_id=tenant.id,
            primary_color="#0447A6",
            secondary_color="#DCE8FB",
            logo_url=None,
            hero_title=f"Bienvenido a {tenant.name}",
            hero_subtitle="Tu storefront multitenant en COMERCIA by REINPIA.",
            contact_whatsapp=None,
            contact_email=None,
            font_family="Segoe UI",
        )
        db.add(branding)

    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
    if not config:
        config = StorefrontConfig(
            tenant_id=tenant.id,
            is_initialized=True,
            hero_banner_url=None,
            promotion_text="Promociones destacadas de temporada.",
            ecommerce_enabled=True,
            landing_enabled=True,
            config_json='{"landing":{"sections":["hero","categorias","destacados","recientes","promociones"]},"ecommerce":{"currency":"MXN","tax":"IVA"}}',
        )
        db.add(config)
        db.flush()

    banner = db.scalar(
        select(Banner).where(Banner.tenant_id == tenant.id, Banner.storefront_config_id == config.id)
    )
    if not banner:
        db.add(
            Banner(
                tenant_id=tenant.id,
                storefront_config_id=config.id,
                title=f"Banner principal de {tenant.name}",
                subtitle="Placeholder inicial para campaña principal",
                image_url=None,
                position=1,
                is_active=True,
            )
        )

    db.commit()
    db.refresh(config)
    return config
