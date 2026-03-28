from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import RecurringOrderItem, RecurringOrderSchedule


def compute_next_run(frequency: str, from_date: datetime) -> datetime:
    if frequency == "weekly":
        return from_date + timedelta(days=7)
    if frequency == "biweekly":
        return from_date + timedelta(days=14)
    return from_date + timedelta(days=30)


def create_schedule(db: Session, **values) -> RecurringOrderSchedule:
    schedule = RecurringOrderSchedule(**values)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def add_items_to_schedule(db: Session, schedule_id: int, items: list[dict]) -> list[RecurringOrderItem]:
    created: list[RecurringOrderItem] = []
    for item in items:
        row = RecurringOrderItem(recurring_order_schedule_id=schedule_id, **item)
        db.add(row)
        created.append(row)
    db.commit()
    return created


def list_schedules_by_tenant(db: Session, tenant_id: int) -> list[RecurringOrderSchedule]:
    return db.scalars(
        select(RecurringOrderSchedule).where(RecurringOrderSchedule.tenant_id == tenant_id).order_by(RecurringOrderSchedule.id.desc())
    ).all()
