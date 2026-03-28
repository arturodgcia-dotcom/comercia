from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import LogisticsOrder
from app.schemas.logistics import (
    LogisticsCreate,
    LogisticsEventRead,
    LogisticsRead,
    LogisticsRescheduleUpdate,
    LogisticsScheduleUpdate,
)
from app.services.logistics_service import (
    create_logistics_order,
    list_events,
    mark_delivered,
    reschedule_delivery,
    schedule_delivery,
)

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[LogisticsRead])
def list_logistics(tenant_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(LogisticsOrder).where(LogisticsOrder.tenant_id == tenant_id).order_by(LogisticsOrder.id.desc())).all()


@router.post("", response_model=LogisticsRead, status_code=status.HTTP_201_CREATED)
def create(payload: LogisticsCreate, db: Session = Depends(get_db)):
    return create_logistics_order(db, **payload.model_dump())


@router.put("/{logistics_id}/schedule", response_model=LogisticsRead)
def schedule(logistics_id: int, payload: LogisticsScheduleUpdate, db: Session = Depends(get_db)):
    row = db.get(LogisticsOrder, logistics_id)
    if not row:
        raise HTTPException(status_code=404, detail="logistics no encontrado")
    return schedule_delivery(db, row, **payload.model_dump())


@router.put("/{logistics_id}/reschedule", response_model=LogisticsRead)
def reschedule(logistics_id: int, payload: LogisticsRescheduleUpdate, db: Session = Depends(get_db)):
    row = db.get(LogisticsOrder, logistics_id)
    if not row:
        raise HTTPException(status_code=404, detail="logistics no encontrado")
    return reschedule_delivery(db, row, scheduled_delivery_at=payload.scheduled_delivery_at, notes=payload.notes)


@router.put("/{logistics_id}/mark-delivered", response_model=LogisticsRead)
def delivered(logistics_id: int, db: Session = Depends(get_db)):
    row = db.get(LogisticsOrder, logistics_id)
    if not row:
        raise HTTPException(status_code=404, detail="logistics no encontrado")
    return mark_delivered(db, row)


@router.get("/{logistics_id}/events", response_model=list[LogisticsEventRead])
def events(logistics_id: int, db: Session = Depends(get_db)):
    return list_events(db, logistics_id)
