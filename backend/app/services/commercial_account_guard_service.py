from __future__ import annotations

import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import CommercialClientAccount, PosLocation, Product, Tenant, User

ADDON_BRAND_ID = "extra_brand"
ADDON_USER_ID = "extra_user"
ADDON_PRODUCTS_ID = "extra_100_products"
ADDON_BRANCH_ID = "extra_branch"


def _parse_json_dict(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _addon_qty(account: CommercialClientAccount, addon_id: str) -> int:
    addons = _parse_json_dict(account.addons_json)
    value = addons.get(addon_id, 0)
    try:
        return max(0, int(value))
    except Exception:
        return 0


def _base_limit(account: CommercialClientAccount, key: str) -> int:
    limits = _parse_json_dict(account.commercial_limits_json)
    value = limits.get(key, 0)
    try:
        return max(0, int(value))
    except Exception:
        return 0


def _effective_brands_limit(account: CommercialClientAccount) -> int:
    return _base_limit(account, "brands_max") + _addon_qty(account, ADDON_BRAND_ID)


def _effective_users_limit(account: CommercialClientAccount) -> int:
    return _base_limit(account, "users_max") + _addon_qty(account, ADDON_USER_ID)


def _effective_products_limit(account: CommercialClientAccount) -> int:
    return _base_limit(account, "products_max") + (_addon_qty(account, ADDON_PRODUCTS_ID) * 100)


def _effective_branches_limit(account: CommercialClientAccount) -> int:
    return _base_limit(account, "branches_max") + _addon_qty(account, ADDON_BRANCH_ID)


def get_tenant_commercial_account(db: Session, tenant_id: int) -> CommercialClientAccount | None:
    tenant = db.get(Tenant, tenant_id)
    if not tenant or not tenant.commercial_client_account_id:
        return None
    return db.get(CommercialClientAccount, tenant.commercial_client_account_id)


def enforce_brand_limit_for_account(db: Session, account: CommercialClientAccount) -> None:
    used = int(
        db.scalar(select(func.count(Tenant.id)).where(Tenant.commercial_client_account_id == account.id)) or 0
    )
    allowed = _effective_brands_limit(account)
    if allowed > 0 and used >= allowed:
        raise ValueError("limite de marcas alcanzado para este cliente comercial")


def enforce_user_limit_for_tenant(db: Session, tenant_id: int) -> None:
    account = get_tenant_commercial_account(db, tenant_id)
    if not account:
        return
    tenant_ids = [row[0] for row in db.execute(select(Tenant.id).where(Tenant.commercial_client_account_id == account.id)).all()]
    used = int(db.scalar(select(func.count(User.id)).where(User.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    allowed = _effective_users_limit(account)
    if allowed > 0 and used >= allowed:
        raise ValueError("limite de usuarios alcanzado para este cliente comercial")


def enforce_product_limit_for_tenant(db: Session, tenant_id: int) -> None:
    account = get_tenant_commercial_account(db, tenant_id)
    if not account:
        return
    tenant_ids = [row[0] for row in db.execute(select(Tenant.id).where(Tenant.commercial_client_account_id == account.id)).all()]
    used = int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    allowed = _effective_products_limit(account)
    if allowed > 0 and used >= allowed:
        raise ValueError("limite de productos alcanzado para este cliente comercial")


def enforce_branch_limit_for_tenant(db: Session, tenant_id: int) -> None:
    account = get_tenant_commercial_account(db, tenant_id)
    if not account:
        return
    tenant_ids = [row[0] for row in db.execute(select(Tenant.id).where(Tenant.commercial_client_account_id == account.id)).all()]
    used = int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    allowed = _effective_branches_limit(account)
    if allowed > 0 and used >= allowed:
        raise ValueError("limite de sucursales alcanzado para este cliente comercial")


def build_account_usage_payload(db: Session, account: CommercialClientAccount) -> dict:
    tenant_ids = [row[0] for row in db.execute(select(Tenant.id).where(Tenant.commercial_client_account_id == account.id)).all()]
    brands_used = len(tenant_ids)
    users_used = int(db.scalar(select(func.count(User.id)).where(User.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    products_used = int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    branches_used = int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id.in_(tenant_ids))) or 0) if tenant_ids else 0
    tokens_included = int(db.scalar(select(func.sum(Tenant.ai_tokens_included)).where(Tenant.id.in_(tenant_ids))) or 0) if tenant_ids else 0
    tokens_used = int(db.scalar(select(func.sum(Tenant.ai_tokens_used)).where(Tenant.id.in_(tenant_ids))) or 0) if tenant_ids else 0
    tokens_balance = int(db.scalar(select(func.sum(Tenant.ai_tokens_balance)).where(Tenant.id.in_(tenant_ids))) or 0) if tenant_ids else 0
    return {
        "account_id": account.id,
        "brands_used": brands_used,
        "brands_limit": _effective_brands_limit(account),
        "users_used": users_used,
        "users_limit": _effective_users_limit(account),
        "products_used": products_used,
        "products_limit": _effective_products_limit(account),
        "branches_used": branches_used,
        "branches_limit": _effective_branches_limit(account),
        "ai_tokens_included": tokens_included,
        "ai_tokens_used": tokens_used,
        "ai_tokens_balance": tokens_balance,
    }
