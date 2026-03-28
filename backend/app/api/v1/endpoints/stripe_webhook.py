from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Order, StripeConfig
from app.services.email_service import send_purchase_receipt
from app.services.stripe_service import construct_webhook_event

router = APIRouter()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    event = _resolve_event(db, payload, sig_header)

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        order = _find_order_from_checkout_session(db, data_object)
        if order:
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
            send_purchase_receipt(order)
    elif event_type == "payment_intent.succeeded":
        order = _find_order_from_payment_intent(db, data_object)
        if order:
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
    elif event_type == "payment_intent.payment_failed":
        order = _find_order_from_payment_intent(db, data_object)
        if order:
            order.status = "failed"
            order.stripe_payment_intent_id = str(data_object.get("id") or "")
            db.commit()

    return {"received": True}


def _resolve_event(db: Session, payload: bytes, sig_header: str | None) -> dict:
    configs = db.scalars(select(StripeConfig).order_by(StripeConfig.id.desc())).all()
    for config in configs:
        try:
            return construct_webhook_event(payload, sig_header, config.webhook_secret)
        except Exception:
            continue
    try:
        return construct_webhook_event(payload, sig_header, None)
    except Exception as exc:
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
