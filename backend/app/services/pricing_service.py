from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


def _to_decimal(value: object, fallback: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(fallback)


def _choose_commission_rate(amount: Decimal, tiers: list[dict]) -> tuple[Decimal, str]:
    normalized_tiers = tiers if tiers else [{"up_to": None, "rate": "0", "label": "Regla"}]
    for tier in normalized_tiers:
        up_to = tier.get("up_to")
        rate = _to_decimal(tier.get("rate"), "0")
        label = str(tier.get("label") or "Regla")
        if up_to in (None, "", "null"):
            return rate, label
        if amount <= _to_decimal(up_to, "0"):
            return rate, label
    last = normalized_tiers[-1]
    return _to_decimal(last.get("rate"), "0"), str(last.get("label") or "Regla")


def calculate_totals(order: dict, plan_type: str, commission_rules: dict | None) -> dict:
    subtotal = _to_decimal(order.get("subtotal"), "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    discount = _to_decimal(order.get("discount"), "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    shipping = _to_decimal(order.get("shipping"), "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    taxable_base = (subtotal - discount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if taxable_base < Decimal("0"):
        taxable_base = Decimal("0.00")

    commission = Decimal("0.00")
    rule_applied = "SUBSCRIPTION"
    rate_applied = Decimal("0")

    if plan_type == "commission":
        tiers = (commission_rules or {}).get("tiers") if commission_rules else []
        rate_applied, rule_applied = _choose_commission_rate(taxable_base, tiers if isinstance(tiers, list) else [])
        commission = (taxable_base * rate_applied).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        minimum_raw = (commission_rules or {}).get("minimum_per_operation") if commission_rules else None
        if minimum_raw not in (None, "", "null") and taxable_base > Decimal("0"):
            minimum = _to_decimal(minimum_raw, "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if commission < minimum:
                commission = minimum

    total = (taxable_base + shipping).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net = (total - commission).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "subtotal": subtotal,
        "commission": commission,
        "total": total,
        "net": net,
        "discount": discount,
        "shipping": shipping,
        "taxable_base": taxable_base,
        "commission_rule": rule_applied,
        "commission_rate": rate_applied,
    }
