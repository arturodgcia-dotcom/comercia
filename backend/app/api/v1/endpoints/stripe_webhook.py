import json
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Appointment, CommercialClientAccount, Coupon, Order, ServiceOffering, StripeConfig, Tenant
from app.services.coupon_service import increment_coupon_usage
from app.services.email_service import send_purchase_receipt
from app.services.loyalty_service import apply_points_for_order, consume_points
from app.services.notifications_service import send_email_notification, send_whatsapp_placeholder
from app.services.security_hooks import on_checkout_payment_failed, on_webhook_verification_failed
from app.services.stripe_service import construct_webhook_event
from app.services.automation_service import log_automation_event
from app.services.commercial_plan_service import apply_addon_to_tenant, apply_plan_to_tenant
from app.services.ai_credit_service import build_brand_credit_snapshot
from app.services.operational_alerts_service import sync_operational_alerts_for_tenant

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
        if _is_commercial_plan_session(data_object):
            _apply_commercial_plan_checkout(db, data_object)
            return {"received": True}
        if _is_commercial_addon_session(data_object):
            _apply_commercial_addon_checkout(db, data_object)
            return {"received": True}
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


def _is_commercial_plan_session(session_obj: dict) -> bool:
    metadata = session_obj.get("metadata", {})
    return str(metadata.get("kind") or "").strip().lower() == "tenant_commercial_plan"


def _is_commercial_addon_session(session_obj: dict) -> bool:
    metadata = session_obj.get("metadata", {})
    return str(metadata.get("kind") or "").strip().lower() == "tenant_commercial_addon"


def _apply_commercial_plan_checkout(db: Session, session_obj: dict) -> None:
    metadata = session_obj.get("metadata", {})
    tenant_id = metadata.get("tenant_id")
    plan_key = metadata.get("plan_key")
    if not tenant_id or not plan_key:
        return
    tenant = db.get(Tenant, int(tenant_id))
    if not tenant:
        return
    apply_plan_to_tenant(
        tenant,
        plan_key=str(plan_key),
        source="stripe_checkout",
        checkout_session_id=str(session_obj.get("id") or ""),
    )
    db.add(tenant)
    db.commit()


def _parse_addons_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _set_addon_counter(account: CommercialClientAccount, addon_code: str) -> None:
    addons = _parse_addons_json(account.addons_json)
    keys = [addon_code]
    if addon_code == "extra_500_ai_credits":
        keys.append("extra_500_tokens")
    current = 0
    for key in keys:
        try:
            current = max(current, int(addons.get(key, 0)))
        except Exception:
            continue
    next_qty = current + 1
    for key in keys:
        addons[key] = next_qty
    account.addons_json = json.dumps(addons, ensure_ascii=False)


def _apply_commercial_addon_checkout(db: Session, session_obj: dict) -> None:
    metadata = session_obj.get("metadata", {})
    tenant_id = metadata.get("tenant_id")
    addon_code = metadata.get("add_on_code") or metadata.get("item_code")
    if not tenant_id or not addon_code:
        return
    tenant = db.get(Tenant, int(tenant_id))
    if not tenant:
        return

    account_id = metadata.get("client_account_id")
    account: CommercialClientAccount | None = None
    if account_id:
        account = db.get(CommercialClientAccount, int(account_id))
    elif tenant.commercial_client_account_id:
        account = db.get(CommercialClientAccount, int(tenant.commercial_client_account_id))

    if account:
        addon = {"code": str(addon_code)}
    else:
        addon = apply_addon_to_tenant(tenant, addon_code=str(addon_code))
    if account:
        _set_addon_counter(account, str(addon_code))
        db.add(account)

    build_brand_credit_snapshot(db, tenant)
    sync_operational_alerts_for_tenant(db, tenant.id)
    log_automation_event(
        db,
        event_type="commercial_addon_checkout_applied",
        tenant_id=tenant.id,
        related_entity_type="stripe_checkout_session",
        related_entity_id=tenant.id,
        payload_json=json.dumps(
            {
                "session_id": str(session_obj.get("id") or ""),
                "addon_code": str(addon.get("code") or addon_code),
                "resource_origin": str(metadata.get("resource_origin") or ""),
                "ui_origin": str(metadata.get("ui_origin") or ""),
                "client_account_id": str(account.id) if account else "",
            },
            ensure_ascii=False,
        ),
        auto_commit=False,
    )
    db.add(tenant)
    db.commit()


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
