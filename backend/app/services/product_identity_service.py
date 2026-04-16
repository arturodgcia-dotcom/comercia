from __future__ import annotations

import json
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Category, Product, StorefrontConfig, Tenant

DEFAULT_BARCODE_TYPE = "code128"


def _clean_token(value: str, *, fallback: str, size: int = 4) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "", (value or "").upper())
    if not cleaned:
        cleaned = fallback
    return cleaned[:size]


def _extract_settings_format(db: Session, tenant_id: int) -> str:
    row = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    if not row or not row.config_json:
        return "MARCA-CAT-0001"
    try:
        parsed = json.loads(row.config_json)
    except Exception:
        return "MARCA-CAT-0001"
    if not isinstance(parsed, dict):
        return "MARCA-CAT-0001"
    inventory = parsed.get("inventory_settings")
    if isinstance(inventory, dict):
        candidate = str(inventory.get("sku_format") or "").strip()
        if candidate:
            return candidate
    return "MARCA-CAT-0001"


def _next_running_number(db: Session, tenant_id: int, prefix: str) -> int:
    rows = db.scalars(select(Product.sku).where(Product.tenant_id == tenant_id, Product.sku.like(f"{prefix}%"))).all()
    highest = 0
    for raw in rows:
        value = str(raw or "").strip()
        match = re.search(r"(\d+)$", value)
        if not match:
            continue
        highest = max(highest, int(match.group(1)))
    return highest + 1


def generate_sku(db: Session, *, tenant_id: int, category_id: int | None) -> str:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise ValueError("tenant no encontrado")
    category = db.get(Category, category_id) if category_id else None

    brand_token = _clean_token(tenant.slug or tenant.name, fallback="BRAND", size=5)
    category_token = _clean_token(category.slug if category else "GEN", fallback="GEN", size=3)
    sku_format = _extract_settings_format(db, tenant_id)

    prefix = sku_format
    prefix = prefix.replace("MARCA", brand_token)
    prefix = prefix.replace("CAT", category_token)
    if "0001" in prefix:
        prefix_base = prefix.split("0001")[0]
    else:
        prefix_base = f"{brand_token}-{category_token}-"

    running = _next_running_number(db, tenant_id, prefix_base)
    return f"{prefix_base}{running:04d}"


def _ean13_checksum(payload12: str) -> str:
    digits = [int(char) for char in payload12]
    odd = sum(digits[::2])
    even = sum(digits[1::2])
    check = (10 - ((odd + even * 3) % 10)) % 10
    return str(check)


def _sku_to_digits(seed: str, length: int) -> str:
    digits = "".join(ch for ch in seed if ch.isdigit())
    if len(digits) >= length:
        return digits[:length]
    fallback = "".join(str((ord(ch) % 10)) for ch in seed if ch.isalnum())
    source = (digits + fallback + "12345678901234567890")[:length]
    return source


def generate_barcode(
    *,
    sku: str,
    barcode_type: str | None = None,
    preferred_ean13: bool = False,
) -> tuple[str, str]:
    normalized_type = (barcode_type or "").strip().lower()
    if preferred_ean13 or normalized_type == "ean13":
        base12 = _sku_to_digits(sku, 12)
        return (f"{base12}{_ean13_checksum(base12)}", "ean13")
    code128_value = f"C128-{re.sub(r'[^A-Za-z0-9]+', '', sku.upper())}"
    return (code128_value[:120], "code128")


def ensure_unique_product_identity(
    db: Session,
    *,
    tenant_id: int,
    sku: str,
    barcode: str,
    ignore_product_id: int | None = None,
) -> None:
    sku_query = select(Product.id).where(Product.tenant_id == tenant_id, Product.sku == sku)
    barcode_query = select(Product.id).where(Product.tenant_id == tenant_id, Product.barcode == barcode)
    if ignore_product_id is not None:
        sku_query = sku_query.where(Product.id != ignore_product_id)
        barcode_query = barcode_query.where(Product.id != ignore_product_id)
    if db.scalar(sku_query.limit(1)):
        raise ValueError("SKU ya existe en la marca")
    if db.scalar(barcode_query.limit(1)):
        raise ValueError("Barcode ya existe en la marca")


def resolve_product_identity(
    db: Session,
    *,
    tenant_id: int,
    category_id: int | None,
    incoming_sku: str | None,
    incoming_barcode: str | None,
    incoming_barcode_type: str | None,
    incoming_external_barcode: bool | None,
) -> dict[str, object]:
    provided_sku = str(incoming_sku or "").strip().upper()
    provided_barcode = str(incoming_barcode or "").strip().upper()
    provided_type = str(incoming_barcode_type or "").strip().lower() or DEFAULT_BARCODE_TYPE

    external_barcode = bool(incoming_external_barcode) or bool(provided_barcode)
    auto_generated = False

    sku = provided_sku
    if not sku:
        sku = generate_sku(db, tenant_id=tenant_id, category_id=category_id)
        auto_generated = True

    barcode = provided_barcode
    barcode_type = provided_type
    if not barcode:
        barcode, barcode_type = generate_barcode(sku=sku, barcode_type=provided_type)
        auto_generated = True
        external_barcode = False

    return {
        "sku": sku,
        "barcode": barcode,
        "barcode_type": barcode_type,
        "external_barcode": external_barcode,
        "auto_generated": auto_generated,
    }


def resolve_scan_match_code(raw: str) -> str:
    return str(raw or "").strip().upper()
