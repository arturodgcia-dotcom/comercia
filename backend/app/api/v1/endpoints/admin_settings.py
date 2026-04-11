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


def _normalize_addon_status(value: str | None, fallback: str = "deshabilitado") -> str:
    status = str(value or fallback).strip().lower()
    if status not in {"deshabilitado", "configurando", "activo", "suspendido"}:
        return fallback
    return status


def _status_is_enabled(status: str) -> bool:
    normalized = _normalize_addon_status(status)
    return normalized in {"configurando", "activo"}


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
    if current_user.role in {"reinpia_admin", "super_admin"}:
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
    addons_cfg = admin_settings.get("addons", {}) if isinstance(admin_settings, dict) else {}

    default_languages = json.loads(platform.platform_enabled_languages_json or '["es","en"]')
    default_primary = platform.platform_default_language or "es"
    default_visible = [default_primary] if default_primary else ["es"]
    country_code = str(international_cfg.get("country_code", "MX")).upper()
    countries_enabled = sorted(
        {
            str(item).strip().upper()
            for item in (international_cfg.get("countries_enabled") or [country_code])
            if str(item).strip()
        }
    )
    if country_code not in countries_enabled:
        countries_enabled = sorted({*countries_enabled, country_code})

    country_channels_raw = international_cfg.get("country_channels", [])
    if not isinstance(country_channels_raw, list):
        country_channels_raw = []
    country_channels = []
    for row in country_channels_raw:
        if not isinstance(row, dict):
            continue
        code = str(row.get("country_code") or "").strip().upper()
        if not code:
            continue
        country_channels.append(
            {
                "country_code": code,
                "currency": str(row.get("currency") or currency.base_currency).strip().upper() or currency.base_currency,
                "language": str(row.get("language") or default_primary).strip().lower() or default_primary,
                "landing_enabled": bool(row.get("landing_enabled", True)),
                "ecommerce_enabled": bool(row.get("ecommerce_enabled", True)),
                "webapp_enabled": bool(row.get("webapp_enabled", True)),
            }
        )
    existing_cc = {item["country_code"] for item in country_channels}
    for code in countries_enabled:
        if code in existing_cc:
            continue
        country_channels.append(
            {
                "country_code": code,
                "currency": currency.base_currency,
                "language": default_primary,
                "landing_enabled": True,
                "ecommerce_enabled": True,
                "webapp_enabled": True,
            }
        )

    addon_logistics_status = _normalize_addon_status(
        addons_cfg.get("logistics", {}).get("status") if isinstance(addons_cfg.get("logistics"), dict) else "deshabilitado"
    )
    addon_workday_status = _normalize_addon_status(
        addons_cfg.get("workday", {}).get("status") if isinstance(addons_cfg.get("workday"), dict) else "deshabilitado"
    )
    addon_nfc_status = _normalize_addon_status(
        addons_cfg.get("nfc", {}).get("status") if isinstance(addons_cfg.get("nfc"), dict) else "deshabilitado"
    )

    feature_logistics_enabled = _status_is_enabled(addon_logistics_status) or bool(feature_cfg.get("logistics_enabled", False))
    feature_workday_enabled = _status_is_enabled(addon_workday_status) or bool(feature_cfg.get("workday_enabled", False))
    feature_nfc_operations_enabled = _status_is_enabled(addon_nfc_status) or bool(feature_cfg.get("nfc_operations_enabled", False))

    return BrandAdminSettingsRead(
        tenant_id=tenant_id,
        currency_inherit_global=bool(currency_cfg.get("inherit_global", False)),
        currency_base_currency=currency.base_currency,
        currency_visible_currencies=json.loads(currency.enabled_currencies_json or '["MXN"]'),
        language_primary=str(language_cfg.get("primary", default_primary)).lower(),
        language_visible=_normalize_codes(language_cfg.get("visible"), default_visible),
        market_profile=str(language_cfg.get("market_profile", "latam_es_usd")),
        country_code=country_code,
        countries_enabled=countries_enabled,
        country_channels=country_channels,
        expansion_enabled=bool(international_cfg.get("expansion_enabled", False)),
        cross_border_enabled=bool(international_cfg.get("cross_border_enabled", False)),
        addon_logistics_status=addon_logistics_status,
        addon_logistics_plan=(
            str(addons_cfg.get("logistics", {}).get("plan")).strip() or None
            if isinstance(addons_cfg.get("logistics"), dict) and addons_cfg.get("logistics", {}).get("plan") is not None
            else None
        ),
        addon_logistics_scope_branch_ids=[int(x) for x in (addons_cfg.get("logistics", {}).get("scope_branch_ids", []) if isinstance(addons_cfg.get("logistics"), dict) else []) if str(x).strip()],
        addon_workday_status=addon_workday_status,
        addon_workday_plan=(
            str(addons_cfg.get("workday", {}).get("plan")).strip() or None
            if isinstance(addons_cfg.get("workday"), dict) and addons_cfg.get("workday", {}).get("plan") is not None
            else None
        ),
        addon_workday_scope_branch_ids=[int(x) for x in (addons_cfg.get("workday", {}).get("scope_branch_ids", []) if isinstance(addons_cfg.get("workday"), dict) else []) if str(x).strip()],
        addon_nfc_status=addon_nfc_status,
        addon_nfc_plan=(
            str(addons_cfg.get("nfc", {}).get("plan")).strip() or None
            if isinstance(addons_cfg.get("nfc"), dict) and addons_cfg.get("nfc", {}).get("plan") is not None
            else None
        ),
        addon_nfc_scope_branch_ids=[int(x) for x in (addons_cfg.get("nfc", {}).get("scope_branch_ids", []) if isinstance(addons_cfg.get("nfc"), dict) else []) if str(x).strip()],
        feature_logistics_enabled=feature_logistics_enabled,
        feature_workday_enabled=feature_workday_enabled,
        feature_nfc_operations_enabled=feature_nfc_operations_enabled,
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
    update_data = payload.model_dump(exclude_unset=True)

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
    existing_addons = admin_settings.get("addons", {}) if isinstance(admin_settings.get("addons"), dict) else {}

    protected_fields = {
        "country_code",
        "countries_enabled",
        "country_channels",
        "expansion_enabled",
        "cross_border_enabled",
        "addon_logistics_status",
        "addon_logistics_plan",
        "addon_logistics_scope_branch_ids",
        "addon_workday_status",
        "addon_workday_plan",
        "addon_workday_scope_branch_ids",
        "addon_nfc_status",
        "addon_nfc_plan",
        "addon_nfc_scope_branch_ids",
        "feature_logistics_enabled",
        "feature_workday_enabled",
        "feature_nfc_operations_enabled",
    }
    if current_user.role not in {"reinpia_admin", "super_admin"} and any(field in update_data for field in protected_fields):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="solo ComerCia global puede activar add-ons e internacional por marca",
        )

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
    countries_enabled = sorted(
        {
            str(item).strip().upper()
            for item in (payload.countries_enabled or existing_international.get("countries_enabled") or [country_code])
            if str(item).strip()
        }
    )
    if country_code not in countries_enabled:
        countries_enabled = sorted({*countries_enabled, country_code})

    existing_country_channels = existing_international.get("country_channels", [])
    if not isinstance(existing_country_channels, list):
        existing_country_channels = []
    input_country_channels = payload.country_channels if payload.country_channels is not None else existing_country_channels
    normalized_country_channels: list[dict] = []
    for row in input_country_channels:
        if not isinstance(row, dict):
            continue
        row_country = str(row.get("country_code") or "").strip().upper()
        if not row_country:
            continue
        normalized_country_channels.append(
            {
                "country_code": row_country,
                "currency": str(row.get("currency") or currency_base).strip().upper() or currency_base,
                "language": str(row.get("language") or language_primary).strip().lower() or language_primary,
                "landing_enabled": bool(row.get("landing_enabled", True)),
                "ecommerce_enabled": bool(row.get("ecommerce_enabled", True)),
                "webapp_enabled": bool(row.get("webapp_enabled", True)),
            }
        )
    existing_country_set = {item.get("country_code") for item in normalized_country_channels}
    for code in countries_enabled:
        if code in existing_country_set:
            continue
        normalized_country_channels.append(
            {
                "country_code": code,
                "currency": currency_base,
                "language": language_primary,
                "landing_enabled": True,
                "ecommerce_enabled": True,
                "webapp_enabled": True,
            }
        )

    expansion_enabled = bool(payload.expansion_enabled) if payload.expansion_enabled is not None else bool(existing_international.get("expansion_enabled", False))
    cross_border_enabled = bool(payload.cross_border_enabled) if payload.cross_border_enabled is not None else bool(existing_international.get("cross_border_enabled", False))
    addon_logistics_status = _normalize_addon_status(payload.addon_logistics_status, _normalize_addon_status(existing_addons.get("logistics", {}).get("status") if isinstance(existing_addons.get("logistics"), dict) else "deshabilitado"))
    addon_logistics_plan = payload.addon_logistics_plan if payload.addon_logistics_plan is not None else (
        str(existing_addons.get("logistics", {}).get("plan", "")).strip() or None
        if isinstance(existing_addons.get("logistics"), dict)
        else None
    )
    addon_logistics_scope_branch_ids = payload.addon_logistics_scope_branch_ids if payload.addon_logistics_scope_branch_ids is not None else (
        [int(x) for x in (existing_addons.get("logistics", {}).get("scope_branch_ids", []) if isinstance(existing_addons.get("logistics"), dict) else []) if str(x).strip()]
    )
    addon_workday_status = _normalize_addon_status(payload.addon_workday_status, _normalize_addon_status(existing_addons.get("workday", {}).get("status") if isinstance(existing_addons.get("workday"), dict) else "deshabilitado"))
    addon_workday_plan = payload.addon_workday_plan if payload.addon_workday_plan is not None else (
        str(existing_addons.get("workday", {}).get("plan", "")).strip() or None
        if isinstance(existing_addons.get("workday"), dict)
        else None
    )
    addon_workday_scope_branch_ids = payload.addon_workday_scope_branch_ids if payload.addon_workday_scope_branch_ids is not None else (
        [int(x) for x in (existing_addons.get("workday", {}).get("scope_branch_ids", []) if isinstance(existing_addons.get("workday"), dict) else []) if str(x).strip()]
    )
    addon_nfc_status = _normalize_addon_status(payload.addon_nfc_status, _normalize_addon_status(existing_addons.get("nfc", {}).get("status") if isinstance(existing_addons.get("nfc"), dict) else "deshabilitado"))
    addon_nfc_plan = payload.addon_nfc_plan if payload.addon_nfc_plan is not None else (
        str(existing_addons.get("nfc", {}).get("plan", "")).strip() or None
        if isinstance(existing_addons.get("nfc"), dict)
        else None
    )
    addon_nfc_scope_branch_ids = payload.addon_nfc_scope_branch_ids if payload.addon_nfc_scope_branch_ids is not None else (
        [int(x) for x in (existing_addons.get("nfc", {}).get("scope_branch_ids", []) if isinstance(existing_addons.get("nfc"), dict) else []) if str(x).strip()]
    )

    feature_logistics_enabled = _status_is_enabled(addon_logistics_status)
    feature_workday_enabled = _status_is_enabled(addon_workday_status)
    feature_nfc_operations_enabled = _status_is_enabled(addon_nfc_status)

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
        "countries_enabled": countries_enabled,
        "country_channels": normalized_country_channels,
        "expansion_enabled": expansion_enabled,
        "cross_border_enabled": cross_border_enabled,
    }
    admin_settings["addons"] = {
        "logistics": {
            "status": addon_logistics_status,
            "plan": addon_logistics_plan,
            "scope_branch_ids": addon_logistics_scope_branch_ids,
        },
        "workday": {
            "status": addon_workday_status,
            "plan": addon_workday_plan,
            "scope_branch_ids": addon_workday_scope_branch_ids,
        },
        "nfc": {
            "status": addon_nfc_status,
            "plan": addon_nfc_plan,
            "scope_branch_ids": addon_nfc_scope_branch_ids,
        },
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
        countries_enabled=countries_enabled,
        country_channels=normalized_country_channels,
        expansion_enabled=expansion_enabled,
        cross_border_enabled=cross_border_enabled,
        addon_logistics_status=addon_logistics_status,
        addon_logistics_plan=addon_logistics_plan,
        addon_logistics_scope_branch_ids=addon_logistics_scope_branch_ids,
        addon_workday_status=addon_workday_status,
        addon_workday_plan=addon_workday_plan,
        addon_workday_scope_branch_ids=addon_workday_scope_branch_ids,
        addon_nfc_status=addon_nfc_status,
        addon_nfc_plan=addon_nfc_plan,
        addon_nfc_scope_branch_ids=addon_nfc_scope_branch_ids,
        feature_logistics_enabled=feature_logistics_enabled,
        feature_workday_enabled=feature_workday_enabled,
        feature_nfc_operations_enabled=feature_nfc_operations_enabled,
    )
