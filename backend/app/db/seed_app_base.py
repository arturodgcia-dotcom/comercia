from __future__ import annotations

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine
from app.models.models import Base, Plan, User

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")


def seed_app_base(db: Session) -> None:
    _seed_plans(db)
    _seed_system_user(db)
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
        )
    )


def run() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_app_base(db)


if __name__ == "__main__":
    run()
