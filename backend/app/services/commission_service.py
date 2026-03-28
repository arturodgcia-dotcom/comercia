from decimal import Decimal, ROUND_HALF_UP

LOW_THRESHOLD = Decimal("2000")
LOW_RATE = Decimal("0.025")
HIGH_RATE = Decimal("0.03")


def compute_order_commission(order_items: list[dict]) -> dict:
    details: list[dict] = []
    total_commission = Decimal("0")

    for item in order_items:
        unit_price = Decimal(str(item["unit_price"]))
        quantity = int(item["quantity"])
        line_total = (unit_price * Decimal(quantity)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if unit_price <= LOW_THRESHOLD:
            percentage = LOW_RATE
            rule_applied = "LOW_2_5"
        else:
            percentage = HIGH_RATE
            rule_applied = "HIGH_3"

        line_commission = (line_total * percentage).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_commission += line_commission
        details.append(
            {
                "product_id": item.get("product_id"),
                "quantity": quantity,
                "unit_price": unit_price,
                "line_total": line_total,
                "rule_applied": rule_applied,
                "percentage": percentage,
                "amount": line_commission,
            }
        )

    return {
        "total_commission": total_commission.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "details": details,
    }
