from pydantic import BaseModel, Field

from app.schemas.common import TimestampSchema


class PlatformSettingsRead(TimestampSchema):
    id: int
    global_base_currency: str
    global_enabled_currencies: list[str]
    global_exchange_mode: str
    global_auto_update_enabled: bool
    platform_default_language: str
    platform_enabled_languages: list[str]


class PlatformSettingsUpdate(BaseModel):
    global_base_currency: str | None = None
    global_enabled_currencies: list[str] | None = None
    global_exchange_mode: str | None = None
    global_auto_update_enabled: bool | None = None
    platform_default_language: str | None = None
    platform_enabled_languages: list[str] | None = None


class BrandAdminSettingsRead(BaseModel):
    tenant_id: int
    currency_inherit_global: bool
    currency_base_currency: str
    currency_visible_currencies: list[str]
    language_primary: str
    language_visible: list[str]
    market_profile: str = Field(default="latam_es_usd")
    country_code: str = Field(default="MX")
    expansion_enabled: bool = False
    cross_border_enabled: bool = False
    feature_logistics_enabled: bool = False
    feature_workday_enabled: bool = False
    feature_nfc_operations_enabled: bool = False


class BrandAdminSettingsUpdate(BaseModel):
    currency_inherit_global: bool
    currency_base_currency: str | None = None
    currency_visible_currencies: list[str] | None = None
    language_primary: str | None = None
    language_visible: list[str] | None = None
    market_profile: str | None = None
    country_code: str | None = None
    expansion_enabled: bool | None = None
    cross_border_enabled: bool | None = None
    feature_logistics_enabled: bool | None = None
    feature_workday_enabled: bool | None = None
    feature_nfc_operations_enabled: bool | None = None
