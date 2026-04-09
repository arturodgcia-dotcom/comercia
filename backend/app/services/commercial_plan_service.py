from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from app.models.models import Tenant

IVA_RATE = Decimal("0.16")

DEFAULT_SCOPE = "ventas_online_pagadas"

COMMERCIAL_PLAN_CATALOG: dict[str, dict[str, Any]] = {
    "fixed_subscription_basic": {
        "id": "fixed_subscription_basic",
        "billing_model": "fixed_subscription",
        "tier": "basic",
        "name": "Plan Basico",
        "monthly_price_mxn": Decimal("3500.00"),
        "commission_percentage": Decimal("0.00"),
        "commission_enabled": False,
        "support": "48h por correo",
        "limits": {
            "brands_min": 1,
            "brands_max": 1,
            "users_max": 2,
            "ai_agents_max": 1,
            "products_max": 50,
            "branches_max": 1,
            "ia_tokens_total": 200,
            "ia_tokens_per_brand": 200,
        },
    },
    "fixed_subscription_growth": {
        "id": "fixed_subscription_growth",
        "billing_model": "fixed_subscription",
        "tier": "growth",
        "name": "Plan Growth",
        "monthly_price_mxn": Decimal("5990.00"),
        "commission_percentage": Decimal("0.00"),
        "commission_enabled": False,
        "support": "Prioritario 24h por Chat Agente IA",
        "limits": {
            "brands_min": 1,
            "brands_max": 3,
            "users_max": 5,
            "ai_agents_max": 3,
            "products_max": 300,
            "products_per_brand": 100,
            "branches_max": 3,
            "ia_tokens_total": 1050,
            "ia_tokens_per_brand": 350,
        },
    },
    "fixed_subscription_premium": {
        "id": "fixed_subscription_premium",
        "billing_model": "fixed_subscription",
        "tier": "premium",
        "name": "Plan Premium",
        "monthly_price_mxn": Decimal("9990.00"),
        "commission_percentage": Decimal("0.00"),
        "commission_enabled": False,
        "support": "Premium 24h/7 por Chat Agente IA",
        "limits": {
            "brands_min": 3,
            "brands_max": 10,
            "users_max": 10,
            "ai_agents_max": 5,
            "products_max": 1000,
            "products_per_brand": 100,
            "branches_max": 10,
            "ia_tokens_total": 5000,
            "ia_tokens_per_brand": 500,
        },
    },
    "commission_based_basic": {
        "id": "commission_based_basic",
        "billing_model": "commission_based",
        "tier": "basic",
        "name": "Plan Basico",
        "monthly_price_mxn": Decimal("990.00"),
        "commission_percentage": Decimal("5.00"),
        "commission_enabled": True,
        "support": "48h por correo",
        "limits": {
            "brands_min": 1,
            "brands_max": 1,
            "users_max": 2,
            "ai_agents_max": 1,
            "products_max": 50,
            "branches_max": 1,
            "ia_tokens_total": 100,
            "ia_tokens_per_brand": 100,
        },
    },
    "commission_based_growth": {
        "id": "commission_based_growth",
        "billing_model": "commission_based",
        "tier": "growth",
        "name": "Plan Growth",
        "monthly_price_mxn": Decimal("1690.00"),
        "commission_percentage": Decimal("4.50"),
        "commission_enabled": True,
        "support": "Prioritario 24h por Chat Agente IA",
        "limits": {
            "brands_min": 1,
            "brands_max": 2,
            "users_max": 5,
            "ai_agents_max": 3,
            "products_max": 200,
            "products_per_brand": 100,
            "branches_max": 2,
            "ia_tokens_total": 200,
            "ia_tokens_per_brand": 100,
        },
    },
    "commission_based_premium": {
        "id": "commission_based_premium",
        "billing_model": "commission_based",
        "tier": "premium",
        "name": "Plan Premium",
        "monthly_price_mxn": Decimal("2990.00"),
        "commission_percentage": Decimal("4.00"),
        "commission_enabled": True,
        "support": "Premium 24h/7 por Chat Agente IA",
        "limits": {
            "brands_min": 3,
            "brands_max": 3,
            "users_max": 10,
            "ai_agents_max": 5,
            "products_max": 450,
            "products_per_brand": 150,
            "branches_max": 5,
            "ia_tokens_total": 450,
            "ia_tokens_per_brand": 150,
        },
    },
}

