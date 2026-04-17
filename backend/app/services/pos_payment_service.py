from __future__ import annotations

import json
from decimal import Decimal
from urllib import error, request
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
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
    mp_settings = _ensure_mercadopago_enabled(db, tenant_id)
    if not mp_settings.mercadopago_payment_link_enabled:
        raise ValueError("Mercado Pago link no esta habilitado para esta marca")

    reference = _reference("mplink")
    preference = _create_checkout_preference(
        mp_settings=mp_settings,
        external_reference=reference,
        amount=Decimal(amount).quantize(Decimal("0.01")),
        currency=currency,
        title=notes or "Cobro POS COMERCIA",
    )
    payment_url = (
        str(preference.get("init_point") or "").strip()
        or str(preference.get("sandbox_init_point") or "").strip()
    )
    if not payment_url:
        raise ValueError("Mercado Pago no devolvio URL de pago para link")

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
        provider_payload_json=json.dumps(
            {
                "preference_id": preference.get("id"),
                "collector_id": preference.get("collector_id"),
            },
            ensure_ascii=False,
        ),
        notes=notes,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def create_mercadopago_qr_charge(
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
    mp_settings = _ensure_mercadopago_enabled(db, tenant_id)
    if not mp_settings.mercadopago_qr_enabled:
        raise ValueError("Mercado Pago QR no esta habilitado para esta marca")

    reference = _reference("mpqr")
    qr_payload: dict[str, object]
    payment_url: str | None = None

    # Base Point/terminal: cuando el tenant habilita Point e incluye credenciales de POS oficial, usa endpoint in-store QR.
    if mp_settings.mercadopago_point_enabled:
        point_result = _create_point_qr_order(
            mp_settings=mp_settings,
            external_reference=reference,
            amount=Decimal(amount).quantize(Decimal("0.01")),
            title=notes or "Cobro POS COMERCIA",
        )
        if point_result.get("ok"):
            qr_payload = dict(point_result)
            payment_url = str(point_result.get("ticket_url") or "") or None
        else:
            # Sin placeholders silenciosos: si Point esta habilitado pero no completo, lo informamos explicitamente y caemos a QR web oficial.
            qr_payload = dict(point_result)
            preference = _create_checkout_preference(
                mp_settings=mp_settings,
                external_reference=reference,
                amount=Decimal(amount).quantize(Decimal("0.01")),
                currency=currency,
                title=notes or "Cobro POS COMERCIA",
            )
            checkout_url = (
                str(preference.get("init_point") or "").strip()
                or str(preference.get("sandbox_init_point") or "").strip()
            )
            qr_payload["fallback_checkout_url"] = checkout_url
            qr_payload["fallback_preference_id"] = preference.get("id")
            payment_url = checkout_url or None
    else:
        preference = _create_checkout_preference(
            mp_settings=mp_settings,
            external_reference=reference,
            amount=Decimal(amount).quantize(Decimal("0.01")),
            currency=currency,
            title=notes or "Cobro POS COMERCIA",
        )
        checkout_url = (
            str(preference.get("init_point") or "").strip()
            or str(preference.get("sandbox_init_point") or "").strip()
        )
        qr_payload = {
            "provider": "mercadopago",
            "mode": "checkout_qr",
            "preference_id": preference.get("id"),
            "checkout_url": checkout_url,
            "external_reference": reference,
        }
        payment_url = checkout_url or None

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
        payment_url=payment_url,
        qr_payload=json.dumps(qr_payload, ensure_ascii=False),
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


def smoke_test_mercadopago_api(db: Session, *, tenant_id: int) -> dict[str, object]:
    mp_settings = _ensure_mercadopago_enabled(db, tenant_id)
    headers = _mercadopago_headers(mp_settings)
    req = request.Request("https://api.mercadopago.com/users/me", headers=headers, method="GET")
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return {
                "ok": True,
                "provider": "mercadopago",
                "id": body.get("id"),
                "nickname": body.get("nickname"),
            }
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {"ok": False, "blocker": f"Mercado Pago HTTP {exc.code}", "detail": detail[:400]}
    except Exception as exc:
        return {"ok": False, "blocker": f"{exc.__class__.__name__}: {str(exc)[:240]}"}


def _ensure_mercadopago_enabled(db: Session, tenant_id: int) -> MercadoPagoSettings:
    settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if not settings:
        settings = MercadoPagoSettings(tenant_id=tenant_id, mercadopago_enabled=False)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    if not settings.mercadopago_enabled:
        raise ValueError("Mercado Pago no esta habilitado para esta marca")
    return settings


def _resolve_access_token(mp_settings: MercadoPagoSettings) -> str:
    settings = get_settings()
    token = (mp_settings.mercadopago_access_token or "").strip() or settings.mercadopago_access_token.strip()
    if not token:
        raise ValueError("Falta mercadopago_access_token para operar pagos POS")
    return token


def _mercadopago_headers(mp_settings: MercadoPagoSettings) -> dict[str, str]:
    token = _resolve_access_token(mp_settings)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Idempotency-Key": uuid4().hex,
    }


