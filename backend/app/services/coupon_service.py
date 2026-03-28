from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Coupon


def validate_coupon(db: Session, code: str, tenant_id: int, order_total: Decimal, applies_to: str) -> Coupon:
    coupon = db.scalar(select(Coupon).where(Coupon.tenant_id == tenant_id, Coupon.code == code))
    if not coupon or not coupon.is_active:
        raise ValueError("cupon no valido")
    now = datetime.utcnow()
    if coupon.starts_at and coupon.starts_at > now:
        raise ValueError("cupon fuera de vigencia")
    if coupon.ends_at and coupon.ends_at < now:
        raise ValueError("cupon fuera de vigencia")
    if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
        raise ValueError("cupon sin usos disponibles")
    if coupon.min_order_amount is not None and Decimal(order_total) < Decimal(coupon.min_order_amount):
        raise ValueError("monto minimo no alcanzado")
    if coupon.applies_to not in ("all", applies_to):
        raise ValueError("cupon no aplica al tipo de cliente")
    return coupon


def apply_coupon(db: Session, code: str, tenant_id: int, order_total: Decimal, applies_to: str) -> dict:
    coupon = validate_coupon(db, code, tenant_id, order_total, applies_to)
    total = Decimal(order_total)
    if coupon.discount_type == "fixed":
        discount = min(total, Decimal(coupon.discount_value))
    else:
        discount = (total * (Decimal(coupon.discount_value) / Decimal("100"))).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        discount = min(total, discount)
    return {"coupon": coupon, "discount_amount": discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)}


def increment_coupon_usage(db: Session, coupon_id: int) -> None:
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        return
    coupon.used_count += 1
    db.commit()
