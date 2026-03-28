from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import CurrencySettings, ExchangeRate

FALLBACK_RATES: dict[tuple[str, str], Decimal] = {
    ("MXN", "USD"): Decimal("0.058"),
    ("MXN", "EUR"): Decimal("0.053"),
    ("USD", "MXN"): Decimal("17.2"),
    ("USD", "EUR"): Decimal("0.91"),
    ("EUR", "MXN"): Decimal("18.9"),
    ("EUR", "USD"): Decimal("1.10"),
}


def get_currency_settings(db: Session, tenant_id: int) -> CurrencySettings:
    settings = db.scalar(select(CurrencySettings).where(CurrencySettings.tenant_id == tenant_id))
    if settings:
        return settings
    settings = CurrencySettings(
        tenant_id=tenant_id,
        base_currency="MXN",
        enabled_currencies_json='["MXN"]',
        display_mode="base_only",
        exchange_mode="manual",
        auto_update_enabled=False,
        rounding_mode="none",
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def upsert_currency_settings(db: Session, tenant_id: int, **changes) -> CurrencySettings:
    settings = get_currency_settings(db, tenant_id)
    for key, value in changes.items():
        if value is None:
            continue
        if key == "enabled_currencies":
            settings.enabled_currencies_json = json.dumps(sorted(set([v.upper() for v in value])))
        else:
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


def create_manual_exchange_rate(
    db: Session, base_currency: str, target_currency: str, rate: Decimal, source_name: str = "manual"
) -> ExchangeRate:
    record = ExchangeRate(
        base_currency=base_currency.upper(),
        target_currency=target_currency.upper(),
        rate=rate,
        source_name=source_name,
        is_manual=True,
        valid_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def refresh_exchange_rates(db: Session) -> list[ExchangeRate]:
    # Adapter base: en esta fase se usa fallback local.
    created: list[ExchangeRate] = []
    for (base, target), rate in FALLBACK_RATES.items():
        created.append(
            create_manual_exchange_rate(
                db,
                base_currency=base,
                target_currency=target,
                rate=rate,
                source_name="local_fallback",
            )
        )
    return created


def get_effective_rate(db: Session, from_currency: str, to_currency: str, tenant_id: int | None = None) -> Decimal:
    src = from_currency.upper()
    dst = to_currency.upper()
    if src == dst:
        return Decimal("1")
    latest_manual = db.scalar(
        select(ExchangeRate)
        .where(ExchangeRate.base_currency == src, ExchangeRate.target_currency == dst)
        .order_by(ExchangeRate.is_manual.desc(), ExchangeRate.valid_at.desc(), ExchangeRate.id.desc())
    )
    if latest_manual:
        return Decimal(str(latest_manual.rate))
    return FALLBACK_RATES.get((src, dst), Decimal("1"))


def _apply_rounding(amount: Decimal, rounding_mode: str) -> Decimal:
    if rounding_mode == "whole":
        return amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    if rounding_mode == ".99":
        base = amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return base - Decimal("0.01")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def convert_amount(db: Session, amount: Decimal, from_currency: str, to_currency: str, tenant_id: int) -> Decimal:
    rate = get_effective_rate(db, from_currency, to_currency, tenant_id=tenant_id)
    settings = get_currency_settings(db, tenant_id)
    converted = Decimal(str(amount)) * Decimal(str(rate))
    return _apply_rounding(converted, settings.rounding_mode)


def format_money(amount: Decimal, currency: str, locale: str = "es-MX") -> str:
    symbol = {"MXN": "$", "USD": "US$", "EUR": "€"}.get(currency.upper(), "")
    return f"{symbol}{Decimal(str(amount)).quantize(Decimal('0.01'))} {currency.upper()} ({locale})"
