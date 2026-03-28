import json
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Appointment, Coupon, Order, ServiceOffering, StripeConfig
from app.services.coupon_service import increment_coupon_usage
from app.services.email_service import send_purchase_receipt
from app.services.loyalty_service import apply_points_for_order, consume_points
from app.services.notifications_service import send_email_notification, send_whatsapp_placeholder
from app.services.security_hooks import on_checkout_payment_failed, on_webhook_verification_failed
from app.services.stripe_service import construct_webhook_event
from app.services.automation_service import log_automation_event

router = APIRouter()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    source_ip = request.client.host if request.client else None
    event = _resolve_event(db, payload, sig_header, source_ip=source_ip)

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        order = _find_order_from_checkout_session(db, data_object)
        if order:
            was_paid = order.status == "paid"
            order.status = "paid"
            order.stripe_payment_intent_id = str(data_object.get("payment_intent") or "")
            if data_object.get("amount_total") is not None:
                paid_total = (
                    Decimal(int(data_object["amount_total"])) / Decimal("100")
                    if data_object["amount_total"]
                    else Decimal("0")
                )
                if paid_total > 0:
                    order.total_amount = paid_total
                    order.net_amount = paid_total - Decimal(order.commission_amount)
            db.commit()
            if not was_paid:
                _run_post_payment_actions(db, order)
                log_automation_event(
                    db,
                    event_type="order_paid",
                    tenant_id=order.tenant_id,
                    related_entity_type="order",
                    related_entity_id=order.id,
                )
            send_purchase_receipt(order)
    elif event_type == "payment_intent.succeeded":
        order = _find_order_from_payment_intent(db, data_object)
        if order:
            was_paid = order.status == "paid"
            order.status = "paid"
            order.stripe_payment_intent_id = str(data_object.get("id") or "")
            amount_received = data_object.get("amount_received")
            if amount_received is not None:
                order.total_amount = Decimal(int(amount_received)) / Decimal("100")
            application_fee = data_object.get("application_fee_amount")
            if application_fee is not None:
                order.commission_amount = Decimal(int(application_fee)) / Decimal("100")
            order.net_amount = Decimal(order.total_amount) - Decimal(order.commission_amount)
            db.commit()
            if not was_paid:
                _run_post_payment_actions(db, order)
                log_automation_event(
                    db,
                    event_type="order_paid",
                    tenant_id=order.tenant_id,
                    related_entity_type="order",
                    related_entity_id=order.id,
                )
    elif event_type == "payment_intent.payment_failed":
        order = _find_order_from_payment_intent(db, data_object)
        if order:
            order.status = "failed"
            order.stripe_payment_intent_id = str(data_object.get("id") or "")
            db.commit()
            on_checkout_payment_failed(db, tenant_id=order.tenant_id, source_ip=source_ip)

    return {"received": True}


def _resolve_event(db: Session, payload: bytes, sig_header: str | None, source_ip: str | None = None) -> dict:
    configs = db.scalars(select(StripeConfig).order_by(StripeConfig.id.desc())).all()
    for config in configs:
        try:
            return construct_webhook_event(payload, sig_header, config.webhook_secret)
        except Exception:
            continue
    try:
        return construct_webhook_event(payload, sig_header, None)
    except Exception as exc:
        on_webhook_verification_failed(db, source_ip=source_ip, reason="signature_mismatch")
        raise HTTPException(status_code=400, detail="evento webhook invalido") from exc


def _find_order_from_checkout_session(db: Session, session_obj: dict) -> Order | None:
    order_id = session_obj.get("client_reference_id") or session_obj.get("metadata", {}).get("order_id")
    if order_id:
        return db.get(Order, int(order_id))
    session_id = session_obj.get("id")
    if not session_id:
        return None
    return db.scalar(select(Order).where(Order.stripe_session_id == session_id))


def _find_order_from_payment_intent(db: Session, payment_intent_obj: dict) -> Order | None:
    order_id = payment_intent_obj.get("metadata", {}).get("order_id")
    if order_id:
        return db.get(Order, int(order_id))
    intent_id = payment_intent_obj.get("id")
    if not intent_id:
        return None
    return db.scalar(select(Order).where(Order.stripe_payment_intent_id == intent_id))


def _run_post_payment_actions(db: Session, order: Order) -> None:
    if order.customer_id:
        if order.loyalty_points_used > 0:
            consume_points(db, order.customer_id, order.tenant_id, order.loyalty_points_used)
        apply_points_for_order(db, order)
    if order.coupon_code:
        coupon = db.scalar(select(Coupon).where(Coupon.tenant_id == order.tenant_id, Coupon.code == order.coupon_code))
        if coupon:
            increment_coupon_usage(db, coupon.id)
    if order.has_service_items and order.service_payload_json:
        _create_appointments_from_order(db, order)


def _create_appointments_from_order(db: Session, order: Order) -> None:
    try:
        service_rows = json.loads(order.service_payload_json)
    except Exception:
        service_rows = []
    for row in service_rows:
        service = db.get(ServiceOffering, int(row.get("service_offering_id")))
        if not service:
            continue
        scheduled_for = order.appointment_scheduled_for or (datetime.utcnow() + timedelta(days=1))
        appointment = Appointment(
            tenant_id=order.tenant_id,
            customer_id=order.customer_id,
            service_offering_id=service.id,
            scheduled_for=scheduled_for,
            service_name=service.name,
            starts_at=scheduled_for,
            ends_at=scheduled_for + timedelta(minutes=service.duration_minutes),
            status="pending",
            is_gift=order.is_gift,
            gift_sender_name=order.gift_sender_name,
            gift_sender_email=order.gift_sender_email,
            gift_is_anonymous=order.gift_is_anonymous,
            gift_message=order.gift_message,
            gift_recipient_name=order.gift_recipient_name,
            gift_recipient_email=order.gift_recipient_email,
            gift_recipient_phone=order.gift_recipient_phone,
            notes=f"Creada desde orden {order.id}",
            instructions_sent_at=datetime.utcnow(),
        )
        db.add(appointment)
        recipient_email = order.gift_recipient_email or order.gift_sender_email
        if recipient_email:
            send_email_notification(recipient_email, "Instrucciones de servicio", f"Tu cita para {service.name} fue agendada.")
        send_whatsapp_placeholder(order.gift_recipient_phone, f"Servicio {service.name} registrado")
    db.commit()
