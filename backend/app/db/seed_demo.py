from __future__ import annotations

import json
from datetime import datetime, timedelta
from decimal import Decimal

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.seed_app_base import seed_app_base
from app.db.session import SessionLocal, engine
from app.models.models import (
    Appointment,
    Banner,
    Base,
    Category,
    CustomerContactLead,
    CommissionDetail,
    Coupon,
    CurrencySettings,
    Customer,
    CustomerLoyaltyAccount,
    DistributorApplication,
    DistributorEmployee,
    DistributorProfile,
    ExchangeRate,
    LogisticsEvent,
    LogisticsAdditionalService,
    LogisticsOrder,
    LoyaltyProgram,
    MembershipPlan,
    MercadoPagoSettings,
    Order,
    OrderItem,
    Plan,
    PlanPurchaseLead,
    PosEmployee,
    PosLocation,
    PosPaymentTransaction,
    PosSale,
    PosSaleItem,
    Product,
    ProductReview,
    RecurringOrderItem,
    RecurringOrderSchedule,
    SecurityAlert,
    SecurityEvent,
    SecurityRule,
    SalesCommissionAgent,
    ServiceOffering,
    StorefrontConfig,
    Subscription,
    Tenant,
    TenantBranding,
    User,
    WishlistItem,
    BotChannelConfig,
    BotMessageTemplate,
    AutomationEventLog,
)
from app.services.commission_agents_service import register_plan_purchase_lead
from app.services.currency_service import create_manual_exchange_rate, upsert_currency_settings
from app.services.marketing_insights_service import generate_tenant_growth_insights
from app.services.security_watch_service import block_entity
from app.services.storefront_initializer import initialize_storefront
from app.services.brand_setup_generator import generate_brand_content, generate_landing_draft
from app.schemas.brand_setup import BrandIdentityData

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")


def seed_demo_data(db: Session) -> None:
    seed_app_base(db)
    plans = {p.code: p for p in db.scalars(select(Plan)).all()}
    tenants = [
        _tenant(db, "REINPIA", "reinpia", "services", True, plans["PLAN_1"].id),
        _tenant(db, "NATURA VIDA", "natura-vida", "mixed", True, plans["PLAN_2"].id),
        _tenant(db, "CAFE MONTE ALTO", "cafe-monte-alto", "products", True, plans["PLAN_1"].id),
        _tenant(db, "Instituto Zaro Latino", "instituto-zaro-latino", "services", True, plans["PLAN_1"].id),
        _tenant(db, "TENANT DEMO INACTIVO", "demo-inactivo", "mixed", False, plans["PLAN_1"].id),
    ]
    db.commit()
    for t in tenants:
        initialize_storefront(db, t)
    db.commit()

    _seed_reinpia(db, tenants[0])
    _seed_products_tenant(db, tenants[1], "NAT")
    _seed_products_tenant(db, tenants[2], "CAF")
    _seed_instituto_zaro_latino(db, tenants[3])
    _seed_subscriptions(db, tenants, plans)
    _seed_users(db, tenants)
    _seed_currency_settings(db, tenants)
    _seed_payment_settings(db, tenants)
    _seed_pos_data(db, tenants)
    _seed_agents_and_leads(db)
    _seed_security_demo_data(db, tenants)
    _seed_additional_logistics_services(db, tenants)
    _seed_customer_contact_and_automation(db, tenants)
    _spread_demo_timestamps(db, tenants)
    for tenant in tenants:
        if tenant.is_active:
            generate_tenant_growth_insights(db, tenant.id)
    db.commit()


def _tenant(db: Session, name: str, slug: str, business_type: str, is_active: bool, plan_id: int) -> Tenant:
    t = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not t:
        t = Tenant(name=name, slug=slug, subdomain=slug, business_type=business_type, is_active=is_active, plan_id=plan_id)
        db.add(t)
        db.flush()
        return t
    t.name, t.subdomain, t.business_type, t.is_active, t.plan_id = name, slug, business_type, is_active, plan_id
    return t


