from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import (
    Customer,
    CustomerLoyaltyAccount,
    LoyaltyProgram,
    MembershipPlan,
    Order,
)


def get_or_create_loyalty_account(db: Session, customer_id: int, tenant_id: int) -> CustomerLoyaltyAccount:
    account = db.scalar(
        select(CustomerLoyaltyAccount).where(
            CustomerLoyaltyAccount.customer_id == customer_id,
            CustomerLoyaltyAccount.tenant_id == tenant_id,
        )
    )
    if account:
        return account

    program = db.scalar(select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id))
    if not program:
        program = LoyaltyProgram(
            tenant_id=tenant_id,
            name="Programa Base",
            is_active=True,
            points_enabled=True,
            points_conversion_rate=Decimal("100"),
            welcome_points=0,
            birthday_points=None,
        )
        db.add(program)
        db.flush()

    account = CustomerLoyaltyAccount(
        tenant_id=tenant_id,
        customer_id=customer_id,
        loyalty_program_id=program.id,
        points_balance=program.welcome_points,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def apply_points_for_order(db: Session, order: Order) -> int:
    if not order.customer_id:
        return 0
    account = get_or_create_loyalty_account(db, order.customer_id, order.tenant_id)
    program = db.get(LoyaltyProgram, account.loyalty_program_id)
    if not program or not program.points_enabled or not program.is_active:
        return 0

    conversion = Decimal(program.points_conversion_rate or 100)
    if conversion <= 0:
        return 0
    earned_points = int((Decimal(order.total_amount) / conversion).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    account.points_balance += max(0, earned_points)

    customer = db.get(Customer, order.customer_id)
    if customer:
        customer.loyalty_points = account.points_balance
    db.commit()
    return earned_points


def compute_discount_from_points(db: Session, customer_id: int, tenant_id: int, order_total: Decimal) -> dict:
    account = get_or_create_loyalty_account(db, customer_id, tenant_id)
    program = db.get(LoyaltyProgram, account.loyalty_program_id)
    if not program or not program.points_enabled or account.points_balance <= 0:
        return {"discount_amount": Decimal("0.00"), "points_to_consume": 0}

    conversion = Decimal(program.points_conversion_rate or 100)
    max_discount = (Decimal(account.points_balance) / conversion).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    discount = min(max_discount, Decimal(order_total)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    points_to_consume = int((discount * conversion).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    return {"discount_amount": discount, "points_to_consume": max(0, min(points_to_consume, account.points_balance))}


def consume_points(db: Session, customer_id: int, tenant_id: int, points_to_consume: int) -> None:
    if points_to_consume <= 0:
        return
    account = get_or_create_loyalty_account(db, customer_id, tenant_id)
    account.points_balance = max(0, account.points_balance - points_to_consume)
    customer = db.get(Customer, customer_id)
    if customer:
        customer.loyalty_points = account.points_balance
    db.commit()


def enroll_membership(db: Session, customer_id: int, membership_plan_id: int) -> CustomerLoyaltyAccount:
    plan = db.get(MembershipPlan, membership_plan_id)
    if not plan:
        raise ValueError("membership plan no encontrado")
    account = get_or_create_loyalty_account(db, customer_id, plan.tenant_id)
    account.membership_plan_id = plan.id
    account.membership_expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)
    db.commit()
    db.refresh(account)
    return account


def get_active_benefits(db: Session, customer_id: int, tenant_id: int) -> dict:
    account = get_or_create_loyalty_account(db, customer_id, tenant_id)
    benefits: list[str] = []
    if account.membership_plan_id and account.membership_expires_at and account.membership_expires_at >= datetime.utcnow():
        plan = db.get(MembershipPlan, account.membership_plan_id)
        if plan and plan.is_active:
            benefits.append(plan.benefits_json or "membership_active")
    return {"points_balance": account.points_balance, "benefits": benefits}