COMMERCIAL_ADDONS: list[dict[str, Any]] = [
    {"id": "extra_user", "name": "Usuario extra", "monthly_price_mxn": Decimal("199.00")},
    {"id": "extra_ai_agent", "name": "Agente IA extra", "monthly_price_mxn": Decimal("490.00")},
    {"id": "extra_brand", "name": "Marca extra", "monthly_price_mxn": Decimal("990.00")},
    {"id": "extra_100_products", "name": "100 productos extra", "monthly_price_mxn": Decimal("490.00")},
    {"id": "extra_branch", "name": "Sucursal extra", "monthly_price_mxn": Decimal("790.00")},
    {"id": "extra_500_tokens", "name": "500 creditos IA extra", "monthly_price_mxn": Decimal("490.00")},
    {"id": "premium_support", "name": "Soporte premium", "monthly_price_mxn": Decimal("990.00")},
]


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _taxes(base: Decimal) -> dict[str, str]:
    iva_amount = (base * IVA_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total = (base + iva_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {
        "price_without_tax_mxn": _money(base),
        "tax_rate": _money(IVA_RATE),
        "tax_amount_mxn": _money(iva_amount),
        "price_with_tax_mxn": _money(total),
    }


def serialize_plan(plan: dict[str, Any]) -> dict[str, Any]:
    base = Decimal(str(plan["monthly_price_mxn"]))
    taxes = _taxes(base)
    return {
        "id": plan["id"],
        "name": plan["name"],
        "tier": plan["tier"],
        "billing_model": plan["billing_model"],
        "commission_enabled": bool(plan["commission_enabled"]),
        "commission_percentage": _money(Decimal(str(plan["commission_percentage"]))),
        "support": plan["support"],
        "limits": dict(plan["limits"]),
        **taxes,
    }


def get_catalog_payload() -> dict[str, Any]:
    return {
        "iva_rate": _money(IVA_RATE),
        "plans": [serialize_plan(plan) for plan in COMMERCIAL_PLAN_CATALOG.values()],
        "addons": [
            {
                "id": addon["id"],
                "name": addon["name"],
                **_taxes(Decimal(str(addon["monthly_price_mxn"]))),
            }
            for addon in COMMERCIAL_ADDONS
        ],
    }


def get_plan_definition(plan_key: str) -> dict[str, Any]:
    key = (plan_key or "").strip().lower()
    if key not in COMMERCIAL_PLAN_CATALOG:
        raise ValueError("plan comercial no valido")
    return COMMERCIAL_PLAN_CATALOG[key]


def _build_commission_rules(commission_enabled: bool, commission_percentage: Decimal) -> str:
    if not commission_enabled:
        return json.dumps({"tiers": [{"up_to": None, "rate": "0", "label": "Sin comision"}], "minimum_per_operation": None})
    rate = (commission_percentage / Decimal("100")).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return json.dumps(
        {
            "tiers": [{"up_to": None, "rate": str(rate), "label": "Comision por plan comercial"}],
            "minimum_per_operation": None,
        }
    )


def apply_plan_to_tenant(
    tenant: Tenant,
    *,
    plan_key: str,
    source: str,
    checkout_session_id: str | None = None,
) -> dict[str, Any]:
    plan = get_plan_definition(plan_key)
    serialized = serialize_plan(plan)
    limits = serialized["limits"]
    commission_percentage = Decimal(str(serialized["commission_percentage"]))
    commission_enabled = bool(serialized["commission_enabled"])

    tenant.commercial_plan_key = serialized["id"]
    tenant.commercial_plan_status = "paid"
    tenant.commercial_plan_source = source
    tenant.commercial_checkout_session_id = checkout_session_id
    tenant.commercial_limits_json = json.dumps(limits, ensure_ascii=False)
    tenant.commission_percentage = commission_percentage
    tenant.commission_enabled = commission_enabled
    tenant.billing_model = str(serialized["billing_model"])
    tenant.plan_type = "commission" if tenant.billing_model == "commission_based" else "subscription"
    tenant.commission_scope = tenant.commission_scope or DEFAULT_SCOPE
    tenant.commission_rules_json = _build_commission_rules(commission_enabled, commission_percentage)
    tenant.subscription_plan_json = json.dumps(
        {
            "cycle": "monthly",
            "price": serialized["price_without_tax_mxn"],
            "benefits": [
                f"Soporte {serialized['support']}",
                f"Limite de usuarios: {limits.get('users_max')}",
                f"Creditos IA incluidos: {limits.get('ia_tokens_total')}",
            ],
            "commercial_plan_key": serialized["id"],
            "price_with_tax_mxn": serialized["price_with_tax_mxn"],
        },
        ensure_ascii=False,
    )

    included_tokens = int(limits.get("ia_tokens_total") or 0)
    tenant.ai_tokens_included = included_tokens
    tenant.ai_tokens_balance = included_tokens
    tenant.ai_tokens_used = 0
    tenant.ai_tokens_locked = False
    tenant.ai_tokens_lock_reason = None
    tenant.ai_tokens_last_reset_at = datetime.utcnow()
    return serialized


def parse_limits(tenant: Tenant) -> dict[str, Any]:
    raw = tenant.commercial_limits_json or ""
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def tenant_plan_status_payload(tenant: Tenant) -> dict[str, Any]:
    limits = parse_limits(tenant)
    return {
        "tenant_id": tenant.id,
        "commercial_plan_key": tenant.commercial_plan_key,
        "commercial_plan_status": tenant.commercial_plan_status,
        "commercial_plan_source": tenant.commercial_plan_source,
        "billing_model": tenant.billing_model,
        "commission_enabled": bool(tenant.commission_enabled),
        "commission_percentage": _money(Decimal(tenant.commission_percentage or 0)),
        "limits": limits,
        "ai_tokens_included": int(tenant.ai_tokens_included or 0),
        "ai_tokens_balance": int(tenant.ai_tokens_balance or 0),
        "ai_tokens_used": int(tenant.ai_tokens_used or 0),
        "ai_tokens_locked": bool(tenant.ai_tokens_locked),
        "ai_tokens_lock_reason": tenant.ai_tokens_lock_reason,
    }


def consume_tokens(tenant: Tenant, amount: int, *, reason: str | None = None) -> dict[str, Any]:
    if amount <= 0:
        raise ValueError("tokens a consumir debe ser mayor a 0")
    if tenant.ai_tokens_locked:
        raise ValueError("la llave de tokens esta cerrada para esta marca")
    balance = int(tenant.ai_tokens_balance or 0)
    if amount > balance:
        raise ValueError("creditos IA insuficientes")
    tenant.ai_tokens_balance = balance - amount
    tenant.ai_tokens_used = int(tenant.ai_tokens_used or 0) + amount
    if tenant.ai_tokens_balance <= 0:
        tenant.ai_tokens_locked = True
        tenant.ai_tokens_lock_reason = reason or "creditos agotados"
    return tenant_plan_status_payload(tenant)


def topup_tokens(tenant: Tenant, amount: int, *, reason: str | None = None) -> dict[str, Any]:
    if amount <= 0:
        raise ValueError("tokens a recargar debe ser mayor a 0")
    tenant.ai_tokens_balance = int(tenant.ai_tokens_balance or 0) + amount
    tenant.ai_tokens_locked = False
    tenant.ai_tokens_lock_reason = reason or None
    return tenant_plan_status_payload(tenant)


def set_tokens_lock(tenant: Tenant, locked: bool, reason: str | None = None) -> dict[str, Any]:
    tenant.ai_tokens_locked = bool(locked)
    tenant.ai_tokens_lock_reason = (reason or "").strip() or None
    return tenant_plan_status_payload(tenant)
