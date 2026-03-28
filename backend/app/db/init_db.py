from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.models import Banner, Base, Category, Plan, ServiceOffering, StorefrontConfig, Subscription, Tenant, TenantBranding
from app.models.models import User
from app.db.session import engine
from app.services.storefront_initializer import initialize_storefront

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        _seed_plans(db)
        _seed_reinpia_tenant(db)
        _assign_default_plan_for_tenants(db)
        _seed_default_user(db)


def _seed_plans(db: Session) -> None:
    existing_codes = {row[0] for row in db.execute(select(Plan.code)).all()}
    defaults = [
        Plan(
            code="PLAN_1",
            name="Plan 1",
            type="fixed",
            monthly_price=25000,
            monthly_price_after_month_2=45000,
            commission_low_rate=0,
            commission_high_rate=0,
            commission_threshold=0,
            commission_enabled=False,
            notes="Mes 1 y 2: 25000 + IVA. Mes 3+: 45000 + IVA.",
            is_active=True,
        ),
        Plan(
            code="PLAN_2",
            name="Plan 2",
            type="commission",
            monthly_price=0,
            monthly_price_after_month_2=0,
            commission_low_rate=0.025,
            commission_high_rate=0.03,
            commission_threshold=2000,
            commission_enabled=True,
            notes="2.5% hasta 2000; 3.0% por encima de 2000.",
            is_active=True,
        ),
    ]
    for plan in defaults:
        if plan.code not in existing_codes:
            db.add(plan)
        else:
            existing = db.scalar(select(Plan).where(Plan.code == plan.code))
            if existing:
                existing.type = plan.type
                existing.monthly_price = plan.monthly_price
                existing.monthly_price_after_month_2 = plan.monthly_price_after_month_2
                existing.commission_low_rate = plan.commission_low_rate
                existing.commission_high_rate = plan.commission_high_rate
                existing.commission_threshold = plan.commission_threshold
                existing.commission_enabled = plan.commission_enabled
                existing.notes = plan.notes
    db.commit()


def _assign_default_plan_for_tenants(db: Session) -> None:
    default_plan = db.scalar(select(Plan).where(Plan.code == "PLAN_1"))
    if not default_plan:
        return
    tenants = db.scalars(select(Tenant).where(Tenant.plan_id.is_(None))).all()
    for tenant in tenants:
        tenant.plan_id = default_plan.id
    db.commit()


def _seed_default_user(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == "admin@reinpia.com"))
    if admin:
        return

    db.add(
        User(
            email="admin@reinpia.com",
            full_name="REINPIA Admin",
            hashed_password=pwd_context.hash("admin123", scheme="pbkdf2_sha256"),
            role="reinpia_admin",
            is_active=True,
            tenant_id=None,
        )
    )
    db.commit()


def _seed_reinpia_tenant(db: Session) -> None:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == "reinpia"))
    plan_1 = db.scalar(select(Plan).where(Plan.code == "PLAN_1"))

    if not tenant:
        tenant = Tenant(
            name="REINPIA",
            slug="reinpia",
            subdomain="reinpia",
            business_type="services",
            is_active=True,
            plan_id=plan_1.id if plan_1 else None,
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    initialize_storefront(db, tenant)

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    if branding:
        branding.primary_color = "#0F3E5A"
        branding.secondary_color = "#E6F4FA"
        branding.hero_title = "Desarrollamos tecnologia que convierte procesos en crecimiento"
        branding.hero_subtitle = (
            "En REINPIA creamos plataformas, automatizaciones y sistemas con inteligencia artificial para empresas que quieren operar mejor, vender mas y escalar con estructura."
        )
        branding.contact_email = "contacto@reinpia.com"
        branding.contact_whatsapp = "+52 000 000 0000"
        branding.font_family = "Segoe UI"

    services_category = db.scalar(
        select(Category).where(Category.tenant_id == tenant.id, Category.slug == "servicios-tecnologicos")
    )
    if not services_category:
        services_category = Category(
            tenant_id=tenant.id,
            name="Servicios tecnologicos",
            slug="servicios-tecnologicos",
            description="Servicios de implementacion, renta de plataformas y automatizacion.",
            is_active=True,
        )
        db.add(services_category)
        db.flush()

    service_catalog = [
        ("implementacion-comercia", "Implementacion COMERCIA", 90, 14500),
        ("renta-plataforma-comercia", "Renta de plataforma COMERCIA", 60, 8900),
        ("automatizacion-comercial-ia", "Automatizacion comercial con IA", 90, 16800),
        ("implementacion-nervia", "Implementacion NERVIA", 90, 15200),
        ("implementacion-sprintpilot", "Implementacion SprintPilot", 90, 13800),
        ("desarrollo-a-la-medida", "Desarrollo a la medida", 120, 22000),
    ]
    for slug, name, duration, price in service_catalog:
        service = db.scalar(
            select(ServiceOffering).where(ServiceOffering.tenant_id == tenant.id, ServiceOffering.slug == slug)
        )
        if not service:
            db.add(
                ServiceOffering(
                    tenant_id=tenant.id,
                    category_id=services_category.id,
                    name=name,
                    slug=slug,
                    description=f"{name} orientado a resultado comercial y operativo.",
                    duration_minutes=duration,
                    price=price,
                    is_active=True,
                    is_featured=True,
                    requires_schedule=True,
                )
            )

    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
    if config:
        _seed_banner(
            db,
            tenant_id=tenant.id,
            storefront_config_id=config.id,
            title="Soluciones REINPIA para crecimiento comercial",
            position="hero",
            target_type="promotion",
            target_value="/store/reinpia/services",
        )
        _seed_banner(
            db,
            tenant_id=tenant.id,
            storefront_config_id=config.id,
            title="Canal agencias y distribuidores REINPIA",
            position="distributors_top",
            target_type="url",
            target_value="/store/reinpia/distribuidores/registro",
        )

    subscription = db.scalar(select(Subscription).where(Subscription.tenant_id == tenant.id, Subscription.status == "active"))
    if not subscription and tenant.plan_id:
        db.add(Subscription(tenant_id=tenant.id, plan_id=tenant.plan_id, status="active"))

    db.commit()


def _seed_banner(
    db: Session,
    tenant_id: int,
    storefront_config_id: int,
    title: str,
    position: str,
    target_type: str,
    target_value: str,
) -> None:
    exists = db.scalar(
        select(Banner).where(
            Banner.tenant_id == tenant_id,
            Banner.position == position,
            Banner.title == title,
        )
    )
    if exists:
        exists.target_type = target_type
        exists.target_value = target_value
        exists.is_active = True
        return

    db.add(
        Banner(
            tenant_id=tenant_id,
            storefront_config_id=storefront_config_id,
            title=title,
            subtitle="Campana principal REINPIA",
            image_url=None,
            target_type=target_type,
            target_value=target_value,
            position=position,
            priority=1,
            is_active=True,
        )
    )
