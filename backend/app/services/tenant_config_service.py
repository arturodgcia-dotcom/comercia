from __future__ import annotations

import json
from decimal import Decimal, ROUND_HALF_UP

DEFAULT_COMMISSION_TIERS = [
    {"up_to": "2000", "rate": "0.025", "label": "Hasta 2000"},
    {"up_to": None, "rate": "0.03", "label": "Mayor a 2000"},
]

DEFAULT_SUBSCRIPTION_PLAN = {
    "cycle": "monthly",
    "price": "0",
    "benefits": [
        "Sin comision por venta",
        "Herramientas premium",
        "Prioridad de soporte"
    ]
}

DEFAULT_BILLING_MODEL = "fixed_subscription"
DEFAULT_COMMISSION_SCOPE = "ventas_online_pagadas"
ALLOWED_BILLING_MODELS = {"fixed_subscription", "commission_based"}


def _to_decimal(value: object, fallback: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(fallback)


def _normalize_tier(tier: dict) -> dict:
    up_to = tier.get("up_to")
    return {
        "up_to": None if up_to in (None, "", "null") else str(_to_decimal(up_to, "0")),
        "rate": str(_to_decimal(tier.get("rate"), "0")),
        "label": str(tier.get("label") or "Regla"),
    }


def normalize_commission_rules(raw: str | None) -> dict:
    if not raw:
        return {
            "tiers": DEFAULT_COMMISSION_TIERS,
            "minimum_per_operation": None,
        }
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {}

    tiers = parsed.get("tiers") if isinstance(parsed, dict) else None
    normalized_tiers = [
        _normalize_tier(tier)
        for tier in tiers
        if isinstance(tier, dict)
    ] if isinstance(tiers, list) else []

    if not normalized_tiers:
        normalized_tiers = DEFAULT_COMMISSION_TIERS

    minimum_raw = parsed.get("minimum_per_operation") if isinstance(parsed, dict) else None
    minimum = None
    if minimum_raw not in (None, "", "null"):
        minimum = str(_to_decimal(minimum_raw, "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    return {
        "tiers": normalized_tiers,
        "minimum_per_operation": minimum,
    }


def normalize_subscription_plan(raw: str | None) -> dict:
    if not raw:
        return DEFAULT_SUBSCRIPTION_PLAN
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {}
    if not isinstance(parsed, dict):
        parsed = {}
    benefits = parsed.get("benefits")
    normalized_benefits = [str(item) for item in benefits] if isinstance(benefits, list) else DEFAULT_SUBSCRIPTION_PLAN["benefits"]
    return {
        "cycle": str(parsed.get("cycle") or "monthly"),
        "price": str(_to_decimal(parsed.get("price"), "0").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "benefits": normalized_benefits,
    }


def resolve_plan_type(tenant_plan_type: str | None, plan_commission_enabled: bool) -> str:
    normalized = (tenant_plan_type or "").strip().lower()
    if normalized in {"commission", "subscription"}:
        return normalized
    return "commission" if plan_commission_enabled else "subscription"


def resolve_billing_model(billing_model: str | None, tenant_plan_type: str | None, plan_commission_enabled: bool) -> str:
    normalized = (billing_model or "").strip().lower()
    if normalized in ALLOWED_BILLING_MODELS:
        return normalized
    plan_type = resolve_plan_type(tenant_plan_type, plan_commission_enabled)
    return "commission_based" if plan_type == "commission" else DEFAULT_BILLING_MODEL


def normalize_billing_config(
    *,
    billing_model: str | None,
    commission_percentage: object | None,
    commission_enabled: bool | None,
    commission_scope: str | None,
    commission_notes: str | None,
    tenant_plan_type: str | None,
    plan_commission_enabled: bool,
) -> dict:
    resolved_model = resolve_billing_model(billing_model, tenant_plan_type, plan_commission_enabled)
    resolved_enabled = resolved_model == "commission_based"
    resolved_percentage = (
        _to_decimal(commission_percentage, "3").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if resolved_enabled
        else Decimal("0.00")
    )
    if commission_enabled is not None and resolved_model == "fixed_subscription":
        resolved_enabled = False
    elif commission_enabled is not None and resolved_model == "commission_based":
        resolved_enabled = True

    scope = str(commission_scope or DEFAULT_COMMISSION_SCOPE).strip() or DEFAULT_COMMISSION_SCOPE
    notes = (commission_notes or "").strip() or None

    return {
        "billing_model": resolved_model,
        "commission_enabled": resolved_enabled,
        "commission_percentage": str(resolved_percentage),
        "commission_scope": scope,
        "commission_notes": notes,
    }


def build_tenant_config_payload(*, tenant_id: int, tenant_slug: str, tenant_name: str, business_type: str, tenant_plan_type: str | None, commission_rules_json: str | None, subscription_plan_json: str | None, billing_model: str | None, commission_percentage: object | None, commission_enabled: bool | None, commission_scope: str | None, commission_notes: str | None, plan_commission_enabled: bool) -> dict:
    plan_type = resolve_plan_type(tenant_plan_type, plan_commission_enabled)
    commission_rules = normalize_commission_rules(commission_rules_json)
    subscription_plan = normalize_subscription_plan(subscription_plan_json)
    billing = normalize_billing_config(
        billing_model=billing_model,
        commission_percentage=commission_percentage,
        commission_enabled=commission_enabled,
        commission_scope=commission_scope,
        commission_notes=commission_notes,
        tenant_plan_type=tenant_plan_type,
        plan_commission_enabled=plan_commission_enabled,
    )

    landing_copy = {
        "commission": {
            "headline": "Empieza a vender sin costo fijo y paga solo cuando vendes",
            "subtitle": "Modelo accesible para crecer con bajo riesgo y total transparencia en cada operacion.",
            "cta": "Empieza sin costo fijo",
        },
        "subscription": {
            "headline": "Escala tu operacion con control total y sin comisiones por venta",
            "subtitle": "Modelo de suscripcion para marcas que buscan rentabilidad, eficiencia y crecimiento sostenido.",
            "cta": "Activa tu plan",
        },
    }

    return {
        "tenant_id": tenant_id,
        "tenant_slug": tenant_slug,
        "tenant_name": tenant_name,
        "business_type": business_type,
        "plan_type": plan_type,
        "commission_rules": commission_rules,
        "subscription_plan": subscription_plan,
        "checkout_badge": "Modelo comision" if plan_type == "commission" else "Sin comision",
        "landing_variant": landing_copy[plan_type],
        "billing_model": billing["billing_model"],
        "commission_percentage": billing["commission_percentage"],
        "commission_enabled": billing["commission_enabled"],
        "commission_scope": billing["commission_scope"],
        "commission_notes": billing["commission_notes"],
    }
