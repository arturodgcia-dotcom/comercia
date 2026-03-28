from app.models.models import Order


def send_purchase_receipt(order: Order, to_email: str | None = None) -> None:
    recipient = to_email or "customer@example.com"
    # Base operativa: placeholder para conexión futura con proveedor SMTP/Sendgrid.
    print(
        "[EMAIL] receipt",
        {
            "to": recipient,
            "order_id": order.id,
            "items": [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "total_price": str(item.total_price),
                }
                for item in order.items
            ],
            "total_amount": str(order.total_amount),
            "commission_amount": str(order.commission_amount),
            "net_amount": str(order.net_amount),
            "status": order.status,
        },
    )
