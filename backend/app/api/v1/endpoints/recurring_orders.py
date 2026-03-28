from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import RecurringOrderSchedule
from app.schemas.recurring_orders import (
    RecurringOrderCreate,
    RecurringOrderItemCreate,
    RecurringOrderRead,
    RecurringOrderUpdate,
)
from app.services.recurring_orders_service import add_items_to_schedule, create_schedule, list_schedules_by_tenant

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[RecurringOrderRead])
def list_by_tenant(tenant_id: int, db: Session = Depends(get_db)):
    return list_schedules_by_tenant(db, tenant_id)


@router.post("", response_model=RecurringOrderRead, status_code=status.HTTP_201_CREATED)
def create(payload: RecurringOrderCreate, db: Session = Depends(get_db)):
    return create_schedule(db, **payload.model_dump())


@router.post("/{schedule_id}/items")
def add_items(schedule_id: int, payload: list[RecurringOrderItemCreate], db: Session = Depends(get_db)):
    schedule = db.get(RecurringOrderSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="schedule no encontrado")
    created = add_items_to_schedule(db, schedule_id=schedule_id, items=[item.model_dump() for item in payload])
    return {"schedule_id": schedule_id, "items_added": len(created)}


@router.put("/{schedule_id}", response_model=RecurringOrderRead)
def update(schedule_id: int, payload: RecurringOrderUpdate, db: Session = Depends(get_db)):
    schedule = db.get(RecurringOrderSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="schedule no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, key, value)
    db.commit()
    db.refresh(schedule)
    return schedule