def _seed_reinpia(db: Session, tenant: Tenant) -> None:
    _branding(db, tenant.id, "#0F3E5A", "#E6F4FA", "https://placehold.co/300x80?text=REINPIA", "Desarrollamos tecnologia que convierte procesos en crecimiento")
    cfg = _storefront(db, tenant.id, "Soluciones REINPIA listas para activacion comercial")
    categories = [
        _category(db, tenant.id, "Implementacion", "implementacion"),
        _category(db, tenant.id, "Automatizacion", "automatizacion"),
        _category(db, tenant.id, "Plataformas", "plataformas"),
        _category(db, tenant.id, "Consultoria", "consultoria"),
    ]
    services = [
        _service(db, tenant.id, categories[0].id, "Implementacion COMERCIA", "implementacion-comercia", 14500),
        _service(db, tenant.id, categories[2].id, "Renta de COMERCIA", "renta-comercia", 8900),
        _service(db, tenant.id, categories[0].id, "Implementacion NERVIA", "implementacion-nervia", 15200),
        _service(db, tenant.id, categories[0].id, "Implementacion SprintPilot", "implementacion-sprintpilot", 13800),
        _service(db, tenant.id, categories[1].id, "Automatizacion comercial con IA", "automatizacion-ia", 16800),
        _service(db, tenant.id, categories[3].id, "Desarrollo a la medida", "desarrollo-a-la-medida", 22000),
    ]
    prod_cat = _category(db, tenant.id, "Paquetes tecnologicos", "paquetes-tecnologicos")
    p1 = _product(db, tenant.id, prod_cat.id, "Pack Implementacion COMERCIA", "pack-implementacion-comercia", 18900, True)
    p2 = _product(db, tenant.id, prod_cat.id, "Bundle Automatizacion IA", "bundle-automatizacion-ia", 22900, True)
    _banner(db, tenant.id, cfg.id, "Soluciones REINPIA para crecer mas rapido", "hero", "/store/reinpia/services")
    _banner(db, tenant.id, cfg.id, "Canal agencias y distribuidores REINPIA", "distributors_top", "/store/reinpia/distribuidores/registro")
    _coupon(db, tenant.id, "REINPIA10", "percentage", 10)
    _coupon(db, tenant.id, "REINPIA500", "fixed", 500)
    lp = _loyalty(db, tenant.id, "Club REINPIA")
    c1 = _customer(db, tenant.id, "Monica Solis", "monica@empresa.demo")
    c2 = _customer(db, tenant.id, "Ramon Cardenas", "ramon@empresa.demo")
    c3 = _customer(db, tenant.id, "Erika Vidal", "erika@empresa.demo")
    _loyalty_account(db, tenant.id, lp.id, c1.id, 480)
    _loyalty_account(db, tenant.id, lp.id, c2.id, 210)
    _review(db, tenant.id, p1.id, 5, "Excelente implementacion", True, "Equipo muy profesional, cumplieron fechas y objetivos.", "approved")
    _review(db, tenant.id, p1.id, 4, "Buen arranque", True, "El onboarding fue claro para nuestro equipo comercial.", "approved")
    _review(db, tenant.id, p2.id, 5, "Automatizacion real", True, "La automatizacion redujo tareas manuales en dos semanas.", "approved")
    _review(db, tenant.id, p2.id, 4, "Servicio recomendado", True, "Lo recomiendo para marcas que ya venden y quieren escalar.", "approved")
    _review(db, tenant.id, p1.id, 3, "Pendiente de aprobacion", False, "Comentario publico pendiente de publicacion por moderacion.", "pending")
    _review(db, tenant.id, p2.id, 2, "Caso distribuidor mayoreo", False, "Soy distribuidor y pido ajuste de condiciones mayoreo.", "rejected")
    _review(db, tenant.id, p1.id, 4, "Observacion de servicio", False, "El servicio fue bueno, pero pido ajustar instrucciones previas.", "pending")
    _review(db, tenant.id, p2.id, 3, "Observacion de logistica", True, "La entrega llego con retraso menor, pero el seguimiento fue claro.", "approved")
    _dist_profile(db, tenant.id, "Agencia Andromeda", "ali@andromeda.demo", True)
    _dist_profile(db, tenant.id, "Canal Norte Tech", "jorge@norte.demo", True)
    _dist_employee(db, tenant.id, "ali@andromeda.demo", "Mariana Suarez", "mariana@andromeda.demo", "Ejecutiva comercial")
    _dist_employee(db, tenant.id, "jorge@norte.demo", "Luis Ortega", "luis@norte.demo", "Vendedor mayorista")
    _dist_app(db, tenant.id, "Canal Delta", "carlos@delta.demo")
    _appointment(db, tenant.id, c1.id, services[0].id, "notified", notes_suffix="normal-notificada")
    _appointment(db, tenant.id, c1.id, services[0].id, "confirmed", notes_suffix="normal-confirmada", confirmation_received=True)
    _appointment(
        db,
        tenant.id,
        c2.id,
        services[4].id,
        "attended",
        is_gift=True,
        gift_sender_name="Daniela Ruiz",
        gift_sender_email="daniela@regalos.demo",
        gift_recipient_name="Marcos Leon",
        gift_recipient_email="marcos@cliente.demo",
        gift_recipient_phone="+52 5512345678",
        gift_message="Te regalo esta consultoria para impulsar tu negocio.",
        instructions_sent=True,
        confirmation_received=True,
        notes_suffix="regalo-asistio",
    )
    _appointment(
        db,
        tenant.id,
        c3.id,
        services[1].id,
        "completed",
        is_gift=True,
        gift_is_anonymous=True,
        gift_recipient_name="Cliente anonimo",
        gift_message="Un obsequio especial para tu marca.",
        instructions_sent=True,
        confirmation_received=True,
        notes_suffix="regalo-anonimo-cerrada",
    )
    _appointment(db, tenant.id, c2.id, services[2].id, "cancelled", notes_suffix="normal-cancelada")
    o1 = _order(db, tenant.id, c1.id, "reinpia-ord-1", 14500, 500, 14000, 0, 14000, "paid", "plan1")
    _order_item(db, o1.id, service_id=services[0].id, unit=14500, qty=1)
    o2 = _order(db, tenant.id, c2.id, "reinpia-ord-2", 16800, 0, 16800, 0, 16800, "failed", "plan1")
    _order_item(db, o2.id, service_id=services[4].id, unit=16800, qty=1)
    o3 = _order(db, tenant.id, c3.id, "reinpia-ord-3", 22900, 900, 22000, 0, 22000, "paid", "plan1")
    _order_item(db, o3.id, product_id=p2.id, unit=22900, qty=1)
    _logistics(db, tenant.id, o1.id, c1.id, "scheduled")
    _logistics(db, tenant.id, o3.id, c3.id, "in_transit")

    identity = BrandIdentityData(
        brand_name="REINPIA",
        business_description="Marca de tecnologia aplicada a ventas, operacion y automatizacion para empresas.",
        business_type="services",
        has_existing_landing=False,
        existing_landing_url=None,
        primary_color="#0F3E5A",
        secondary_color="#E6F4FA",
        brand_tone="profesional",
        logo_asset_id=None,
        base_image_asset_ids=[],
    )
    prompt = "Marca tecnologica enfocada en soluciones SaaS, automatizacion comercial y servicios B2B."
    generated = generate_brand_content(identity, prompt)
    payload = json.loads(cfg.config_json) if cfg.config_json else {}
    payload["workflow"] = {
        "current_step": "landing_setup",
        "is_published": False,
        "prompt_master": prompt,
        "selected_template": "premium_moderno",
        "flow_type": "without_landing",
        "steps": [
            {"code": "brand_identity", "title": "Identidad de marca", "status": "approved", "approved": True},
            {"code": "landing_setup", "title": "Landing", "status": "in_progress", "approved": False},
            {"code": "ecommerce_setup", "title": "Ecommerce publico", "status": "pending", "approved": False},
            {"code": "distributors_setup", "title": "Ecommerce distribuidores", "status": "pending", "approved": False},
            {"code": "pos_setup", "title": "POS / WebApp", "status": "pending", "approved": False},
            {"code": "final_review", "title": "Revision y publicacion", "status": "pending", "approved": False},
        ],
    }
    payload["identity_data"] = identity.model_dump()
    payload["generated_content"] = generated.model_dump()
    cfg.config_json = json.dumps(payload, ensure_ascii=False)
    db.add(cfg)


def _seed_instituto_zaro_latino(db: Session, tenant: Tenant) -> None:
    _branding(
        db,
        tenant.id,
        "#6E2EB8",
        "#F3E9FF",
        "https://placehold.co/300x80?text=Instituto+Zaro+Latino",
        "Formacion profesional para cosmetologia y podologia",
    )
    config = _storefront(db, tenant.id, "Inscripciones abiertas para diplomados y certificaciones")
    cat1 = _category(db, tenant.id, "Cosmetologia", "cosmetologia")
    cat2 = _category(db, tenant.id, "Podologia", "podologia")
    cat3 = _category(db, tenant.id, "Diplomados", "diplomados")
    s1 = _service(db, tenant.id, cat1.id, "Diplomado de cosmetologia integral", "diplomado-cosmetologia-integral", 9800)
    _service(db, tenant.id, cat2.id, "Certificacion avanzada en podologia", "certificacion-podologia-avanzada", 11200)
    _service(db, tenant.id, cat3.id, "Diplomado master en estetica aplicada", "diplomado-master-estetica", 12800)
    _banner(db, tenant.id, config.id, "Convierte tu talento en una carrera rentable", "hero", f"/store/{tenant.slug}/services")

    identity = BrandIdentityData(
        brand_name="Instituto Zaro Latino",
        business_description="Servicios educativos en cosmetologia, podologia y diplomados profesionales.",
        business_type="services",
        has_existing_landing=True,
        existing_landing_url="https://instituto-zaro-latino.demo",
        primary_color="#6E2EB8",
        secondary_color="#F3E9FF",
        brand_tone="premium",
        logo_asset_id=None,
        base_image_asset_ids=[],
    )
    prompt = "Centro educativo enfocado en cosmetologia, podologia y diplomados con orientacion a empleabilidad."
    generated = generate_brand_content(identity, prompt)
    landing = generate_landing_draft(identity, generated)
    workflow_steps = [
        {"code": "brand_identity", "title": "Identidad de marca", "status": "approved", "approved": True},
        {"code": "ecommerce_setup", "title": "Ecommerce publico", "status": "in_progress", "approved": False},
        {"code": "distributors_setup", "title": "Ecommerce distribuidores", "status": "pending", "approved": False},
        {"code": "pos_setup", "title": "POS / WebApp", "status": "pending", "approved": False},
        {"code": "final_review", "title": "Revision y publicacion", "status": "pending", "approved": False},
    ]
    payload = json.loads(config.config_json) if config.config_json else {}
    payload["workflow"] = {
        "current_step": "ecommerce_setup",
        "is_published": False,
        "prompt_master": prompt,
        "selected_template": "premium_moderno",
        "flow_type": "with_existing_landing",
        "steps": workflow_steps,
    }
    payload["identity_data"] = identity.model_dump()
    payload["generated_content"] = generated.model_dump()
    payload["landing_draft"] = landing.model_dump()
    payload["ecommerce_data"] = {
        "catalog_mode": "manual",
        "categories_ready": True,
        "products_ready": False,
        "massive_upload_enabled": True,
        "notes": "Demo inicial: activar carga de programas y productos educativos.",
    }
    config.config_json = json.dumps(payload, ensure_ascii=False)
    db.add(config)
    c = _customer(db, tenant.id, "Paola Mendoza", "paola@zarolatino.demo")
    o = _order(db, tenant.id, c.id, "zaro-ord-1", 9800, 0, 9800, 0, 9800, "paid", "plan1")
    _order_item(db, o.id, service_id=s1.id, unit=9800, qty=1)


