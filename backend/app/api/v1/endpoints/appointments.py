from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Appointment, ServiceOffering
from app.schemas.appointment import (
    AppointmentGiftCreate,
    AppointmentRead,
    AppointmentSelfCreate,
    AppointmentStatusUpdate,
)
from app.services.appointment_service import (
    create_appointment_as_gift,
    create_appointment_for_self,
    mark_appointment_confirmation_received,
    send_appointment_instructions,
)

router = APIRouter()


@router.post("/self", response_model=AppointmentRead)
def create_self(payload: AppointmentSelfCreate, db: Session = Depends(get_db)):
    service = db.get(ServiceOffering, payload.service_offering_id)
    if not service:
        raise HTTPException(status_code=404, detail="servicio no encontrado")
    appointment = create_appointment_for_self(
        db,
        tenant_id=payload.tenant_id,
        customer_id=payload.customer_id,
        service_offering=service,
        scheduled_for=payload.scheduled_for,
        notes=payload.notes,
    )
    send_appointment_instructions(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.post("/gift", response_model=AppointmentRead)
def create_gift(payload: AppointmentGiftCreate, db: Session = Depends(get_db)):
    service = db.get(ServiceOffering, payload.service_offering_id)
    if not service:
        raise HTTPException(status_code=404, detail="servicio no encontrado")
    appointment = create_appointment_as_gift(
        db,
        tenant_id=payload.tenant_id,
        service_offering=service,
        scheduled_for=payload.scheduled_for,
        gift_sender_name=payload.gift_sender_name,
        gift_sender_email=payload.gift_sender_email,
        gift_is_anonymous=payload.gift_is_anonymous,
        gift_message=payload.gift_message,
        gift_recipient_name=payload.gift_recipient_name,
        gift_recipient_email=payload.gift_recipient_email,
        gift_recipient_phone=payload.gift_recipient_phone,
        notes=payload.notes,
    )
    send_appointment_instructions(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/by-tenant/{tenant_id}", response_model=list[AppointmentRead])
def list_by_tenant(tenant_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(Appointment).where(Appointment.tenant_id == tenant_id).order_by(Appointment.id.desc())).all()


@router.put("/{appointment_id}/confirm-received", response_model=AppointmentRead)
def confirm_received(appointment_id: int, db: Session = Depends(get_db)):
    row = db.get(Appointment, appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail="cita no encontrada")
    mark_appointment_confirmation_received(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{appointment_id}/status", response_model=AppointmentRead)
def update_status(appointment_id: int, payload: AppointmentStatusUpdate, db: Session = Depends(get_db)):
    row = db.get(Appointment, appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail="cita no encontrada")
    row.status = payload.status
    db.commit()
    db.refresh(row)
    return row
