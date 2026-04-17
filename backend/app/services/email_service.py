from __future__ import annotations

from app.core.config import get_settings
from app.models.models import Order
from app.services.notifications_service import send_email_notification


def send_purchase_receipt(order: Order, to_email: str | None = None) -> None:
    settings = get_settings()
    recipient = (to_email or order.gift_recipient_email or order.gift_sender_email or "").strip()
    if not recipient:
        recipient = settings.support_from_email

    lines = [
        "Tu pago fue registrado correctamente.",
        f"Orden: {order.id}",
        f"Estatus: {order.status}",
        f"Total: ${order.total_amount}",
        f"Comision: ${order.commission_amount}",
        f"Neto: ${order.net_amount}",
    ]
    if order.items:
        lines.append("Items:")
        for item in order.items:
            lines.append(
                f"- producto={item.product_id} cantidad={item.quantity} unitario={item.unit_price} total={item.total_price}"
            )

    send_email_notification(
        to_email=recipient,
        subject=f"Pago confirmado · Orden {order.id}",
        body="\n".join(lines),
        from_email=settings.sales_from_email or settings.support_from_email,
        tags=["pago"],
    )