def _seed_products_tenant(db: Session, tenant: Tenant, prefix: str) -> None:
    _branding(db, tenant.id, "#2F7D32" if prefix == "NAT" else "#5A3A22", "#ECF8EE" if prefix == "NAT" else "#F6EFE9", f"https://placehold.co/300x80?text={tenant.slug.upper()}", f"{tenant.name}: tienda demo lista para venta")
    cfg = _storefront(db, tenant.id, f"Promociones activas de {tenant.name}")
    c1, c2, c3, c4 = (
        _category(db, tenant.id, "Tes y bebidas", "tes-bebidas"),
        _category(db, tenant.id, "Accesorios", "accesorios"),
        _category(db, tenant.id, "Kits", "kits"),
        _category(db, tenant.id, "Promociones", "promociones"),
    )
    products = [
        _product(db, tenant.id, c1.id, f"{prefix} Blend Energia", f"blend-energia-{tenant.slug}", 320, True),
        _product(db, tenant.id, c1.id, f"{prefix} Infusion Relax", f"infusion-relax-{tenant.slug}", 290, True),
        _product(db, tenant.id, c1.id, f"{prefix} Cafe Especial", f"cafe-especial-{tenant.slug}", 410, False),
        _product(db, tenant.id, c2.id, f"{prefix} Taza Premium", f"taza-premium-{tenant.slug}", 220, False),
        _product(db, tenant.id, c2.id, f"{prefix} Termo Smart", f"termo-smart-{tenant.slug}", 560, True),
        _product(db, tenant.id, c3.id, f"{prefix} Kit Bienestar", f"kit-bienestar-{tenant.slug}", 890, True),
        _product(db, tenant.id, c3.id, f"{prefix} Kit Oficina", f"kit-oficina-{tenant.slug}", 980, False),
        _product(db, tenant.id, c4.id, f"{prefix} Pack Promo", f"pack-promo-{tenant.slug}", 760, True),
        _product(db, tenant.id, c4.id, f"{prefix} Pack Distribuidor", f"pack-distribuidor-{tenant.slug}", 1450, False),
        _product(db, tenant.id, c1.id, f"{prefix} Seasonal", f"seasonal-{tenant.slug}", 370, False),
    ]
    _banner(db, tenant.id, cfg.id, f"{tenant.name}: banner hero", "hero", f"/store/{tenant.slug}")
    _banner(db, tenant.id, cfg.id, f"{tenant.name}: promo principal", "store_top", "promociones")
    _banner(db, tenant.id, cfg.id, f"{tenant.name}: upsell checkout", "checkout_upsell", "upsell-demo")
    _coupon(db, tenant.id, f"{prefix}10", "percentage", 10)
    _coupon(db, tenant.id, f"{prefix}150", "fixed", 150)
    lp = _loyalty(db, tenant.id, f"Club {tenant.name}")
    _membership(db, tenant.id, "Membresia Oro", 30, 399)
    ca, cb = _customer(db, tenant.id, f"Cliente {tenant.slug} A", f"cliente-a@{tenant.slug}.demo"), _customer(db, tenant.id, f"Cliente {tenant.slug} B", f"cliente-b@{tenant.slug}.demo")
    _loyalty_account(db, tenant.id, lp.id, ca.id, 160)
    _wishlist(db, tenant.id, ca.id, products[0].id)
    _wishlist(db, tenant.id, ca.id, products[4].id)
    _review(db, tenant.id, products[0].id, 5, "Muy buen producto", True, "Entrega rapida y calidad consistente.", "approved")
    _review(db, tenant.id, products[1].id, 4, "Buena compra", True, "Buen margen para canal publico.", "approved")
    _review(db, tenant.id, products[2].id, 3, "Pendiente", False, "Comentario distribuidor pendiente por validar politicas comerciales.", "pending")
    _dist_profile(db, tenant.id, f"Distribuidor {tenant.slug} Norte", f"dist@{tenant.slug}.demo", True)
    _dist_employee(db, tenant.id, f"dist@{tenant.slug}.demo", f"Ejecutivo {tenant.slug} Norte", f"ejecutivo@{tenant.slug}.demo", "Ejecutivo de cuenta")
    _dist_app(db, tenant.id, f"Canal {tenant.slug} Centro", f"solicitud@{tenant.slug}.demo")
    op = _order(db, tenant.id, ca.id, f"{tenant.slug}-ord-paid", 1720, 150, 1570, 39.25 if tenant.slug == "natura-vida" else 0, 1530.75 if tenant.slug == "natura-vida" else 1570, "paid", "plan2" if tenant.slug == "natura-vida" else "plan1")
    _order_item(db, op.id, product_id=products[0].id, unit=320, qty=2)
    _order_item(db, op.id, product_id=products[4].id, unit=560, qty=1)
    if tenant.slug == "natura-vida":
        _commission(db, op.id, "LOW_2_5", 0.025, 16)
        _commission(db, op.id, "LOW_2_5", 0.025, 23.25)
    of = _order(db, tenant.id, cb.id, f"{tenant.slug}-ord-failed", 980, 0, 980, 0, 980, "failed", "plan1")
    _order_item(db, of.id, product_id=products[6].id, unit=980, qty=1)
    rs = _recurring(db, tenant.id, ca.id)
    _recurring_item(db, rs.id, products[0].id, 1, 320)
    _logistics(db, tenant.id, op.id, ca.id, "delivered")
    _logistics(db, tenant.id, of.id, cb.id, "failed")


def _seed_subscriptions(db: Session, tenants: list[Tenant], plans: dict[str, Plan]) -> None:
    for slug, plan_code, status in [
        ("reinpia", "PLAN_1", "active"),
        ("natura-vida", "PLAN_2", "active"),
        ("cafe-monte-alto", "PLAN_1", "trial"),
        ("instituto-zaro-latino", "PLAN_1", "active"),
        ("demo-inactivo", "PLAN_1", "cancelled"),
    ]:
        t = next(x for x in tenants if x.slug == slug)
        s = db.scalar(select(Subscription).where(Subscription.tenant_id == t.id))
        if not s:
            db.add(Subscription(tenant_id=t.id, plan_id=plans[plan_code].id, status=status, started_at=datetime.utcnow() - timedelta(days=45), ends_at=None if status != "cancelled" else datetime.utcnow() - timedelta(days=1)))
        else:
            s.plan_id, s.status = plans[plan_code].id, status


