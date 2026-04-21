import json
import os
import re
from decimal import Decimal

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.models import Banner, Category, MercadoPagoSettings, Product, StorefrontConfig, Tenant, TenantBranding
from app.services.commercial_plan_service import get_plan_definition
from app.services.currency_service import upsert_currency_settings
from app.services.storefront_initializer import initialize_storefront

TENANT_SLUG = "todoindustrialmx"


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")


def _upsert_banner(db, tenant_id: int, config_id: int, *, title: str, subtitle: str, image_url: str, position: str, target_value: str) -> None:
    row = db.scalar(select(Banner).where(Banner.tenant_id == tenant_id, Banner.title == title, Banner.position == position))
    if not row:
        row = Banner(
            tenant_id=tenant_id,
            storefront_config_id=config_id,
            title=title,
            subtitle=subtitle,
            image_url=image_url,
            target_type="promotion",
            target_value=target_value,
            position=position,
            priority=1,
            is_active=True,
        )
        db.add(row)
        return
    row.storefront_config_id = config_id
    row.subtitle = subtitle
    row.image_url = image_url
    row.target_type = "promotion"
    row.target_value = target_value
    row.is_active = True


def _upsert_category(db, tenant_id: int, *, name: str, description: str | None = None) -> Category:
    slug = _slugify(name)
    row = db.scalar(select(Category).where(Category.tenant_id == tenant_id, Category.slug == slug))
    if not row:
        row = Category(
            tenant_id=tenant_id,
            name=name,
            slug=slug,
            description=description,
            is_active=True,
        )
        db.add(row)
        db.flush()
        return row
    row.name = name
    row.description = description
    row.is_active = True
    db.flush()
    return row


def _upsert_product(
    db,
    tenant_id: int,
    *,
    category_id: int | None,
    name: str,
    sku: str,
    description: str,
    price_public: str,
    price_wholesale: str,
    is_featured: bool = False,
) -> Product:
    slug = _slugify(name)
    barcode = f"C128-{sku}"
    row = db.scalar(select(Product).where(Product.tenant_id == tenant_id, Product.sku == sku))
    if not row:
        row = Product(
            tenant_id=tenant_id,
            category_id=category_id,
            name=name,
            slug=slug,
            sku=sku,
            barcode=barcode,
            barcode_type="code128",
            external_barcode=False,
            auto_generated=False,
            description=description,
            price_public=Decimal(price_public),
            price_wholesale=Decimal(price_wholesale),
            price_retail=Decimal(price_public),
            is_featured=is_featured,
            is_active=True,
        )
        db.add(row)
        db.flush()
        return row
    row.category_id = category_id
    row.name = name
    row.slug = slug
    row.description = description
    row.price_public = Decimal(price_public)
    row.price_wholesale = Decimal(price_wholesale)
    row.price_retail = Decimal(price_public)
    row.is_featured = is_featured
    row.is_active = True
    db.flush()
    return row


