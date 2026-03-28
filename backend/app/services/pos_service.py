from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    CustomerLoyaltyAccount,
    LoyaltyProgram,
    PosMembershipRegistration,
    PosSale,
    PosSaleItem,
    Product,
)


def create_pos_sale(
    db: Session,
    tenant_id: int,
    pos_location_id: int,
    customer_id: int | None,
    employee_id: int | None,
    currency: str,
    payment_method: str,
    notes: str | None,
    items: list[dict],
    use_loyalty_points: bool = False,
    register_membership: bool = False,
) -> PosSale:
    subtotal = Decimal("0")
    for item in items:
        subtotal += Decimal(str(item["unit_price"])) * int(item["quantity"])

    discount = Decimal("0")
    if use_loyalty_points and customer_id:
        loyalty = db.scalar(
            select(CustomerLoyaltyAccount).where(
                CustomerLoyaltyAccount.tenant_id == tenant_id,
                CustomerLoyaltyAccount.customer_id == customer_id,
            )
        )
        if loyalty and loyalty.points_balance > 0:
            discount = min(Decimal(loyalty.points_balance) * Decimal("0.1"), subtotal * Decimal("0.2"))
            loyalty.points_balance = max(0, loyalty.points_balance - int(discount / Decimal("0.1")))

    sale = PosSale(
        tenant_id=tenant_id,
        pos_location_id=pos_location_id,
        customer_id=customer_id,
        employee_id=employee_id,
        subtotal_amount=subtotal.quantize(Decimal("0.01")),
        discount_amount=discount.quantize(Decimal("0.01")),
        total_amount=(subtotal - discount).quantize(Decimal("0.01")),
        currency=currency.upper(),
        payment_method=payment_method,
        notes=notes,
    )
    db.add(sale)
    db.flush()

    for item in items:
        product = db.get(Product, int(item["product_id"]))
        if not product or product.tenant_id != tenant_id:
            continue
        qty = int(item["quantity"])
        unit = Decimal(str(item["unit_price"]))
        db.add(
            PosSaleItem(
                pos_sale_id=sale.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit,
                total_price=(unit * qty).quantize(Decimal("0.01")),
            )
        )

    if customer_id:
        _award_loyalty_points(db, tenant_id=tenant_id, customer_id=customer_id, total=sale.total_amount)
        if register_membership:
            db.add(
                PosMembershipRegistration(
                    tenant_id=tenant_id,
                    customer_id=customer_id,
                    pos_location_id=pos_location_id,
                    registration_source="pos",
                )
            )

    db.commit()
    db.refresh(sale)
    return sale


def _award_loyalty_points(db: Session, tenant_id: int, customer_id: int, total: Decimal) -> None:
    program = db.scalar(
        select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id, LoyaltyProgram.is_active.is_(True))
    )
    if not program:
        return
    account = db.scalar(
        select(CustomerLoyaltyAccount).where(
            CustomerLoyaltyAccount.tenant_id == tenant_id,
            CustomerLoyaltyAccount.customer_id == customer_id,
        )
    )
    if not account:
        account = CustomerLoyaltyAccount(
            tenant_id=tenant_id,
            customer_id=customer_id,
            loyalty_program_id=program.id,
            points_balance=0,
        )
        db.add(account)
        db.flush()
    earned = int((total * Decimal(str(program.points_conversion_rate))) // Decimal("100"))
    account.points_balance += earned
