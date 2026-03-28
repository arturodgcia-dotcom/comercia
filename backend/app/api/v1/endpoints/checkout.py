from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import CommissionDetail, Order, OrderItem, Plan, Product, StripeConfig, Tenant
from app.schemas.checkout import CheckoutSessionRequest, CheckoutSessionResponse
from app.services.commission_service import compute_order_commission
from app.services.coupon_service import apply_coupon
from app.services.loyalty_service import compute_discount_from_points
from app.services.stripe_service import create_checkout_session_plan1, create_checkout_session_plan2

router = APIRouter()
settings = get_settings()


@router.post("/create-session", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_checkout_session(payload: CheckoutSessionRequest, db: Session = Depends(get_db)) -> CheckoutSessionResponse:
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    stripe_config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == payload.tenant_id))
    if not stripe_config:
        raise HTTPException(status_code=404, detail="stripe config no encontrado para tenant")

    plan = _resolve_tenant_plan(db, tenant)
    products = _resolve_products(db, tenant.id, payload.items)

    line_items: list[dict] = []
    order_items_data: list[dict] = []
    subtotal_amount = Decimal("0")
    for item in payload.items:
        product = products[item.product_id]
        unit_price = Decimal(product.price_public).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        line_total = (unit_price * Decimal(item.quantity)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        subtotal_amount += line_total
        order_items_data.append(
            {
                "product_id": product.id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "total_price": line_total,
            }
        )
        line_items.append(
            {
                "price_data": {
                    "currency": settings.default_currency,
                    "product_data": {"name": product.name},
                    "unit_amount": int((unit_price * 100).to_integral_value(rounding=ROUND_HALF_UP)),
                },
                "quantity": item.quantity,
            }
        )

    discount_amount = Decimal("0")
    coupon_code: str | None = None
    coupon_id: int | None = None
    if payload.coupon_code:
        try:
            coupon_result = apply_coupon(
                db,
                code=payload.coupon_code,
                tenant_id=tenant.id,
                order_total=subtotal_amount,
                applies_to=payload.applies_to,
            )
            discount_amount += Decimal(coupon_result["discount_amount"])
            coupon_obj = coupon_result["coupon"]
            coupon_code = coupon_obj.code
            coupon_id = coupon_obj.id
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    loyalty_points_used = 0
    if payload.use_loyalty_points and payload.customer_id:
        points_result = compute_discount_from_points(
            db,
            customer_id=payload.customer_id,
            tenant_id=tenant.id,
            order_total=subtotal_amount - discount_amount,
        )
        discount_amount += Decimal(points_result["discount_amount"])
        loyalty_points_used = points_result["points_to_consume"]

    total_amount = (subtotal_amount - discount_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if total_amount < Decimal("0"):
        total_amount = Decimal("0.00")
    payment_mode = "plan2" if plan.code == "PLAN_2" and plan.commission_enabled else "plan1"

    commission_amount = Decimal("0")
    commission_detail_rows: list[dict] = []
    if payment_mode == "plan2":
        result = compute_order_commission(order_items_data)
        commission_amount = Decimal(result["total_commission"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        commission_detail_rows = result["details"]

    net_amount = (total_amount - commission_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    order = Order(
        tenant_id=tenant.id,
        customer_id=payload.customer_id,
        subtotal_amount=subtotal_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        commission_amount=commission_amount,
        net_amount=net_amount,
        currency=settings.default_currency,
        status="pending",
        payment_mode=payment_mode,
        coupon_code=coupon_code,
        loyalty_points_used=loyalty_points_used,
    )
    db.add(order)
    db.flush()

    for row in order_items_data:
        db.add(OrderItem(order_id=order.id, **row))
    for detail in commission_detail_rows:
        db.add(
            CommissionDetail(
                order_id=order.id,
                rule_applied=detail["rule_applied"],
                percentage=detail["percentage"],
                amount=detail["amount"],
            )
        )

    metadata = {
        "order_id": str(order.id),
        "tenant_id": str(tenant.id),
        "coupon_id": str(coupon_id or ""),
        "customer_id": str(payload.customer_id or ""),
        "loyalty_points_used": str(loyalty_points_used),
    }
    if payment_mode == "plan1":
        session = create_checkout_session_plan1(
            secret_key=stripe_config.secret_key,
            line_items=line_items,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
            metadata=metadata,
        )
    else:
        if not stripe_config.stripe_account_id:
            raise HTTPException(status_code=400, detail="stripe_account_id requerido para PLAN_2")
        session = create_checkout_session_plan2(
            secret_key=stripe_config.secret_key,
            line_items=line_items,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
            metadata=metadata,
            application_fee_amount=int((commission_amount * 100).to_integral_value(rounding=ROUND_HALF_UP)),
            destination_account=stripe_config.stripe_account_id,
        )

    order.stripe_session_id = session.id
    db.commit()
    db.refresh(order)
    return CheckoutSessionResponse(
        order_id=order.id,
        session_id=session.id,
        session_url=session.url,
        subtotal_amount=order.subtotal_amount,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        commission_amount=order.commission_amount,
        net_amount=order.net_amount,
        payment_mode=order.payment_mode,
    )


def _resolve_tenant_plan(db: Session, tenant: Tenant) -> Plan:
    if tenant.plan_id:
        plan = db.get(Plan, tenant.plan_id)
        if plan:
            return plan
    fallback = db.scalar(select(Plan).where(Plan.code == "PLAN_1"))
    if not fallback:
        raise HTTPException(status_code=404, detail="no se encontro PLAN_1")
    return fallback


def _resolve_products(db: Session, tenant_id: int, items: list) -> dict[int, Product]:
    product_ids = list({item.product_id for item in items})
    products = db.scalars(select(Product).where(Product.id.in_(product_ids), Product.tenant_id == tenant_id)).all()
    mapping = {product.id: product for product in products}
    missing = [product_id for product_id in product_ids if product_id not in mapping]
    if missing:
        raise HTTPException(status_code=400, detail=f"productos invalidos para tenant: {missing}")
    return mapping
