from __future__ import annotations

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    CustomerLoyaltyAccount,
    LoyaltyProgram,
    Plan,
    PosMembershipRegistration,
    PosSale,
    PosSaleItem,
    Product,
    Tenant,
)
from app.services.pricing_service import calculate_totals
from app.services.tenant_config_service import build_tenant_config_payload

SUPPORTED_POS_PAYMENT_METHODS = {
    "cash",
    "transfer",
    "mercado_pago_link",
    "mercado_pago_qr",
    "mercado_pago_point_placeholder",
    "tarjeta_manual_placeholder",
}


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
    normalized_payment_method = (payment_method or "cash").strip().lower()
    if normalized_payment_method not in SUPPORTED_POS_PAYMENT_METHODS:
        normalized_payment_method = "tarjeta_manual_placeholder"

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
        commission_amount=Decimal("0.00"),
        net_amount=Decimal("0.00"),
        total_amount=(subtotal - discount).quantize(Decimal("0.01")),
        payment_mode="subscription",
        currency=currency.upper(),
        payment_method=normalized_payment_method,
        notes=notes,
    )
    tenant = db.get(Tenant, tenant_id)
    if tenant:
        plan = db.get(Plan, tenant.plan_id) if tenant.plan_id else None
        config = build_tenant_config_payload(
            tenant_id=tenant.id,
            tenant_slug=tenant.slug,
            tenant_name=tenant.name,
            business_type=tenant.business_type,
            tenant_plan_type=tenant.plan_type,
            commission_rules_json=tenant.commission_rules_json,
            subscription_plan_json=tenant.subscription_plan_json,
            billing_model=tenant.billing_model,
            commission_percentage=tenant.commission_percentage,
            commission_enabled=tenant.commission_enabled,
            commission_scope=tenant.commission_scope,
            commission_notes=tenant.commission_notes,
            plan_commission_enabled=bool(plan and plan.commission_enabled),
        )
        totals = calculate_totals(
            {"subtotal": sale.subtotal_amount, "discount": sale.discount_amount, "shipping": Decimal("0")},
            plan_type=config["plan_type"],
            commission_rules=config["commission_rules"],
        )
        sale.commission_amount = totals["commission"]
        sale.total_amount = totals["total"]
        sale.net_amount = totals["net"]
        sale.payment_mode = config["plan_type"]

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