def main() -> None:
    with SessionLocal() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == TENANT_SLUG))
        if not tenant:
            tenant = Tenant(
                name="TODOINDUSTRIALMX",
                slug=TENANT_SLUG,
                subdomain=TENANT_SLUG,
                business_type="products",
                is_active=True,
                billing_model="commission_based",
                plan_type="commission",
                commission_enabled=True,
                commission_percentage=Decimal("3.00"),
                commission_scope="ventas_online_pagadas",
                commission_notes="Modelo comercial con comision para catalogo industrial",
            )
            db.add(tenant)
            db.flush()

        config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
        if not config:
            config = initialize_storefront(db, tenant)

        branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
        if not branding:
            branding = TenantBranding(tenant_id=tenant.id)
            db.add(branding)

        branding.primary_color = "#1A3A5F"
        branding.secondary_color = "#F2F6FA"
        branding.hero_title = "Entregamos soluciones en transmision de potencia"
        branding.hero_subtitle = "Excelente calidad al mejor precio para industria, taller y distribucion."
        branding.contact_whatsapp = "5511791417"
        branding.contact_email = "todoindustrialmx@gmail.com"
        branding.logo_url = "/client-assets/todoindustrialmx/logo_fulo.png"
        branding.font_family = "Segoe UI"

        landing_template = "industrial_heavy_sales_landing_commission_based_v2"
        public_template = "industrial_heavy_sales_public_store_commission_based_v2"
        distributor_template = "distributor_empire_distributor_store_commission_based_v2"
        webapp_template = "industrial_heavy_sales_webapp_commission_based_v2"

        payload = {}
        if config.config_json:
            try:
                payload = json.loads(config.config_json)
            except Exception:
                payload = {}
        if not isinstance(payload, dict):
            payload = {}

        mp_public_key = os.getenv("MP_PUBLIC_KEY") or os.getenv("MERCADOPAGO_PUBLIC_KEY")
        mp_access_token = os.getenv("MP_ACCESS_TOKEN") or os.getenv("MERCADOPAGO_ACCESS_TOKEN")

        category_specs = [
            ("Baleros", "Baleros industriales para carga radial y axial."),
            ("Chumaceras", "Soportes y conjuntos para ejes industriales."),
            ("Cadenas", "Cadenas de transmision para lineas productivas."),
            ("Catarinas", "Pinones y catarinas para potencia y arrastre."),
            ("Bandas", "Bandas industriales V, sincronicas y Poly-V."),
            ("Acoples", "Acoples elastomericos y de precision."),
            ("Retenes", "Sellos y retenes para control de fugas."),
            ("Lubricantes", "Lubricacion industrial y mantenimiento."),
            ("Refacciones industriales", "Componentes de ferreteria y refacciones tecnicas."),
        ]
        category_rows: dict[str, Category] = {}
        for name, description in category_specs:
            category_rows[name] = _upsert_category(db, tenant.id, name=name, description=description)

        product_specs = [
            ("Baleros", "Balero Rígido SKF 6205 2RS", "SKF-6205-2RS", "Balero sellado para motores y bandas transportadoras.", "185.00", "165.00", True),
            ("Baleros", "Balero FAG 6308 C3", "FAG-6308-C3", "Alta resistencia para servicio continuo industrial.", "420.00", "385.00", True),
            ("Chumaceras", "Chumacera UCP205 ZSG", "ZSG-UCP205", "Chumacera montada para eje de 25 mm.", "365.00", "330.00", False),
            ("Cadenas", "Cadena de Rodillos ASA 60", "CAD-ASA60", "Cadena para transmision de potencia en maquinaria.", "290.00", "260.00", False),
            ("Catarinas", "Catarina 20B 18 Dientes", "CAT-20B-18", "Catarina templada para sistemas de arrastre.", "520.00", "470.00", True),
            ("Bandas", "Banda Poly-V FULO PJ1220", "FULO-PJ1220", "Banda Poly-V para lineas de empaque y transportacion.", "215.00", "190.00", True),
            ("Bandas", "Banda Sincronica HTD 8M", "FULO-HTD8M", "Banda dentada para sincronizacion de torque.", "340.00", "305.00", False),
            ("Acoples", "Acople Elastomérico ZSG L-150", "ZSG-L150", "Acople de araña para absorber vibracion.", "485.00", "445.00", False),
            ("Retenes", "Retén NBR 35x52x7", "RET-35-52-7", "Reten de alta durabilidad para ejes rotativos.", "95.00", "80.00", False),
            ("Lubricantes", "Grasa Industrial EP2 400g", "LUB-EP2-400", "Lubricante multiproposito para mantenimiento.", "130.00", "112.00", False),
            ("Refacciones industriales", "Adhesivo Fijador Industrial 250ml", "ADH-FIJ-250", "Adhesivo para fijacion de roscas y ensambles.", "175.00", "150.00", False),
            ("Refacciones industriales", "Desengrasante Industrial 1L", "DES-IND-1L", "Desengrasante para limpieza de maquinaria.", "150.00", "128.00", False),
        ]
        for category_name, name, sku, description, public_price, wholesale_price, featured in product_specs:
            _upsert_product(
                db,
                tenant.id,
                category_id=category_rows[category_name].id,
                name=name,
                sku=sku,
                description=description,
                price_public=public_price,
                price_wholesale=wholesale_price,
                is_featured=featured,
            )

        payload.update(
            {
                "wizard_version": "v2",
                "preferred_family_id": "industrial_heavy_sales",
                "payment_provider": "mercadopago",
                "country": "MX",
                "currency": "MXN",
                "partner_mode": True,
                "commission_override": 5,
                "marketing_enabled": True,
                "plan_code": "basic_fixed",
                "landing_template": landing_template,
                "public_store_template": public_template,
                "distributor_store_template": distributor_template,
                "webapp_template": webapp_template,
                "channel_templates": {
                    "landing_template": landing_template,
                    "public_store_template": public_template,
                    "distributor_store_template": distributor_template,
                    "webapp_template": webapp_template,
                },
                "identity_data": {
                    "brand_name": "todoindustrialmx",
                    "business_description": "Distribucion industrial y transmision de potencia con asesoria tecnica y postventa.",
                    "business_type": "products",
                    "sector": "maquinaria",
                    "visual_style": "impacto",
                    "business_goal": "expansion_b2b",
                    "has_existing_landing": False,
                    "existing_landing_url": None,
                    "primary_color": "#1A3A5F",
                    "secondary_color": "#F2F6FA",
                    "brand_tone": "tecnico",
                    "logo_asset_id": None,
                    "base_image_asset_ids": [],
                },
                "generated_content": {
                    "prompt_master": "TODOINDUSTRIALMX | maquinaria | refacciones | distribucion | Mexico",
                    "value_proposition": "Mas de 30 anos resolviendo necesidades de transmision de potencia con respaldo tecnico.",
                    "communication_tone": "tecnico",
                    "suggested_sections": [
                        "Marcas distribuidas",
                        "Categorias industriales",
                        "Cobertura y logistica",
                        "Postventa y asesoria",
                    ],
                    "base_copy": "Distribuidor de ZSG, SKF, Timken, FAG, FULO y otras marcas reconocidas.",
                },
                "landing_draft": {
                    "hero_title": "Entregamos soluciones en transmision de potencia",
                    "hero_subtitle": "Distribucion industrial y asesoria tecnica con excelente calidad al mejor precio.",
                    "cta_primary": "Cotizar ahora",
                    "cta_secondary": "Ver catalogo",
                    "sections": [
                        {"title": "Marcas distribuidas", "body": "ZSG, SKF, Timken, FAG, FULO y lineas industriales complementarias."},
                        {"title": "Cobertura", "body": "Atencion y suministro para Mexico y Latinoamerica con foco en tiempos de entrega."},
                        {"title": "Postventa", "body": "Acompanamiento tecnico, seguimiento comercial y soporte para recompra."},
                    ],
                    "contact_cta": "Hablar por WhatsApp 55-11791417",
                    "seo_title": "Refacciones industriales y transmision de potencia en Mexico | TODOINDUSTRIALMX",
                    "seo_description": "Venta y asesoria de baleros, chumaceras, cadenas, bandas, retenes y refacciones industriales con entrega en Mexico.",
                    "faq_items": [
                        "Que marcas industriales distribuye TODOINDUSTRIALMX?",
                        "Manejan envio nacional y cobertura para Latinoamerica?",
                        "Puedo solicitar cotizacion tecnica por WhatsApp?",
                    ],
                    "quick_answer_blocks": [
                        "Si, cotizamos baleros, bandas, cadenas y acoples por aplicacion industrial.",
                        "Contamos con marcas reconocidas para operacion continua y mantenimiento.",
                        "Aceptamos pago con Mercado Pago y opciones B2B con transferencia.",
                    ],
                    "schema_type": "Organization",
                },
                "ecommerce_data": {
                    "catalog_mode": "manual",
                    "categories_ready": True,
                    "products_ready": True,
                    "distributor_catalog_ready": True,
                    "volume_rules_ready": True,
                    "recurring_orders_ready": True,
                    "massive_upload_enabled": True,
                    "notes": "Catalogo industrial robusto con enfoque en cotizacion y recompra.",
                },
                "pos_setup_data": {
                    "pos_enabled": True,
                    "payment_methods": ["efectivo", "mercado_pago_qr", "mercado_pago_point", "transferencia"],
                    "qr_enabled": True,
                    "payment_link_enabled": True,
                    "notes": "Mostrador industrial con cotizacion y cobro local.",
                },
                "catalog_visuals": {
                    "category_images": {
                        "baleros": "/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
                        "chumaceras": "/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
                        "cadenas": "/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
                        "catarinas": "/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
                        "bandas": "/client-assets/todoindustrialmx/producto_banda_polyv.png",
                        "acoples": "/client-assets/todoindustrialmx/producto_acople_rojo.png",
                        "retenes": "/client-assets/todoindustrialmx/brand_timken_banner.jpg",
                        "lubricantes": "/client-assets/todoindustrialmx/producto_bomba_naranja.jpg",
                        "refaccionesindustriales": "/client-assets/todoindustrialmx/hero_baleros_caliper.jpg",
                    }
                },
                "catalog_seed_summary": {
                    "categories_seeded": len(category_specs),
                    "products_seeded": len(product_specs),
                    "editable": True,
                },
                "channel_settings": {
                    "nfc_enabled": False,
                    "nfc_setup_fee": 500,
                    "nfc_card_price_standard": 200,
                    "nfc_card_price_bulk": 150,
                    "nfc_bulk_threshold": 10,
                    "mercadopago_enabled": True,
                    "mercadopago_public_key": mp_public_key,
                    "mercadopago_access_token": mp_access_token,
                    "mercadopago_qr_enabled": True,
                    "mercadopago_payment_link_enabled": True,
                    "mercadopago_point_enabled": True,
                    "mercadopago_active_for_pos_only": False,
                    "mfa_totp_enabled": False,
                    "mfa_required_for_admins": True,
                    "mfa_required_for_staff": False,
                    "mfa_required_for_distributors": False,
                    "mfa_required_for_public": False,
                    "b2b_manual_payment": True,
                    "payment_provider": "mercadopago",
                },
                "partner_billing_summary": {
                    "badge": "Cliente Partner Estratégico",
                    "membership": "Membresia Plan Basico",
                    "commission": "Comision 5%",
                    "marketing": "Marketing mensual",
                    "taxes": "IVA",
                    "total": "Total",
                    "upgrade_plan_code": "growth_fixed",
                },
            }
        )

        payload["workflow"] = {
            "current_step": "final_review",
            "is_published": False,
            "flow_type": "without_landing",
            "prompt_master": "TODOINDUSTRIALMX industrial wizard v2",
            "selected_template": landing_template,
            "webapp_template": webapp_template,
            "steps": [
                {"code": "brand_identity", "title": "Identidad de marca", "status": "approved", "approved": True},
                {"code": "sector_selection", "title": "Giro / sector", "status": "approved", "approved": True},
                {"code": "business_goal", "title": "Objetivo comercial", "status": "approved", "approved": True},
                {"code": "visual_style", "title": "Estilo visual", "status": "approved", "approved": True},
                {"code": "landing_setup", "title": "Landing", "status": "approved", "approved": True},
                {"code": "ecommerce_setup", "title": "Ecommerce publico", "status": "approved", "approved": True},
                {"code": "distributors_setup", "title": "Ecommerce distribuidores", "status": "approved", "approved": True},
                {"code": "pos_setup", "title": "POS / WebApp", "status": "approved", "approved": True},
                {"code": "final_review", "title": "Revision y publicacion", "status": "in_progress", "approved": False},
            ],
        }

        payload["admin_settings"] = {
            "currency": {"inherit_global": False},
            "language": {"primary": "es", "visible": ["es"], "market_profile": "latam_es_usd"},
            "international": {
                "country_code": "MX",
                "countries_enabled": ["MX"],
                "country_channels": [
                    {
                        "country_code": "MX",
                        "currency": "MXN",
                        "language": "es",
                        "landing_enabled": True,
                        "ecommerce_enabled": True,
                        "webapp_enabled": True,
                    }
                ],
                "expansion_enabled": True,
                "cross_border_enabled": True,
            },
            "features": {
                "logistics_enabled": True,
                "workday_enabled": True,
                "nfc_operations_enabled": False,
            },
        }

        config.is_initialized = True
        config.landing_enabled = True
        config.ecommerce_enabled = True
        config.promotion_text = "Refacciones industriales y transmision de potencia para Mexico y Latinoamerica."
        config.hero_banner_url = "/client-assets/todoindustrialmx/hero_baleros_caliper.jpg"
        config.config_json = json.dumps(payload, ensure_ascii=False)

        tenant.name = "TODOINDUSTRIALMX"
        tenant.subdomain = TENANT_SLUG
        tenant.business_type = "products"
        basic_plan = get_plan_definition("basic_fixed")
        tenant.billing_model = "fixed_subscription"
        tenant.plan_type = "subscription"
        tenant.commercial_plan_key = str(basic_plan["id"])
        tenant.commercial_plan_status = "paid"
        tenant.commercial_plan_source = "partner_override_manual"
        tenant.commercial_limits_json = json.dumps(basic_plan["limits"], ensure_ascii=False)
        tenant.commission_enabled = True
        tenant.commission_percentage = Decimal("5.00")
        tenant.commission_scope = "ventas_online_pagadas"
        tenant.commission_notes = "Comision partner override 5% sobre Plan Basico."
        tenant.subscription_plan_json = json.dumps(
            {
                "cycle": "monthly",
                "commercial_plan_key": str(basic_plan["id"]),
                "commercial_plan_code": "basic_fixed",
                "price": "3500.00",
                "price_with_tax_mxn": "4060.00",
                "benefits": [
                    "Limites Plan Basico conservados",
                    "Comision partner personalizada 5%",
                    "Marketing mensual habilitado",
                ],
                "upgrade_suggestion": "growth_fixed",
            },
            ensure_ascii=False,
        )

        mp = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant.id))
        if not mp:
            mp = MercadoPagoSettings(tenant_id=tenant.id)
            db.add(mp)
        mp.mercadopago_enabled = True
        mp.mercadopago_public_key = mp_public_key
        mp.mercadopago_access_token = mp_access_token
        mp.mercadopago_qr_enabled = True
        mp.mercadopago_payment_link_enabled = True
        mp.mercadopago_point_enabled = True
        mp.mercadopago_active_for_pos_only = False

        upsert_currency_settings(
            db,
            tenant.id,
            base_currency="MXN",
            enabled_currencies=["MXN"],
            display_mode="base_only",
            exchange_mode="manual",
            auto_update_enabled=False,
            rounding_mode="none",
        )

        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Hero industrial TODOINDUSTRIALMX",
            subtitle="Transmision de potencia y refacciones industriales",
            image_url="/client-assets/todoindustrialmx/hero_baleros_caliper.jpg",
            position="hero",
            target_value="/store/todoindustrialmx/landing",
        )
        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Marcas distribuidas",
            subtitle="Timken, SKF, FAG, ZSG y FULO",
            image_url="/client-assets/todoindustrialmx/brand_timken_banner.jpg",
            position="brands_strip",
            target_value="/store/todoindustrialmx",
        )
        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Categorias industriales",
            subtitle="Baleros, cadenas, catarinas y bandas",
            image_url="/client-assets/todoindustrialmx/catalogo_taller_baleros.png",
            position="categories_grid",
            target_value="/store/todoindustrialmx",
        )
        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Automotriz y retenes",
            subtitle="Linea automotriz y componentes de precision",
            image_url="/client-assets/todoindustrialmx/brand_timken_banner.jpg",
            position="automotriz",
            target_value="/store/todoindustrialmx",
        )
        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Ferremateriales y mantenimiento",
            subtitle="Bombas, lubricacion y soluciones de taller",
            image_url="/client-assets/todoindustrialmx/producto_bomba_naranja.jpg",
            position="ferremateriales",
            target_value="/store/todoindustrialmx",
        )
        _upsert_banner(
            db,
            tenant.id,
            config.id,
            title="Envios y logistica",
            subtitle="Cobertura nacional y soporte para Latinoamerica",
            image_url="/client-assets/todoindustrialmx/hero_bandas_black_gold.png",
            position="logistics",
            target_value="/store/todoindustrialmx/distribuidores",
        )

        db.commit()

        summary = {
            "tenant_id": tenant.id,
            "tenant_slug": tenant.slug,
            "family": payload.get("preferred_family_id"),
            "landing_template": payload.get("landing_template"),
            "public_store_template": payload.get("public_store_template"),
            "distributor_store_template": payload.get("distributor_store_template"),
            "webapp_template": payload.get("webapp_template"),
            "payment_provider": payload.get("payment_provider"),
            "country": payload.get("country"),
            "currency": payload.get("currency"),
            "mercadopago_enabled": True,
            "categories_seeded": len(category_specs),
            "products_seeded": len(product_specs),
        }
        print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
