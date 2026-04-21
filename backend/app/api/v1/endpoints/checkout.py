import json
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.models import CommissionDetail, MercadoPagoSettings, Order, OrderItem, Plan, Product, ServiceOffering, StripeConfig, Tenant
from app.schemas.checkout import CheckoutSessionRequest, CheckoutSessionResponse
from app.services.coupon_service import apply_coupon
from app.services.loyalty_service import compute_discount_from_points
from app.services.pos_payment_service import create_mercadopago_payment_link
from app.services.pricing_service import calculate_totals
from app.services.stripe_service import create_checkout_session_plan1, create_checkout_session_plan2
from app.services.tenant_config_service import build_tenant_config_payload

router = APIRouter()
settings = get_settings()


@router.post("/create-session", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
def create_checkout_session(payload: CheckoutSessionRequest, db: Session = Depends(get_db)) -> CheckoutSessionResponse:
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    plan = _resolve_tenant_plan(db, tenant)

    line_items: list[dict] = []
    order_items_data: list[dict] = []
    commission_rows: list[dict] = []
    service_items: list[dict] = []
    subtotal_amount = Decimal("0")

    for item in payload.items:
        if item.product_id:
            product = db.scalar(select(Product).where(Product.id == item.product_id, Product.tenant_id == tenant.id))
            if not product:
                raise HTTPException(status_code=400, detail=f"producto invalido para tenant: {item.product_id}")
            unit_price = Decimal(product.price_public).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            name = product.name
            product_id = product.id
            service_offering_id = None
        elif item.service_offering_id:
            service = db.scalar(
                select(ServiceOffering).where(ServiceOffering.id == item.service_offering_id, ServiceOffering.tenant_id == tenant.id)
            )
            if not service:
                raise HTTPException(status_code=400, detail=f"servicio invalido para tenant: {item.service_offering_id}")
            unit_price = Decimal(service.price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            name = service.name
            product_id = None
            service_offering_id = service.id
            service_items.append({"service_offering_id": service.id, "name": service.name})
        else:
            raise HTTPException(status_code=400, detail="cada item requiere product_id o service_offering_id")

        line_total = (unit_price * Decimal(item.quantity)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        subtotal_amount += line_total
        order_items_data.append(
            {
                "product_id": product_id,
                "service_offering_id": service_offering_id,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "total_price": line_total,
            }
        )
        line_items.append(
            {
                "price_data": {
                    "currency": settings.default_currency,
                    "product_data": {"name": name},
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

    tenant_config = build_tenant_config_payload(
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
        commercial_plan_key=tenant.commercial_plan_key,
        commercial_plan_status=tenant.commercial_plan_status,
        commercial_limits_json=tenant.commercial_limits_json,
        ai_tokens_balance=tenant.ai_tokens_balance,
        ai_tokens_locked=tenant.ai_tokens_locked,
        plan_commission_enabled=bool(plan.commission_enabled),
    )
    plan_type = tenant_config["plan_type"]
    totals = calculate_totals(
        {"subtotal": subtotal_amount, "discount": discount_amount, "shipping": Decimal("0")},
        plan_type=plan_type,
        commission_rules=tenant_config["commission_rules"],
    )
    payment_mode = "plan2" if plan_type == "commission" else "plan1"
    commission_amount = Decimal(totals["commission"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_amount = Decimal(totals["total"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net_amount = Decimal(totals["net"]).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if commission_amount > Decimal("0"):
        commission_rows = [
            {
                "rule_applied": str(totals["commission_rule"])[:20],
                "percentage": Decimal(totals["commission_rate"]),
                "amount": commission_amount,
            }
        ]

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
        has_service_items=len(service_items) > 0,
        service_payload_json=json.dumps(service_items) if service_items else None,
        is_gift=payload.is_gift,
        gift_sender_name=payload.gift_sender_name,
        gift_sender_email=payload.gift_sender_email,
        gift_is_anonymous=payload.gift_is_anonymous,
        gift_message=payload.gift_message,
        gift_recipient_name=payload.gift_recipient_name,
        gift_recipient_email=payload.gift_recipient_email,
        gift_recipient_phone=payload.gift_recipient_phone,
        appointment_scheduled_for=payload.appointment_scheduled_for,
    )
    db.add(order)
    db.flush()

    for row in order_items_data:
        db.add(OrderItem(order_id=order.id, **row))
    for detail in commission_rows:
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
    requested_provider = (payload.payment_provider or "").strip().lower()
    payment_provider = requested_provider if requested_provider in {"stripe", "mercadopago"} else "stripe"
    session_id: str
    session_url: str

    if payment_provider == "mercadopago":
        _ensure_mercadopago_checkout_ready(db, tenant.id)
        charge = create_mercadopago_payment_link(
            db,
            tenant_id=tenant.id,
            amount=total_amount,
            currency=(payload.currency or settings.mercadopago_currency or "MXN").upper(),
            customer_id=payload.customer_id,
            sale_payload={
                "source": "storefront_checkout",
                "order_id": order.id,
                "items": [{"product_id": row["product_id"], "quantity": row["quantity"]} for row in order_items_data],
            },
            notes=f"Checkout storefront {tenant.slug} orden #{order.id}",
        )
        session_id = charge.external_reference or f"mplink-{charge.id}"
        session_url = (charge.payment_url or "").strip()
        if not session_url:
            raise HTTPException(status_code=502, detail="Mercado Pago no devolvio URL de pago")
    else:
        stripe_config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == payload.tenant_id))
        if not stripe_config:
            raise HTTPException(status_code=404, detail="stripe config no encontrado para tenant")
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
        session_id = session.id
        session_url = session.url

    order.stripe_session_id = session_id
    db.commit()
    db.refresh(order)
    return CheckoutSessionResponse(
        order_id=order.id,
        session_id=session_id,
        session_url=session_url,
        subtotal_amount=order.subtotal_amount,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        commission_amount=order.commission_amount,
        net_amount=order.net_amount,
        payment_mode=order.payment_mode,
        plan_type=plan_type,
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


def _ensure_mercadopago_checkout_ready(db: Session, tenant_id: int) -> MercadoPagoSettings:
    mp_settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if not mp_settings or not mp_settings.mercadopago_enabled:
        raise HTTPException(status_code=400, detail="Mercado Pago no esta habilitado para esta marca")
    if mp_settings.mercadopago_active_for_pos_only:
        raise HTTPException(status_code=400, detail="Mercado Pago esta habilitado solo para POS en esta marca")
    has_access_token = bool((mp_settings.mercadopago_access_token or "").strip() or settings.mercadopago_access_token.strip())
    if not has_access_token:
        raise HTTPException(status_code=400, detail="Falta configurar MP_ACCESS_TOKEN para habilitar checkout")
    return mp_settings