def _seed_users(db: Session, tenants: list[Tenant]) -> None:
    tenant_map = {t.slug: t.id for t in tenants}
    users = [
        ("admin@reinpia.demo", "REINPIA Global Admin", "reinpia_admin", None),
        ("superadmin@comercia.demo", "ComerCia Super Admin", "reinpia_admin", None),
        ("comercial.global@comercia.demo", "ComerCia Operador Comercial", "reinpia_admin", None),
        ("logistica.global@comercia.demo", "ComerCia Operador Logistica", "reinpia_admin", None),
        ("marketing.global@comercia.demo", "ComerCia Operador Marketing", "reinpia_admin", None),
        ("admin@reinpia-tenant.demo", "REINPIA Tenant Admin", "tenant_admin", tenant_map["reinpia"]),
        ("admin.marca@reinpia.demo", "REINPIA Admin Marca", "tenant_admin", tenant_map["reinpia"]),
        ("catalogo.marca@reinpia.demo", "REINPIA Operador Catalogo", "tenant_staff", tenant_map["reinpia"]),
        ("logistica.marca@reinpia.demo", "REINPIA Operador Logistica", "tenant_staff", tenant_map["reinpia"]),
        ("pos.marca@reinpia.demo", "REINPIA Operador POS", "tenant_staff", tenant_map["reinpia"]),
        ("admin@natura.demo", "NATURA VIDA Admin", "tenant_admin", tenant_map["natura-vida"]),
        ("admin@cafe.demo", "CAFE MONTE ALTO Admin", "tenant_admin", tenant_map["cafe-monte-alto"]),
        ("admin@zaro.demo", "Instituto Zaro Latino Admin", "tenant_admin", tenant_map["instituto-zaro-latino"]),
        ("distributor1@natura.demo", "Distribuidor NATURA", "distributor_user", tenant_map["natura-vida"]),
        ("distributor2@cafe.demo", "Distribuidor CAFE", "distributor_user", tenant_map["cafe-monte-alto"]),
        ("admin@distribuidor.demo", "Admin Distribuidor Demo", "distributor_user", tenant_map["natura-vida"]),
        ("vendedor@distribuidor.demo", "Vendedor Distribuidor Demo", "distributor_user", tenant_map["natura-vida"]),
        ("cliente.final@publico.demo", "Cliente Final Demo", "public_customer", tenant_map["reinpia"]),
    ]
    for email, name, role, tenant_id in users:
        default_password = "Demo1234!" if email == "superadmin@comercia.demo" else "Admin12345!"
        hashed_password = pwd_context.hash(default_password, scheme="pbkdf2_sha256")
        u = db.scalar(select(User).where(User.email == email))
        if not u:
            db.add(
                User(
                    email=email,
                    full_name=name,
                    hashed_password=hashed_password,
                    role=role,
                    is_active=True,
                    tenant_id=tenant_id,
                    preferred_language="es",
                )
            )
        else:
            u.full_name, u.role, u.tenant_id, u.is_active = name, role, tenant_id, True
            u.preferred_language = "es"
            if email == "superadmin@comercia.demo":
                u.hashed_password = hashed_password


def _seed_additional_logistics_services(db: Session, tenants: list[Tenant]) -> None:
    reinpia = next((item for item in tenants if item.slug == "reinpia"), None)
    natura = next((item for item in tenants if item.slug == "natura-vida"), None)
    if not reinpia or not natura:
        return
    rows = [
        {
            "tenant_id": reinpia.id,
            "service_type": "ambos",
            "origin": "CDMX Centro",
            "destination": "Naucalpan",
            "kilometers": Decimal("24"),
            "unit_cost": Decimal("28"),
            "subtotal": Decimal("672"),
            "iva": Decimal("107.52"),
            "total": Decimal("779.52"),
            "status": "facturable",
            "service_date": datetime.utcnow() - timedelta(days=3),
            "billing_summary": "Ruta de entrega semanal para marca REINPIA",
        },
        {
            "tenant_id": reinpia.id,
            "service_type": "recoleccion",
            "origin": "Tienda Roma Norte",
            "destination": "Bodega central REINPIA",
            "kilometers": Decimal("12"),
            "unit_cost": Decimal("30"),
            "subtotal": Decimal("360"),
            "iva": Decimal("57.60"),
            "total": Decimal("417.60"),
            "status": "pagado",
            "service_date": datetime.utcnow() - timedelta(days=2),
            "billing_summary": "Recoleccion puntual para consolidacion de pedidos",
        },
        {
            "tenant_id": natura.id,
            "service_type": "entrega",
            "origin": "Bodega Natura Vida",
            "destination": "Cliente final zona sur",
            "kilometers": Decimal("18"),
            "unit_cost": Decimal("26"),
            "subtotal": Decimal("468"),
            "iva": Decimal("74.88"),
            "total": Decimal("542.88"),
            "status": "facturable",
            "service_date": datetime.utcnow() - timedelta(days=4),
            "billing_summary": "Entrega directa de pedidos promocionales",
        },
        {
            "tenant_id": natura.id,
            "service_type": "resguardo",
            "origin": "Bodega norte",
            "destination": "Bodega norte",
            "kilometers": Decimal("0"),
            "unit_cost": Decimal("1450"),
            "subtotal": Decimal("1450"),
            "iva": Decimal("232"),
            "total": Decimal("1682"),
            "status": "pendiente_pago",
            "service_date": datetime.utcnow() - timedelta(days=1),
            "billing_summary": "Resguardo de inventario promocional por 1 semana",
        },
    ]
    for row in rows:
        exists = db.scalar(
            select(LogisticsAdditionalService).where(
                LogisticsAdditionalService.tenant_id == row["tenant_id"],
                LogisticsAdditionalService.service_type == row["service_type"],
                LogisticsAdditionalService.origin == row["origin"],
                LogisticsAdditionalService.destination == row["destination"],
            )
        )
        if exists:
            continue
        db.add(
            LogisticsAdditionalService(
                tenant_id=row["tenant_id"],
                service_type=row["service_type"],
                origin=row["origin"],
                destination=row["destination"],
                kilometers=row["kilometers"],
                unit_cost=row["unit_cost"],
                subtotal=row["subtotal"],
                iva=row["iva"],
                total=row["total"],
                currency="MXN",
                observations="Servicio logistico adicional demo",
                status=row["status"],
                service_date=row["service_date"],
                billing_summary=row["billing_summary"],
            )
        )


def _seed_agents_and_leads(db: Session) -> None:
    for code, name, email in [("COD-REINPIA-1001", "Laura Mendoza", "laura@reinpia.demo"), ("COD-REINPIA-1002", "Carlos Ibarra", "carlos@reinpia.demo")]:
        a = db.scalar(select(SalesCommissionAgent).where(SalesCommissionAgent.code == code))
        if not a:
            db.add(SalesCommissionAgent(code=code, full_name=name, email=email, phone="+52 555 810 1000", is_active=True, commission_percentage=Decimal("30"), notes="Comisionista demo"))
    db.flush()
    if db.scalar(select(PlanPurchaseLead).where(PlanPurchaseLead.buyer_email == "ceo@reinpia.demo")):
        return
    register_plan_purchase_lead(db, "Vision Digital SA", "constituted_company", "Ana Lozano", "ceo@reinpia.demo", "+52 555 990 1001", "COMERCIA_ESCALA", referral_code="COD-REINPIA-1001", source_type="query_param", needs_followup=False, needs_appointment=False, purchase_status="paid", notes="Venta comisionada demo")
    register_plan_purchase_lead(db, "Opera Plus", "actividad_empresarial", "Diego Salas", "ventas@reinpia.demo", "+52 555 990 1002", "COMERCIA_IMPULSA", referral_code=None, source_type="direct", needs_followup=False, needs_appointment=False, purchase_status="initiated", notes="Venta directa demo")
    register_plan_purchase_lead(db, "Canal Norte", "constituted_company", "Lucia Fuentes", "contacto@reinpia.demo", "+52 555 990 1003", "COMERCIA_IMPULSA", referral_code=None, source_type="direct", needs_followup=True, needs_appointment=True, purchase_status="pending_contact", notes="Lead con seguimiento pendiente demo")


def _branding(db: Session, tenant_id: int, p: str, s: str, logo: str, title: str) -> None:
    b = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id)) or TenantBranding(tenant_id=tenant_id)
    b.primary_color, b.secondary_color, b.logo_url, b.hero_title, b.hero_subtitle, b.contact_email, b.contact_whatsapp, b.font_family = p, s, logo, title, "Storefront demo multi-tenant", f"ventas{tenant_id}@demo.com", "+52 555 000 0000", "Segoe UI"
    db.add(b)


def _storefront(db: Session, tenant_id: int, promo: str) -> StorefrontConfig:
    c = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id)) or StorefrontConfig(tenant_id=tenant_id, is_initialized=True, ecommerce_enabled=True, landing_enabled=True)
    c.promotion_text = promo
    db.add(c)
    db.flush()
    return c


