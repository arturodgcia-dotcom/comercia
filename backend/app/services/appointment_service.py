from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.models import Appointment, ServiceOffering
from app.services.automation_service import log_automation_event
from app.services.notifications_service import send_email_notification, send_whatsapp_placeholder


def create_appointment_for_self(
    db: Session,
    *,
    tenant_id: int,
    customer_id: int | None,
    service_offering: ServiceOffering,
    scheduled_for: datetime,
    notes: str | None = None,
) -> Appointment:
    starts_at = scheduled_for
    ends_at = scheduled_for + timedelta(minutes=service_offering.duration_minutes)
    appointment = Appointment(
        tenant_id=tenant_id,
        customer_id=customer_id,
        service_offering_id=service_offering.id,
        scheduled_for=scheduled_for,
        service_name=service_offering.name,
        starts_at=starts_at,
        ends_at=ends_at,
        status="pending",
        is_gift=False,
        notes=notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    log_automation_event(
        db,
        event_type="appointment_created",
        tenant_id=tenant_id,
        related_entity_type="appointment",
        related_entity_id=appointment.id,
    )
    return appointment


def create_appointment_as_gift(
    db: Session,
    *,
    tenant_id: int,
    service_offering: ServiceOffering,
    scheduled_for: datetime,
    gift_sender_name: str | None,
    gift_sender_email: str | None,
    gift_is_anonymous: bool,
    gift_message: str | None,
    gift_recipient_name: str | None,
    gift_recipient_email: str | None,
    gift_recipient_phone: str | None,
    notes: str | None = None,
) -> Appointment:
    starts_at = scheduled_for
    ends_at = scheduled_for + timedelta(minutes=service_offering.duration_minutes)
    appointment = Appointment(
        tenant_id=tenant_id,
        customer_id=None,
        service_offering_id=service_offering.id,
        scheduled_for=scheduled_for,
        service_name=service_offering.name,
        starts_at=starts_at,
        ends_at=ends_at,
        status="pending",
        is_gift=True,
        gift_sender_name=gift_sender_name,
        gift_sender_email=gift_sender_email,
        gift_is_anonymous=gift_is_anonymous,
        gift_message=gift_message,
        gift_recipient_name=gift_recipient_name,
        gift_recipient_email=gift_recipient_email,
        gift_recipient_phone=gift_recipient_phone,
        notes=notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    log_automation_event(
        db,
        event_type="appointment_created",
        tenant_id=tenant_id,
        related_entity_type="appointment",
        related_entity_id=appointment.id,
    )
    return appointment


def send_appointment_instructions(appointment: Appointment) -> None:
    if appointment.gift_recipient_email:
        send_email_notification(
            appointment.gift_recipient_email,
            "Instrucciones de cita",
            f"Cita agendada para {appointment.scheduled_for}.",
        )
    elif appointment.gift_sender_email:
        send_email_notification(
            appointment.gift_sender_email,
            "Instrucciones de cita",
            f"Cita agendada para {appointment.scheduled_for}.",
        )
    send_whatsapp_placeholder(appointment.gift_recipient_phone, "Tu cita fue registrada.")
    appointment.instructions_sent_at = datetime.utcnow()


def mark_appointment_confirmation_received(appointment: Appointment) -> None:
    appointment.confirmation_received_at = datetime.utcnow()
