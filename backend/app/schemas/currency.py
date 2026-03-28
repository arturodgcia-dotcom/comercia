from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class CurrencySettingsBase(BaseModel):
    base_currency: str = "MXN"
    enabled_currencies: list[str] = ["MXN"]
    display_mode: str = "base_only"
    exchange_mode: str = "manual"
    auto_update_enabled: bool = False
    rounding_mode: str = "none"


class CurrencySettingsCreate(CurrencySettingsBase):
    pass


class CurrencySettingsUpdate(BaseModel):
    base_currency: str | None = None
    enabled_currencies: list[str] | None = None
    display_mode: str | None = None
    exchange_mode: str | None = None
    auto_update_enabled: bool | None = None
    rounding_mode: str | None = None


class CurrencySettingsRead(TimestampSchema):
    id: int
    tenant_id: int
    base_currency: str
    enabled_currencies: list[str]
    display_mode: str
    exchange_mode: str
    auto_update_enabled: bool
    rounding_mode: str


class ExchangeRateCreate(BaseModel):
    base_currency: str
    target_currency: str
    rate: Decimal
    source_name: str = "manual"


class ExchangeRateRead(BaseModel):
    id: int
    base_currency: str
    target_currency: str
    rate: Decimal
    source_name: str
    is_manual: bool
    valid_at: datetime
    created_at: datetime


class CurrencyPreviewRequest(BaseModel):
    tenant_id: int
    amount: Decimal
    from_currency: str
    to_currency: str


class CurrencyPreviewResponse(BaseModel):
    converted_amount: Decimal
    rate: Decimal