def _category(db: Session, tenant_id: int, name: str, slug: str) -> Category:
    c = db.scalar(select(Category).where(Category.tenant_id == tenant_id, Category.slug == slug)) or Category(tenant_id=tenant_id, name=name, slug=slug, description=f"{name} demo", is_active=True)
    c.name, c.is_active = name, True
    db.add(c); db.flush(); return c


def _service(db: Session, tenant_id: int, cat_id: int, name: str, slug: str, price: float) -> ServiceOffering:
    s = db.scalar(select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id, ServiceOffering.slug == slug)) or ServiceOffering(tenant_id=tenant_id, category_id=cat_id, name=name, slug=slug, description=f"{name} demo", duration_minutes=90, price=Decimal(str(price)), is_active=True, is_featured=True, requires_schedule=True)
    s.category_id, s.name, s.price, s.is_active = cat_id, name, Decimal(str(price)), True
    db.add(s); db.flush(); return s


def _product(db: Session, tenant_id: int, cat_id: int, name: str, slug: str, price: float, featured: bool) -> Product:
    p = db.scalar(select(Product).where(Product.tenant_id == tenant_id, Product.slug == slug)) or Product(tenant_id=tenant_id, category_id=cat_id, name=name, slug=slug, description=f"{name} demo", price_public=Decimal(str(price)), price_wholesale=Decimal(str(price))*Decimal("0.85"), price_retail=Decimal(str(price))*Decimal("0.93"), is_featured=featured, is_active=True)
    p.category_id, p.name, p.price_public, p.price_wholesale, p.price_retail, p.is_featured, p.is_active = cat_id, name, Decimal(str(price)), (Decimal(str(price))*Decimal("0.85")).quantize(Decimal("0.01")), (Decimal(str(price))*Decimal("0.93")).quantize(Decimal("0.01")), featured, True
    seed_key = f"{tenant_id}-{slug}".replace("_", "-")
    p.stripe_product_id = f"prod_demo_{seed_key}"
    p.stripe_price_id_public = f"price_demo_public_{seed_key}"
    p.stripe_price_id_retail = f"price_demo_retail_{seed_key}"
    p.stripe_price_id_wholesale = f"price_demo_wholesale_{seed_key}"
    db.add(p); db.flush(); return p


def _banner(db: Session, tenant_id: int, cfg_id: int, title: str, position: str, value: str) -> None:
    b = db.scalar(select(Banner).where(Banner.tenant_id == tenant_id, Banner.title == title, Banner.position == position)) or Banner(tenant_id=tenant_id, storefront_config_id=cfg_id, title=title, subtitle="Demo comercial", image_url=None, target_type="promotion", target_value=value, position=position, priority=1, is_active=True)
    b.storefront_config_id, b.target_value, b.is_active = cfg_id, value, True
    db.add(b)


def _coupon(db: Session, tenant_id: int, code: str, kind: str, value: float) -> None:
    c = db.scalar(select(Coupon).where(Coupon.tenant_id == tenant_id, Coupon.code == code)) or Coupon(tenant_id=tenant_id, code=code, description="Coupon demo", discount_type=kind, discount_value=Decimal(str(value)), min_order_amount=Decimal("300"), max_uses=200, used_count=0, applies_to="all", is_active=True)
    c.discount_type, c.discount_value, c.is_active = kind, Decimal(str(value)), True
    db.add(c)


def _loyalty(db: Session, tenant_id: int, name: str) -> LoyaltyProgram:
    l = db.scalar(select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id)) or LoyaltyProgram(tenant_id=tenant_id, name=name, is_active=True, points_enabled=True, points_conversion_rate=Decimal("1.2"), welcome_points=120, birthday_points=80)
    l.name, l.is_active = name, True
    db.add(l); db.flush(); return l


def _membership(db: Session, tenant_id: int, name: str, days: int, price: float) -> None:
    m = db.scalar(select(MembershipPlan).where(MembershipPlan.tenant_id == tenant_id, MembershipPlan.name == name)) or MembershipPlan(tenant_id=tenant_id, name=name, description="Plan demo", duration_days=days, price=Decimal(str(price)), points_multiplier=Decimal("1.5"), benefits_json='{"shipping":"preferente"}', is_active=True)
    m.duration_days, m.price, m.is_active = days, Decimal(str(price)), True
    db.add(m)


def _customer(db: Session, tenant_id: int, name: str, email: str) -> Customer:
    c = db.scalar(select(Customer).where(Customer.tenant_id == tenant_id, Customer.email == email)) or Customer(tenant_id=tenant_id, full_name=name, email=email, phone="+52 555 000 0000", loyalty_points=0)
    c.full_name = name
    db.add(c); db.flush(); return c


def _loyalty_account(db: Session, tenant_id: int, lp_id: int, cust_id: int, points: int) -> None:
    a = db.scalar(select(CustomerLoyaltyAccount).where(CustomerLoyaltyAccount.tenant_id == tenant_id, CustomerLoyaltyAccount.customer_id == cust_id)) or CustomerLoyaltyAccount(tenant_id=tenant_id, customer_id=cust_id, loyalty_program_id=lp_id, points_balance=points)
    a.loyalty_program_id, a.points_balance = lp_id, points
    db.add(a)


def _review(db: Session, tenant_id: int, product_id: int, rating: int, title: str, ok: bool, comment: str | None = None, status: str | None = None) -> None:
    r = db.scalar(select(ProductReview).where(ProductReview.tenant_id == tenant_id, ProductReview.product_id == product_id, ProductReview.title == title)) or ProductReview(tenant_id=tenant_id, product_id=product_id, customer_id=None, rating=rating, title=title, comment=comment or "Review demo", is_approved=ok, moderation_status=status or ("approved" if ok else "pending"))
    r.rating, r.is_approved = rating, ok
    r.comment = comment or r.comment
    r.moderation_status = status or ("approved" if ok else "pending")
    db.add(r)


def _dist_profile(db: Session, tenant_id: int, business: str, email: str, authorized: bool) -> None:
    d = db.scalar(select(DistributorProfile).where(DistributorProfile.tenant_id == tenant_id, DistributorProfile.email == email)) or DistributorProfile(tenant_id=tenant_id, business_name=business, contact_name=business, email=email, phone="+52 555 777 0000", is_authorized=authorized, authorization_date=datetime.utcnow() if authorized else None, can_purchase_wholesale=True, can_sell_as_franchise=False)
    d.business_name, d.is_authorized, d.authorization_date = business, authorized, datetime.utcnow() if authorized else None
    db.add(d)


def _dist_employee(db: Session, tenant_id: int, profile_email: str, full_name: str, email: str, role_name: str) -> None:
    profile = db.scalar(select(DistributorProfile).where(DistributorProfile.tenant_id == tenant_id, DistributorProfile.email == profile_email))
    if not profile:
        return
    employee = db.scalar(
        select(DistributorEmployee).where(
            DistributorEmployee.tenant_id == tenant_id,
            DistributorEmployee.distributor_profile_id == profile.id,
            DistributorEmployee.email == email,
        )
    )
    if not employee:
        employee = DistributorEmployee(
            tenant_id=tenant_id,
            distributor_profile_id=profile.id,
            full_name=full_name,
            email=email,
            phone="+52 555 123 4567",
            role_name=role_name,
            is_active=True,
        )
    else:
        employee.full_name = full_name
        employee.role_name = role_name
        employee.is_active = True
    db.add(employee)


def _dist_app(db: Session, tenant_id: int, company: str, email: str) -> None:
    d = db.scalar(select(DistributorApplication).where(DistributorApplication.tenant_id == tenant_id, DistributorApplication.email == email)) or DistributorApplication(tenant_id=tenant_id, company_name=company, contact_name=company, email=email, phone="+52 555 666 0000", city="CDMX", state="CDMX", country="Mexico", status="pending", notes="Solicitud demo")
    d.status = "pending"
    db.add(d)


