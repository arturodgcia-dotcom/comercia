import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import ExchangeRate, User
from app.schemas.currency import (
    CurrencyPreviewRequest,
    CurrencyPreviewResponse,
    CurrencySettingsCreate,
    CurrencySettingsRead,
    CurrencySettingsUpdate,
    ExchangeRateCreate,
    ExchangeRateRead,
)
from app.services.currency_service import (
    convert_amount,
    create_manual_exchange_rate,
    get_currency_settings,
    get_effective_rate,
    refresh_exchange_rates,
    upsert_currency_settings,
)

router = APIRouter()


def _to_currency_settings_read(settings) -> CurrencySettingsRead:
    data = CurrencySettingsRead.model_validate(settings).model_dump()
    data["enabled_currencies"] = json.loads(settings.enabled_currencies_json or "[]")
    return CurrencySettingsRead.model_validate(data)


@router.get("/currency-settings/{tenant_id}", response_model=CurrencySettingsRead)
def get_tenant_currency_settings(tenant_id: int, db: Session = Depends(get_db)):
    return _to_currency_settings_read(get_currency_settings(db, tenant_id))


@router.post("/currency-settings/{tenant_id}", response_model=CurrencySettingsRead)
def create_currency_settings(
    tenant_id: int,
    payload: CurrencySettingsCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    settings = upsert_currency_settings(db, tenant_id, **payload.model_dump())
    return _to_currency_settings_read(settings)


@router.put("/currency-settings/{tenant_id}", response_model=CurrencySettingsRead)
def update_currency_settings(
    tenant_id: int,
    payload: CurrencySettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    settings = upsert_currency_settings(db, tenant_id, **payload.model_dump(exclude_unset=True))
    return _to_currency_settings_read(settings)


@router.get("/exchange-rates", response_model=list[ExchangeRateRead])
def list_exchange_rates(
    base_currency: str | None = None,
    target_currency: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(ExchangeRate)
    if base_currency:
        query = query.where(ExchangeRate.base_currency == base_currency.upper())
    if target_currency:
        query = query.where(ExchangeRate.target_currency == target_currency.upper())
    return db.scalars(query.order_by(ExchangeRate.valid_at.desc(), ExchangeRate.id.desc())).all()


@router.post("/exchange-rates/manual", response_model=ExchangeRateRead)
def create_exchange_rate_manual(
    payload: ExchangeRateCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    return create_manual_exchange_rate(
        db,
        base_currency=payload.base_currency,
        target_currency=payload.target_currency,
        rate=payload.rate,
        source_name=payload.source_name,
    )


@router.post("/exchange-rates/refresh", response_model=list[ExchangeRateRead])
def refresh_exchange_rates_endpoint(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return refresh_exchange_rates(db)


@router.post("/exchange-rates/preview", response_model=CurrencyPreviewResponse)
def preview_conversion(payload: CurrencyPreviewRequest, db: Session = Depends(get_db)):
    converted = convert_amount(
        db, payload.amount, from_currency=payload.from_currency, to_currency=payload.to_currency, tenant_id=payload.tenant_id
    )
    rate = get_effective_rate(db, payload.from_currency, payload.to_currency, tenant_id=payload.tenant_id)
    return CurrencyPreviewResponse(converted_amount=converted, rate=rate)
