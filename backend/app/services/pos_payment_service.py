from __future__ import annotations

import json
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import MercadoPagoSettings, PosPaymentTransaction
from app.services.pos_service import create_pos_sale


def create_mercadopago_payment_link(
    db: Session,
    *,
    tenant_id: int,
    amount: Decimal,
    currency: str = "MXN",
    pos_location_id: int | None = None,
    customer_id: int | None = None,
    employee_id: int | None = None,
    sale_payload: dict | None = None,
    notes: str | None = None,
) -> PosPaymentTransaction:
    _ensure_mercadopago_enabled(db, tenant_id)
    reference = _reference("mplink")
    payment_url = f"https://mp.local/pay/{reference}"
    transaction = PosPaymentTransaction(
        tenant_id=tenant_id,
        pos_location_id=pos_location_id,
        customer_id=customer_id,
        employee_id=employee_id,
        payment_provider="mercadopago",
        payment_method="mercado_pago_link",
        status="pending",
        external_reference=reference,
        amount=Decimal(amount).quantize(Decimal("0.01")),
        currency=currency.upper(),
        payment_url=payment_url,
        sale_payload_json=json.dumps(sale_payload or {}, ensure_ascii=False),
        notes=notes,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def create_mercadopago_qr_charge_placeholder(
    db: Session,
    *,
    tenant_id: int,
    amount: Decimal,
    currency: str = "MXN",
    pos_location_id: int | None = None,
    customer_id: int | None = None,
    employee_id: int | None = None,
    sale_payload: dict | None = None,
    notes: str | None = None,
) -> PosPaymentTransaction:
    _ensure_mercadopago_enabled(db, tenant_id)
    reference = _reference("mpqr")
    qr_payload = json.dumps(
        {
            "provider": "mercadopago",
            "reference": reference,
            "amount": str(Decimal(amount).quantize(Decimal("0.01"))),
            "currency": currency.upper(),
        },
        ensure_ascii=False,
    )
    transaction = PosPaymentTransaction(
        tenant_id=tenant_id,
        pos_location_id=pos_location_id,
        customer_id=customer_id,
        employee_id=employee_id,
        payment_provider="mercadopago",
        payment_method="mercado_pago_qr",
        status="pending",
        external_reference=reference,
        amount=Decimal(amount).quantize(Decimal("0.01")),
        currency=currency.upper(),
        qr_payload=qr_payload,
        sale_payload_json=json.dumps(sale_payload or {}, ensure_ascii=False),
        notes=notes,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def confirm_mercadopago_payment(
    db: Session,
    *,
    external_reference: str,
    paid: bool,
    provider_payload: dict | None = None,
    notes: str | None = None,
) -> PosPaymentTransaction | None:
    transaction = db.scalar(
        select(PosPaymentTransaction).where(PosPaymentTransaction.external_reference == external_reference)
    )
    if not transaction:
        return None
    transaction.status = "paid" if paid else "failed"
    if notes:
        transaction.notes = notes
    if provider_payload is not None:
        transaction.provider_payload_json = json.dumps(provider_payload, ensure_ascii=False)
    db.commit()
    db.refresh(transaction)
    return transaction


def register_pos_sale_payment(db: Session, *, transaction: PosPaymentTransaction) -> PosPaymentTransaction:
    if transaction.status != "paid" or transaction.pos_sale_id is not None:
        return transaction
    payload = json.loads(transaction.sale_payload_json or "{}")
    items = payload.get("items") or []
    if not items:
        return transaction
    sale = create_pos_sale(
        db,
        tenant_id=transaction.tenant_id,
        pos_location_id=transaction.pos_location_id or int(payload.get("pos_location_id") or 0),
        customer_id=transaction.customer_id,
        employee_id=transaction.employee_id,
        currency=transaction.currency,
        payment_method=transaction.payment_method,
        notes=payload.get("notes") or transaction.notes,
        items=items,
        use_loyalty_points=bool(payload.get("use_loyalty_points", False)),
        register_membership=bool(payload.get("register_membership", False)),
    )
    transaction.pos_sale_id = sale.id
    db.commit()
    db.refresh(transaction)
    return transaction


def list_pos_payments_by_tenant(db: Session, tenant_id: int) -> list[PosPaymentTransaction]:
    return db.scalars(
        select(PosPaymentTransaction)
        .where(PosPaymentTransaction.tenant_id == tenant_id)
        .order_by(PosPaymentTransaction.id.desc())
    ).all()


def _ensure_mercadopago_enabled(db: Session, tenant_id: int) -> None:
    settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if not settings:
        settings = MercadoPagoSettings(tenant_id=tenant_id, mercadopago_enabled=False)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    if not settings.mercadopago_enabled:
        raise ValueError("Mercado Pago no esta habilitado para esta marca")


def _reference(prefix: str) -> str:
    return f"{prefix.upper()}-{uuid4().hex[:12].upper()}"