def _appointment(
    db: Session,
    tenant_id: int,
    customer_id: int,
    service_id: int,
    status: str,
    *,
    is_gift: bool = False,
    gift_sender_name: str | None = None,
    gift_sender_email: str | None = None,
    gift_is_anonymous: bool = False,
    gift_message: str | None = None,
    gift_recipient_name: str | None = None,
    gift_recipient_email: str | None = None,
    gift_recipient_phone: str | None = None,
    instructions_sent: bool = False,
    confirmation_received: bool = False,
    notes_suffix: str = "base",
) -> None:
    key = f"{tenant_id}-{customer_id}-{service_id}-{status}-{notes_suffix}"
    scheduled_at = datetime.utcnow() + timedelta(days=2)
    a = db.scalar(select(Appointment).where(Appointment.notes == key)) or Appointment(
        tenant_id=tenant_id,
        customer_id=customer_id,
        service_offering_id=service_id,
        scheduled_for=scheduled_at,
        service_name="Servicio demo",
        starts_at=scheduled_at,
        ends_at=scheduled_at + timedelta(minutes=90),
        status=status,
        is_gift=is_gift,
        notes=key,
    )
    a.status = status
    a.is_gift = is_gift
    a.gift_sender_name = gift_sender_name
    a.gift_sender_email = gift_sender_email
    a.gift_is_anonymous = gift_is_anonymous
    a.gift_message = gift_message
    a.gift_recipient_name = gift_recipient_name
    a.gift_recipient_email = gift_recipient_email
    a.gift_recipient_phone = gift_recipient_phone
    a.instructions_sent_at = datetime.utcnow() if instructions_sent else None
    a.confirmation_received_at = datetime.utcnow() if confirmation_received else None
    db.add(a)


def _order(db: Session, tenant_id: int, customer_id: int, key: str, subtotal: float, discount: float, total: float, commission: float, net: float, status: str, mode: str) -> Order:
    o = db.scalar(select(Order).where(Order.service_payload_json == key)) or Order(tenant_id=tenant_id, customer_id=customer_id, subtotal_amount=Decimal(str(subtotal)), discount_amount=Decimal(str(discount)), total_amount=Decimal(str(total)), commission_amount=Decimal(str(commission)), net_amount=Decimal(str(net)), currency="mxn", status=status, payment_mode=mode, service_payload_json=key)
    o.subtotal_amount, o.discount_amount, o.total_amount, o.commission_amount, o.net_amount, o.status, o.payment_mode = Decimal(str(subtotal)), Decimal(str(discount)), Decimal(str(total)), Decimal(str(commission)), Decimal(str(net)), status, mode
    db.add(o); db.flush(); return o


def _order_item(db: Session, order_id: int, product_id: int | None = None, service_id: int | None = None, unit: float = 0, qty: int = 1) -> None:
    q = select(OrderItem).where(OrderItem.order_id == order_id)
    q = q.where(OrderItem.product_id == product_id) if product_id else q.where(OrderItem.service_offering_id == service_id)
    i = db.scalar(q) or OrderItem(order_id=order_id, product_id=product_id, service_offering_id=service_id, quantity=qty, unit_price=Decimal(str(unit)), total_price=Decimal(str(unit)) * qty)
    i.quantity, i.unit_price, i.total_price = qty, Decimal(str(unit)), (Decimal(str(unit)) * qty).quantize(Decimal("0.01"))
    db.add(i)


def _commission(db: Session, order_id: int, rule: str, pct: float, amount: float) -> None:
    c = db.scalar(select(CommissionDetail).where(CommissionDetail.order_id == order_id, CommissionDetail.rule_applied == rule, CommissionDetail.amount == Decimal(str(amount))))
    if c:
        return
    db.add(CommissionDetail(order_id=order_id, rule_applied=rule, percentage=Decimal(str(pct)), amount=Decimal(str(amount))))


def _recurring(db: Session, tenant_id: int, customer_id: int) -> RecurringOrderSchedule:
    r = db.scalar(select(RecurringOrderSchedule).where(RecurringOrderSchedule.tenant_id == tenant_id, RecurringOrderSchedule.customer_id == customer_id)) or RecurringOrderSchedule(tenant_id=tenant_id, customer_id=customer_id, frequency="monthly", next_run_at=datetime.utcnow() + timedelta(days=30), is_active=True, notes="Schedule demo")
    r.is_active = True
    db.add(r); db.flush(); return r


def _recurring_item(db: Session, schedule_id: int, product_id: int, qty: int, unit: float) -> None:
    i = db.scalar(select(RecurringOrderItem).where(RecurringOrderItem.recurring_order_schedule_id == schedule_id, RecurringOrderItem.product_id == product_id)) or RecurringOrderItem(recurring_order_schedule_id=schedule_id, product_id=product_id, quantity=qty, unit_price_snapshot=Decimal(str(unit)))
    i.quantity, i.unit_price_snapshot = qty, Decimal(str(unit))
    db.add(i)


def _logistics(db: Session, tenant_id: int, order_id: int, customer_id: int, status: str) -> None:
    l = db.scalar(select(LogisticsOrder).where(LogisticsOrder.tenant_id == tenant_id, LogisticsOrder.order_id == order_id)) or LogisticsOrder(tenant_id=tenant_id, order_id=order_id, customer_id=customer_id, delivery_type="public", status=status, warehouse_address="Bodega demo", delivery_address="Direccion demo", scheduled_delivery_at=datetime.utcnow() + timedelta(days=2), delivered_at=datetime.utcnow() if status == "delivered" else None, tracking_reference=f"TRK-{tenant_id}-{order_id}", courier_name="Courier Demo", delivery_notes="Envio demo")
    l.status = status
    db.add(l); db.flush()
    if not db.scalar(select(LogisticsEvent).where(LogisticsEvent.logistics_order_id == l.id, LogisticsEvent.event_type == status)):
        db.add(LogisticsEvent(logistics_order_id=l.id, event_type=status, notes="Evento demo"))


def _wishlist(db: Session, tenant_id: int, customer_id: int, product_id: int) -> None:
    if db.scalar(select(WishlistItem).where(WishlistItem.tenant_id == tenant_id, WishlistItem.customer_id == customer_id, WishlistItem.product_id == product_id)):
        return
    db.add(WishlistItem(tenant_id=tenant_id, customer_id=customer_id, product_id=product_id))


def _seed_currency_settings(db: Session, tenants: list[Tenant]) -> None:
    for tenant in tenants:
        if tenant.slug == "demo-inactivo":
            continue
        enabled = ["MXN", "USD", "EUR"] if tenant.slug in {"reinpia", "natura-vida"} else ["MXN", "USD"]
        upsert_currency_settings(
            db,
            tenant.id,
            base_currency="MXN",
            enabled_currencies=enabled,
            display_mode="converted_display",
            exchange_mode="manual",
            auto_update_enabled=False,
            rounding_mode=".99" if tenant.slug == "natura-vida" else "none",
        )
    if not db.scalar(select(ExchangeRate).where(ExchangeRate.base_currency == "MXN", ExchangeRate.target_currency == "USD")):
        create_manual_exchange_rate(db, "MXN", "USD", Decimal("0.058"), "demo_manual")
    if not db.scalar(select(ExchangeRate).where(ExchangeRate.base_currency == "MXN", ExchangeRate.target_currency == "EUR")):
        create_manual_exchange_rate(db, "MXN", "EUR", Decimal("0.053"), "demo_manual")
    if not db.scalar(select(ExchangeRate).where(ExchangeRate.base_currency == "USD", ExchangeRate.target_currency == "MXN")):
        create_manual_exchange_rate(db, "USD", "MXN", Decimal("17.2"), "demo_manual")