def _create_checkout_preference(
    *,
    mp_settings: MercadoPagoSettings,
    external_reference: str,
    amount: Decimal,
    currency: str,
    title: str,
) -> dict:
    settings = get_settings()
    payload: dict[str, object] = {
        "items": [
            {
                "title": title[:120] or "Cobro POS COMERCIA",
                "quantity": 1,
                "currency_id": currency.upper(),
                "unit_price": float(amount),
            }
        ],
        "external_reference": external_reference,
        "statement_descriptor": "COMERCIA POS",
    }
    if settings.mercadopago_notification_url.strip():
        payload["notification_url"] = settings.mercadopago_notification_url.strip()

    req = request.Request(
        "https://api.mercadopago.com/checkout/preferences",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers=_mercadopago_headers(mp_settings),
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Mercado Pago preference HTTP {exc.code}: {detail[:280]}") from exc


def _create_point_qr_order(
    *,
    mp_settings: MercadoPagoSettings,
    external_reference: str,
    amount: Decimal,
    title: str,
) -> dict[str, object]:
    settings = get_settings()
    collector_id = settings.mercadopago_point_collector_id.strip()
    pos_id = settings.mercadopago_point_pos_id.strip()
    if not collector_id or not pos_id:
        return {
            "ok": False,
            "mode": "point_qr",
            "blocker": "Faltan MERCADOPAGO_POINT_COLLECTOR_ID o MERCADOPAGO_POINT_POS_ID para Point/terminal",
        }

    payload: dict[str, object] = {
        "external_reference": external_reference,
        "title": title[:120] or "Cobro POS COMERCIA",
        "description": title[:256] or "Cobro POS COMERCIA",
        "total_amount": float(amount),
        "items": [
            {
                "title": title[:120] or "Cobro POS COMERCIA",
                "description": "Cobro punto de venta COMERCIA",
                "quantity": 1,
                "unit_price": float(amount),
                "total_amount": float(amount),
                "unit_measure": "unit",
                "sku_number": external_reference[:30],
                "category": "others",
            }
        ],
    }
    if settings.mercadopago_notification_url.strip():
        payload["notification_url"] = settings.mercadopago_notification_url.strip()

    endpoint = f"https://api.mercadopago.com/instore/orders/qr/seller/collectors/{collector_id}/pos/{pos_id}"
    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers=_mercadopago_headers(mp_settings),
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return {
                "ok": True,
                "mode": "point_qr",
                "collector_id": collector_id,
                "pos_id": pos_id,
                "ticket_url": body.get("ticket_url") or body.get("init_point") or "",
                "qr_data": body.get("qr_data") or body.get("qr") or "",
                "raw": body,
            }
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {
            "ok": False,
            "mode": "point_qr",
            "collector_id": collector_id,
            "pos_id": pos_id,
            "blocker": f"Mercado Pago Point QR HTTP {exc.code}",
            "detail": detail[:400],
        }
    except Exception as exc:
        return {
            "ok": False,
            "mode": "point_qr",
            "collector_id": collector_id,
            "pos_id": pos_id,
            "blocker": f"{exc.__class__.__name__}: {str(exc)[:240]}",
        }


def _reference(prefix: str) -> str:
    return f"{prefix.upper()}-{uuid4().hex[:12].upper()}"
