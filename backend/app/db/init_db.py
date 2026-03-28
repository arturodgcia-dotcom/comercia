from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.models import Base, Plan
from app.models.models import User
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        _seed_plans(db)
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
            notes="2.5% hasta 2000; 3.0% por encima de 2000.",
            is_active=True,
        ),
    ]
    for plan in defaults:
        if plan.code not in existing_codes:
            db.add(plan)
    db.commit()


def _seed_default_user(db: Session) -> None:
    admin = db.scalar(select(User).where(User.email == "admin@reinpia.com"))
    if admin:
        return

    db.add(
        User(
            email="admin@reinpia.com",
            full_name="REINPIA Admin",
            hashed_password=get_password_hash("admin123"),
            role="reinpia_admin",
            is_active=True,
            tenant_id=None,
        )
    )
    db.commit()