def _seed_pos_data(db: Session, tenants: list[Tenant]) -> None:
    for tenant in tenants:
        if tenant.slug == "demo-inactivo":
            continue
        location = db.scalar(select(PosLocation).where(PosLocation.tenant_id == tenant.id, PosLocation.code == "MAIN"))
        if not location:
            location = PosLocation(
                tenant_id=tenant.id,
                name=f"Punto principal {tenant.name}",
                code="MAIN",
                location_type="brand_store",
                address="Direccion demo principal",
                is_active=True,
            )
            db.add(location)
            db.flush()
        employee = db.scalar(select(PosEmployee).where(PosEmployee.tenant_id == tenant.id, PosEmployee.email == f"pos@{tenant.slug}.demo"))
        if not employee:
            employee = PosEmployee(
                tenant_id=tenant.id,
                pos_location_id=location.id,
                distributor_profile_id=None,
                full_name=f"Cajero {tenant.slug}",
                email=f"pos@{tenant.slug}.demo",
                phone="+52 555 888 0000",
                role_name="cashier",
                is_active=True,
            )
            db.add(employee)
            db.flush()
        customer = db.scalar(select(Customer).where(Customer.tenant_id == tenant.id))
        product = db.scalar(select(Product).where(Product.tenant_id == tenant.id))
        if not customer or not product:
            continue
        sale = db.scalar(select(PosSale).where(PosSale.tenant_id == tenant.id, PosSale.notes == "demo-pos-sale"))
        if not sale:
            sale = PosSale(
                tenant_id=tenant.id,
                pos_location_id=location.id,
                customer_id=customer.id,
                employee_id=employee.id,
                subtotal_amount=Decimal("640"),
                discount_amount=Decimal("40"),
                total_amount=Decimal("600"),
                currency="MXN",
                payment_method="mercado_pago_qr",
                notes="demo-pos-sale",
            )
            db.add(sale)
            db.flush()
        if not db.scalar(select(PosSaleItem).where(PosSaleItem.pos_sale_id == sale.id, PosSaleItem.product_id == product.id)):
            db.add(
                PosSaleItem(
                    pos_sale_id=sale.id,
                    product_id=product.id,
                    quantity=2,
                    unit_price=Decimal("320"),
                    total_price=Decimal("640"),
                )
            )
        tx = db.scalar(
            select(PosPaymentTransaction).where(
                PosPaymentTransaction.tenant_id == tenant.id,
                PosPaymentTransaction.external_reference == f"MP-DEMO-{tenant.slug.upper()}",
            )
        )
        if not tx:
            db.add(
                PosPaymentTransaction(
                    tenant_id=tenant.id,
                    pos_sale_id=sale.id,
                    pos_location_id=location.id,
                    customer_id=customer.id,
                    employee_id=employee.id,
                    payment_provider="mercadopago",
                    payment_method="mercado_pago_qr",
                    status="paid",
                    external_reference=f"MP-DEMO-{tenant.slug.upper()}",
                    amount=Decimal("600"),
                    currency="MXN",
                    qr_payload='{"provider":"mercadopago","mode":"demo"}',
                    notes="demo-pos-payment",
                )
            )


def _seed_payment_settings(db: Session, tenants: list[Tenant]) -> None:
    for tenant in tenants:
        mp = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant.id))
        if not mp:
            mp = MercadoPagoSettings(tenant_id=tenant.id)
            db.add(mp)
            db.flush()
        mp.mercadopago_enabled = tenant.slug != "demo-inactivo"
        mp.mercadopago_public_key = f"APP_USR-DEMO-{tenant.slug.upper()}"
        mp.mercadopago_access_token = f"TEST-DEMO-{tenant.slug.upper()}"
        mp.mercadopago_qr_enabled = True
        mp.mercadopago_payment_link_enabled = True
        mp.mercadopago_point_enabled = tenant.slug in {"reinpia", "natura-vida"}
        mp.mercadopago_active_for_pos_only = True


def _seed_security_demo_data(db: Session, tenants: list[Tenant]) -> None:
    reinpia = next((t for t in tenants if t.slug == "reinpia"), None)
    if not reinpia:
        return
    base_events = [
        ("login_failed", "high", {"email": "bot@demo.invalid"}),
        ("excessive_failed_payments", "high", {"tenant_slug": "reinpia"}),
        ("coupon_abuse", "medium", {"code": "REINPIA10"}),
        ("referral_code_abuse", "high", {"code": "COD-FAKE-9999"}),
        ("webhook_verification_failed", "critical", {"reason": "signature_mismatch"}),
    ]
    for event_type, severity, payload in base_events:
        exists = db.scalar(
            select(SecurityEvent).where(
                SecurityEvent.tenant_id == reinpia.id,
                SecurityEvent.event_type == event_type,
                SecurityEvent.event_payload_json.like(f"%{list(payload.values())[0]}%"),
            )
        )
        if not exists:
            db.add(
                SecurityEvent(
                    tenant_id=reinpia.id,
                    user_id=None,
                    event_type=event_type,
                    source_ip="127.0.0.1",
                    user_agent="seed-demo",
                    severity=severity,
                    status="new",
                    event_payload_json=str(payload).replace("'", '"'),
                )
            )
    db.flush()
    first_event = db.scalar(select(SecurityEvent).where(SecurityEvent.tenant_id == reinpia.id).order_by(SecurityEvent.id.asc()))
    if first_event and not db.scalar(select(SecurityAlert).where(SecurityAlert.title == "Posible fraude en login DEMO")):
        db.add(
            SecurityAlert(
                tenant_id=reinpia.id,
                security_event_id=first_event.id,
                alert_type="possible_fraud_login",
                title="Posible fraude en login DEMO",
                message="Se detectaron intentos de login fallidos repetidos en ventana corta.",
                severity="high",
                is_read=False,
                assigned_to="seguridad@reinpia.demo",
            )
        )
    if first_event and not db.scalar(select(SecurityAlert).where(SecurityAlert.title == "Abuso de cupon DEMO")):
        db.add(
            SecurityAlert(
                tenant_id=reinpia.id,
                security_event_id=first_event.id,
                alert_type="coupon_abuse",
                title="Abuso de cupon DEMO",
                message="Uso sospechoso de cupon detectado en tenant REINPIA.",
                severity="medium",
                is_read=False,
                assigned_to="comercial@reinpia.demo",
            )
        )
    if first_event and not db.scalar(select(SecurityAlert).where(SecurityAlert.title == "Falla reiterada webhook DEMO")):
        db.add(
            SecurityAlert(
                tenant_id=reinpia.id,
                security_event_id=first_event.id,
                alert_type="webhook_verification_failed",
                title="Falla reiterada webhook DEMO",
                message="Se recomienda revision manual de firma de webhooks Stripe.",
                severity="critical",
                is_read=False,
                assigned_to="tech@reinpia.demo",
            )
        )
    if not db.scalar(
        select(SecurityRule).where(SecurityRule.code.in_(["LOGIN_FAIL_5_IN_10", "FAILED_PAYMENTS_3_IN_15"]))
    ):
        from app.services.security_rules_service import seed_default_security_rules

        seed_default_security_rules(db)
    if not db.scalar(select(SecurityEvent).where(SecurityEvent.event_type == "rate_limit_triggered")):
        db.add(
            SecurityEvent(
                tenant_id=reinpia.id,
                user_id=None,
                event_type="rate_limit_triggered",
                source_ip="127.0.0.1",
                user_agent="seed-demo",
                severity="medium",
                status="reviewed",
                event_payload_json='{"path":"/api/v1/comercia/referral/COD-FAKE-9999"}',
            )
        )
    block_entity(
        db,
        entity_type="ip",
        entity_key="203.0.113.50",
        reason="Entidad demo bloqueada por intentos de login.",
        blocked_until=None,
        auto_commit=False,
    )


