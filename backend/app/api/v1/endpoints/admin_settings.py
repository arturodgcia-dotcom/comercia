import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import PlatformSettings, StorefrontConfig, Tenant, User
from app.schemas.admin_settings import (
    BrandAdminSettingsRead,
    BrandAdminSettingsUpdate,
    PlatformSettingsRead,
    PlatformSettingsUpdate,
)
from app.services.currency_service import get_currency_settings, upsert_currency_settings

router = APIRouter()


def _normalize_codes(values: list[str] | None, fallback: list[str]) -> list[str]:
    if not values:
        return fallback
    normalized = sorted({item.strip().lower() for item in values if item and item.strip()})
    return normalized or fallback


def _normalize_currency_codes(values: list[str] | None, fallback: list[str]) -> list[str]:
    if not values:
        return fallback
    normalized = sorted({item.strip().upper() for item in values if item and item.strip()})
    return normalized or fallback


def _platform_settings_read(row: PlatformSettings) -> PlatformSettingsRead:
    return PlatformSettingsRead(
        id=row.id,
        global_base_currency=row.global_base_currency,
        global_enabled_currencies=json.loads(row.global_enabled_currencies_json or "[]"),
        global_exchange_mode=row.global_exchange_mode,
        global_auto_update_enabled=row.global_auto_update_enabled,
        platform_default_language=row.platform_default_language,
        platform_enabled_languages=json.loads(row.platform_enabled_languages_json or "[]"),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _get_or_create_platform_settings(db: Session) -> PlatformSettings:
    row = db.get(PlatformSettings, 1)
    if row:
        return row
    row = PlatformSettings(id=1)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _assert_tenant_scope_access(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="sin acceso a esta marca")


@router.get("/platform-settings", response_model=PlatformSettingsRead, dependencies=[Depends(get_reinpia_admin)])
def get_platform_settings(db: Session = Depends(get_db)):
    row = _get_or_create_platform_settings(db)
    return _platform_settings_read(row)


@router.put("/platform-settings", response_model=PlatformSettingsRead, dependencies=[Depends(get_reinpia_admin)])
def update_platform_settings(payload: PlatformSettingsUpdate, db: Session = Depends(get_db)):
    row = _get_or_create_platform_settings(db)
    data = payload.model_dump(exclude_unset=True)
    if "global_base_currency" in data and data["global_base_currency"]:
        row.global_base_currency = str(data["global_base_currency"]).upper()
    if "global_enabled_currencies" in data:
        row.global_enabled_currencies_json = json.dumps(
            _normalize_currency_codes(data.get("global_enabled_currencies"), ["MXN", "USD", "EUR"])
        )
    if "global_exchange_mode" in data and data["global_exchange_mode"]:
        row.global_exchange_mode = str(data["global_exchange_mode"])
    if "global_auto_update_enabled" in data:
        row.global_auto_update_enabled = bool(data["global_auto_update_enabled"])
    if "platform_default_language" in data and data["platform_default_language"]:
        row.platform_default_language = str(data["platform_default_language"]).lower()
    if "platform_enabled_languages" in data:
        row.platform_enabled_languages_json = json.dumps(
            _normalize_codes(data.get("platform_enabled_languages"), ["es", "en"])
        )

    db.commit()
    db.refresh(row)
    return _platform_settings_read(row)


@router.get("/brand-settings/{tenant_id}", response_model=BrandAdminSettingsRead)
def get_brand_settings(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    _assert_tenant_scope_access(current_user, tenant_id)

    platform = _get_or_create_platform_settings(db)
    currency = get_currency_settings(db, tenant_id)
    storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    config_json = {}
    if storefront and storefront.config_json:
        try:
            config_json = json.loads(storefront.config_json)
        except Exception:
            config_json = {}
    admin_settings = config_json.get("admin_settings", {}) if isinstance(config_json, dict) else {}
    language_cfg = admin_settings.get("language", {}) if isinstance(admin_settings, dict) else {}
    currency_cfg = admin_settings.get("currency", {}) if isinstance(admin_settings, dict) else {}
    international_cfg = admin_settings.get("international", {}) if isinstance(admin_settings, dict) else {}
    feature_cfg = admin_settings.get("features", {}) if isinstance(admin_settings, dict) else {}

    default_languages = json.loads(platform.platform_enabled_languages_json or '["es","en"]')
    default_primary = platform.platform_default_language or "es"
    default_visible = [default_primary] if default_primary else ["es"]
    return BrandAdminSettingsRead(
        tenant_id=tenant_id,
        currency_inherit_global=bool(currency_cfg.get("inherit_global", False)),
        currency_base_currency=currency.base_currency,
        currency_visible_currencies=json.loads(currency.enabled_currencies_json or '["MXN"]'),
        language_primary=str(language_cfg.get("primary", default_primary)).lower(),
        language_visible=_normalize_codes(language_cfg.get("visible"), default_visible),
        market_profile=str(language_cfg.get("market_profile", "latam_es_usd")),
        country_code=str(international_cfg.get("country_code", "MX")).upper(),
        expansion_enabled=bool(international_cfg.get("expansion_enabled", False)),
        cross_border_enabled=bool(international_cfg.get("cross_border_enabled", False)),
        feature_logistics_enabled=bool(feature_cfg.get("logistics_enabled", False)),
        feature_workday_enabled=bool(feature_cfg.get("workday_enabled", False)),
        feature_nfc_operations_enabled=bool(feature_cfg.get("nfc_operations_enabled", False)),
    )


@router.put("/brand-settings/{tenant_id}", response_model=BrandAdminSettingsRead)
def update_brand_settings(
    tenant_id: int,
    payload: BrandAdminSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    _assert_tenant_scope_access(current_user, tenant_id)

    platform = _get_or_create_platform_settings(db)
    platform_enabled_currencies = json.loads(platform.global_enabled_currencies_json or '["MXN","USD","EUR"]')
    platform_primary_lang = platform.platform_default_language or "es"

    storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    if not storefront:
        storefront = StorefrontConfig(tenant_id=tenant_id, is_initialized=True, ecommerce_enabled=True, landing_enabled=True)
        db.add(storefront)
        db.flush()

    base_config = {}
    if storefront.config_json:
        try:
            base_config = json.loads(storefront.config_json)
        except Exception:
            base_config = {}
    if not isinstance(base_config, dict):
        base_config = {}
    admin_settings = base_config.get("admin_settings", {}) if isinstance(base_config.get("admin_settings"), dict) else {}
    existing_international = admin_settings.get("international", {}) if isinstance(admin_settings.get("international"), dict) else {}
    existing_features = admin_settings.get("features", {}) if isinstance(admin_settings.get("features"), dict) else {}

    inherit_global = bool(payload.currency_inherit_global)
    if inherit_global:
        currency_base = platform.global_base_currency
        currency_visible = platform_enabled_currencies
    else:
        currency_base = (payload.currency_base_currency or "MXN").upper()
        currency_visible = _normalize_currency_codes(payload.currency_visible_currencies, [currency_base])

    upsert_currency_settings(
        db,
        tenant_id,
        base_currency=currency_base,
        enabled_currencies=currency_visible,
    )

    language_primary = str(payload.language_primary or platform_primary_lang).lower()
    language_visible = _normalize_codes(payload.language_visible, [language_primary])
    market_profile = str(payload.market_profile or "latam_es_usd")
    country_code = str(payload.country_code or existing_international.get("country_code") or "MX").upper()
    expansion_enabled = bool(payload.expansion_enabled) if payload.expansion_enabled is not None else bool(existing_international.get("expansion_enabled", False))
    cross_border_enabled = bool(payload.cross_border_enabled) if payload.cross_border_enabled is not None else bool(existing_international.get("cross_border_enabled", False))
    feature_logistics_enabled = bool(payload.feature_logistics_enabled) if payload.feature_logistics_enabled is not None else bool(existing_features.get("logistics_enabled", False))
    feature_workday_enabled = bool(payload.feature_workday_enabled) if payload.feature_workday_enabled is not None else bool(existing_features.get("workday_enabled", False))
    feature_nfc_operations_enabled = bool(payload.feature_nfc_operations_enabled) if payload.feature_nfc_operations_enabled is not None else bool(existing_features.get("nfc_operations_enabled", False))

    admin_settings["currency"] = {
        "inherit_global": inherit_global,
    }
    admin_settings["language"] = {
        "primary": language_primary,
        "visible": language_visible,
        "market_profile": market_profile,
    }
    admin_settings["international"] = {
        "country_code": country_code,
        "expansion_enabled": expansion_enabled,
        "cross_border_enabled": cross_border_enabled,
    }
    admin_settings["features"] = {
        "logistics_enabled": feature_logistics_enabled,
        "workday_enabled": feature_workday_enabled,
        "nfc_operations_enabled": feature_nfc_operations_enabled,
    }
    base_config["admin_settings"] = admin_settings
    storefront.config_json = json.dumps(base_config)
    db.commit()

    return BrandAdminSettingsRead(
        tenant_id=tenant_id,
        currency_inherit_global=inherit_global,
        currency_base_currency=currency_base,
        currency_visible_currencies=currency_visible,
        language_primary=language_primary,
        language_visible=language_visible,
        market_profile=market_profile,
        country_code=country_code,
        expansion_enabled=expansion_enabled,
        cross_border_enabled=cross_border_enabled,
        feature_logistics_enabled=feature_logistics_enabled,
        feature_workday_enabled=feature_workday_enabled,
        feature_nfc_operations_enabled=feature_nfc_operations_enabled,
    )
