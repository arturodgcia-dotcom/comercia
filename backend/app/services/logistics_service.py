from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import LogisticsEvent, LogisticsOrder
from app.services.automation_service import log_automation_event


def add_logistics_event(db: Session, logistics_order_id: int, event_type: str, notes: str | None = None) -> LogisticsEvent:
    event = LogisticsEvent(logistics_order_id=logistics_order_id, event_type=event_type, event_at=datetime.utcnow(), notes=notes)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def create_logistics_order(db: Session, **values) -> LogisticsOrder:
    row = LogisticsOrder(status="pending", **values)
    db.add(row)
    db.commit()
    db.refresh(row)
    add_logistics_event(db, row.id, "scheduled", "Orden logistica creada")
    return row


def schedule_delivery(db: Session, logistics_order: LogisticsOrder, scheduled_delivery_at: datetime, **updates) -> LogisticsOrder:
    logistics_order.scheduled_delivery_at = scheduled_delivery_at
    logistics_order.status = "scheduled"
    for key, value in updates.items():
        setattr(logistics_order, key, value)
    db.commit()
    db.refresh(logistics_order)
    add_logistics_event(db, logistics_order.id, "scheduled", "Entrega programada")
    return logistics_order


def reschedule_delivery(db: Session, logistics_order: LogisticsOrder, scheduled_delivery_at: datetime, notes: str | None = None) -> LogisticsOrder:
    logistics_order.scheduled_delivery_at = scheduled_delivery_at
    logistics_order.status = "rescheduled"
    db.commit()
    db.refresh(logistics_order)
    add_logistics_event(db, logistics_order.id, "rescheduled", notes)
    return logistics_order


def mark_delivered(db: Session, logistics_order: LogisticsOrder) -> LogisticsOrder:
    logistics_order.status = "delivered"
    logistics_order.delivered_at = datetime.utcnow()
    db.commit()
    db.refresh(logistics_order)
    add_logistics_event(db, logistics_order.id, "delivered", "Entrega confirmada")
    log_automation_event(
        db,
        event_type="logistics_delivered",
        tenant_id=logistics_order.tenant_id,
        related_entity_type="logistics_order",
        related_entity_id=logistics_order.id,
    )
    return logistics_order


def list_events(db: Session, logistics_order_id: int) -> list[LogisticsEvent]:
    return db.scalars(
        select(LogisticsEvent).where(LogisticsEvent.logistics_order_id == logistics_order_id).order_by(LogisticsEvent.id.asc())
    ).all()
