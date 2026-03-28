from __future__ import annotations

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models.models import Base, Plan, User
from app.services.automation_service import upsert_bot_channel, upsert_bot_template
from app.services.onboarding_service import ensure_default_onboarding_guides
from app.services.security_rules_service import seed_default_security_rules

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")


def seed_app_base(db: Session) -> None:
    _seed_plans(db)
    _seed_system_user(db)
    ensure_default_onboarding_guides(db)
    _seed_automation_base(db)
    seed_default_security_rules(db)
    db.commit()


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
            continue
        existing = db.scalar(select(Plan).where(Plan.code == plan.code))
        if not existing:
            continue
        existing.name = plan.name
        existing.type = plan.type
        existing.monthly_price = plan.monthly_price
        existing.monthly_price_after_month_2 = plan.monthly_price_after_month_2
        existing.commission_low_rate = plan.commission_low_rate
        existing.commission_high_rate = plan.commission_high_rate
        existing.commission_threshold = plan.commission_threshold
        existing.commission_enabled = plan.commission_enabled
        existing.notes = plan.notes
        existing.is_active = True


def _seed_system_user(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == "admin@reinpia.com"))
    if admin:
        admin.full_name = "REINPIA Admin"
        admin.role = "reinpia_admin"
        admin.is_active = True
        admin.preferred_language = "es"
        if not pwd_context.verify("admin123", admin.hashed_password):
            admin.hashed_password = pwd_context.hash("admin123", scheme="pbkdf2_sha256")
        return

    db.add(
        User(
            email="admin@reinpia.com",
            full_name="REINPIA Admin",
            hashed_password=pwd_context.hash("admin123", scheme="pbkdf2_sha256"),
            role="reinpia_admin",
            is_active=True,
            tenant_id=None,
            preferred_language="es",
        )
    )


def _seed_automation_base(db: Session) -> None:
    upsert_bot_channel(db, channel="whatsapp", tenant_id=None, is_enabled=False, provider_name="pending", auto_commit=False)
    upsert_bot_channel(db, channel="webchat", tenant_id=None, is_enabled=True, provider_name="internal", auto_commit=False)
    templates = {
        "new_plan_lead": "Nuevo lead registrado: {{buyer_name}} / {{selected_plan_code}}.",
        "appointment_created": "Nueva cita creada para seguimiento operativo.",
        "order_paid": "Nueva orden pagada detectada.",
        "logistics_delivered": "Entrega confirmada y cerrada.",
        "followup_required": "Lead requiere seguimiento comercial prioritario.",
    }
    for event_type, template_text in templates.items():
        upsert_bot_template(
            db,
            event_type=event_type,
            channel="whatsapp",
            template_text=template_text,
            tenant_id=None,
            is_active=True,
            auto_commit=False,
        )


def run(clean_demo: bool = True) -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if clean_demo:
            from app.db.reset_demo import reset_demo_data

            reset_demo_data(db)
        seed_app_base(db)


if __name__ == "__main__":
    run()