def _seed_customer_contact_and_automation(db: Session, tenants: list[Tenant]) -> None:
    reinpia = next((t for t in tenants if t.slug == "reinpia"), None)
    if not reinpia:
        return

    leads_demo = [
        {
            "name": "Carlos Vela",
            "email": "carlos.vela@demo.com",
            "phone": "+52 5511110001",
            "company": "Grupo Vela",
            "contact_reason": "planes",
            "message": "Quiero evaluar IMPULSA para arrancar ecommerce y seguimiento comercial.",
            "channel": "contacto",
            "recommended_plan": "COMERCIA_IMPULSA",
            "status": "nuevo",
        },
        {
            "name": "Monica Reyes",
            "email": "monica.reyes@demo.com",
            "phone": "+52 5511110002",
            "company": "Reyes Distribucion",
            "contact_reason": "distribuidores",
            "message": "Necesito canal de distribuidores y reglas de volumen para mis revendedores.",
            "channel": "diagnostico",
            "recommended_plan": "COMERCIA_ESCALA",
            "status": "en_seguimiento",
        },
        {
            "name": "Diego Campos",
            "email": "diego.campos@demo.com",
            "phone": "+52 5511110003",
            "company": "Campos Retail",
            "contact_reason": "pos_pagos",
            "message": "Busco POS con cobros QR para sucursales y control por vendedor.",
            "channel": "lia_widget",
            "recommended_plan": "COMERCIA_ESCALA",
            "status": "agendado",
        },
        {
            "name": "Andrea Lozano",
            "email": "andrea.lozano@demo.com",
            "phone": "+52 5511110004",
            "company": "Lozano Lab",
            "contact_reason": "logistica",
            "message": "Tengo dudas sobre el servicio de recoleccion y resguardo para mi operacion.",
            "channel": "whatsapp",
            "recommended_plan": "COMERCIA_IMPULSA",
            "status": "contactado",
        },
        {
            "name": "Jorge Santillan",
            "email": "jorge.santillan@demo.com",
            "phone": "+52 5511110005",
            "company": "Santillan Co",
            "contact_reason": "ecommerce",
            "message": "Ya tengo landing, quiero montar ecommerce y activar campañas.",
            "channel": "contacto",
            "recommended_plan": "COMERCIA_ESCALA",
            "status": "cerrado_ganado",
        },
        {
            "name": "Paula Duarte",
            "email": "paula.duarte@demo.com",
            "phone": "+52 5511110006",
            "company": "Duarte Studio",
            "contact_reason": "soporte",
            "message": "Necesito asesoria para definir si conviene IMPULSA o ESCALA en mi etapa.",
            "channel": "diagnostico",
            "recommended_plan": "COMERCIA_IMPULSA",
            "status": "cerrado_perdido",
        },
    ]

    for row in leads_demo:
        exists = db.scalar(select(CustomerContactLead).where(CustomerContactLead.email == row["email"]))
        if not exists:
            db.add(CustomerContactLead(**row))
        else:
            for key, value in row.items():
                setattr(exists, key, value)
            db.add(exists)

    channels_demo = [
        ("whatsapp", True, "twilio_placeholder"),
        ("webchat", True, "internal_widget"),
    ]
    for channel, enabled, provider in channels_demo:
        row = db.scalar(select(BotChannelConfig).where(BotChannelConfig.channel == channel, BotChannelConfig.tenant_id == reinpia.id))
        if not row:
            row = BotChannelConfig(tenant_id=reinpia.id, channel=channel)
        row.is_enabled = enabled
        row.provider_name = provider
        row.config_json = '{"mode":"demo"}'
        db.add(row)

    templates_demo = [
        ("new_plan_lead", "whatsapp", "Nuevo lead detectado. Responde en menos de 15 minutos para elevar cierre."),
        ("followup_required", "whatsapp", "Lead en seguimiento pendiente. Programa contacto y confirma siguiente paso."),
        ("appointment_created", "whatsapp", "Tu diagnostico ya fue agendado. Te compartimos fecha, hora y ubicacion."),
        ("lead_interested_plan", "whatsapp", "Vemos interes en {{plan}}. Prepara propuesta y llamada de cierre."),
        ("logistics_question", "whatsapp", "Respondamos duda de logistica con propuesta de recoleccion/entrega."),
        ("ecommerce_question", "webchat", "Comparte demo de ecommerce y casos de crecimiento por canal."),
        ("pos_question", "webchat", "Explica POS, cobros QR y trazabilidad por vendedor para avanzar el cierre."),
    ]
    for event_type, channel, text in templates_demo:
        row = db.scalar(
            select(BotMessageTemplate).where(
                BotMessageTemplate.tenant_id == reinpia.id,
                BotMessageTemplate.event_type == event_type,
                BotMessageTemplate.channel == channel,
            )
        )
        if not row:
            row = BotMessageTemplate(tenant_id=reinpia.id, event_type=event_type, channel=channel, template_text=text, is_active=True)
        row.template_text = text
        row.is_active = True
        db.add(row)

    events_demo = [
        ("new_plan_lead", "plan_purchase_lead", 1, '{"source":"lia_widget"}'),
        ("followup_required", "customer_contact_lead", 2, '{"channel":"contacto"}'),
        ("appointment_created", "appointment", 1, '{"context":"diagnostico"}'),
        ("lead_interested_plan", "customer_contact_lead", 3, '{"plan":"COMERCIA_ESCALA"}'),
        ("logistics_question", "customer_contact_lead", 4, '{"topic":"logistica"}'),
        ("ecommerce_question", "customer_contact_lead", 5, '{"topic":"ecommerce"}'),
        ("pos_question", "customer_contact_lead", 6, '{"topic":"pos"}'),
    ]
    for event_type, related_entity_type, related_entity_id, payload in events_demo:
        row = db.scalar(
            select(AutomationEventLog).where(
                AutomationEventLog.tenant_id == reinpia.id,
                AutomationEventLog.event_type == event_type,
                AutomationEventLog.related_entity_type == related_entity_type,
                AutomationEventLog.related_entity_id == related_entity_id,
            )
        )
        if not row:
            row = AutomationEventLog(
                tenant_id=reinpia.id,
                event_type=event_type,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
                payload_json=payload,
                created_at=datetime.utcnow(),
            )
        else:
            row.payload_json = payload
        db.add(row)


def _spread_demo_timestamps(db: Session, tenants: list[Tenant]) -> None:
    now = datetime.utcnow()
    for tenant in tenants:
        orders = db.scalars(select(Order).where(Order.tenant_id == tenant.id).order_by(Order.id.asc())).all()
        for idx, row in enumerate(orders):
            row.created_at = now - timedelta(days=idx * 17 + 2)
        customers = db.scalars(select(Customer).where(Customer.tenant_id == tenant.id).order_by(Customer.id.asc())).all()
        for idx, row in enumerate(customers):
            row.created_at = now - timedelta(days=idx * 13 + 1)
        apps = db.scalars(
            select(DistributorApplication).where(DistributorApplication.tenant_id == tenant.id).order_by(DistributorApplication.id.asc())
        ).all()
        for idx, row in enumerate(apps):
            row.created_at = now - timedelta(days=idx * 19 + 3)
        logistics = db.scalars(select(LogisticsOrder).where(LogisticsOrder.tenant_id == tenant.id).order_by(LogisticsOrder.id.asc())).all()
        for idx, row in enumerate(logistics):
            row.created_at = now - timedelta(days=idx * 11 + 1)
            if row.status == "delivered":
                row.delivered_at = row.created_at + timedelta(days=2)
        appointments = db.scalars(select(Appointment).where(Appointment.tenant_id == tenant.id).order_by(Appointment.id.asc())).all()
        for idx, row in enumerate(appointments):
            row.created_at = now - timedelta(days=idx * 9 + 4)
            row.scheduled_for = row.created_at + timedelta(days=3)


def run() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_demo_data(db)


if __name__ == "__main__":
    run()
