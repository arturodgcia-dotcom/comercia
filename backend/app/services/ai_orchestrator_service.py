from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import AiEvent, AiOrchestratorExecution, AiProviderSetting, AiUsage, Tenant
from app.services.ai_credit_service import build_brand_credit_snapshot, consume_tenant_credits
from app.services.commercial_plan_service import parse_limits

LOGICAL_AGENT_CATALOG: list[dict[str, str]] = [
    {
        "agent_key": "commercial_agent",
        "display_name": "Agente Comercial",
        "description": "Atiende leads y oportunidades comerciales bajo demanda.",
    },
    {
        "agent_key": "marketing_agent",
        "display_name": "Agente de Marketing",
        "description": "Activa campanas y recupera carritos solo cuando hay trigger real.",
    },
    {
        "agent_key": "support_agent",
        "display_name": "Agente de Soporte",
        "description": "Interviene en tickets o chats abiertos con contexto vigente.",
    },
    {
        "agent_key": "sentinel_agent",
        "display_name": "Agente Centinela",
        "description": "Ejecuta revisiones de seguridad o riesgo con ventanas de enfriamiento.",
    },
    {
        "agent_key": "growth_agent",
        "display_name": "Agente de Growth",
        "description": "Propone optimizaciones solo cuando existen datos u oportunidades nuevas.",
    },
]

CATALOG_KEYS = [item["agent_key"] for item in LOGICAL_AGENT_CATALOG]

PLAN_CAPABILITY_LIMITS = {
    "basic": 1,
    "growth": 3,
    "premium": 5,
}

TRIGGER_EVENTS = {
    "new_lead",
    "new_ticket",
    "campaign_request",
    "abandoned_cart",
    "sentinel_alert",
    "user_explicit_request",
    "scheduled_high_value_review",
    "sentinel_deep_scan",
}

EVENT_AGENT_ROUTING = {
    "new_lead": "commercial_agent",
    "campaign_request": "marketing_agent",
    "abandoned_cart": "marketing_agent",
    "new_ticket": "support_agent",
    "user_explicit_request": "support_agent",
    "sentinel_alert": "sentinel_agent",
    "sentinel_deep_scan": "sentinel_agent",
    "scheduled_high_value_review": "growth_agent",
}

DEFAULT_EVENT_PRIORITY = {
    "new_ticket": "high",
    "sentinel_alert": "critical",
    "user_explicit_request": "high",
    "new_lead": "normal",
    "campaign_request": "normal",
    "abandoned_cart": "normal",
    "scheduled_high_value_review": "normal",
    "sentinel_deep_scan": "normal",
}

DEFAULT_COST_ESTIMATE = {
    "new_lead": 70,
    "new_ticket": 85,
    "campaign_request": 120,
    "abandoned_cart": 90,
    "sentinel_alert": 140,
    "sentinel_deep_scan": 180,
    "user_explicit_request": 60,
    "scheduled_high_value_review": 110,
}

PRIORITY_WEIGHT = {
    "low": 0,
    "normal": 1,
    "high": 2,
    "critical": 3,
}


@dataclass
class EventDecision:
    tenant: Tenant
    available_capabilities: list[str]
    active_capabilities: list[str]
    autonomy_level: int
    token_budget_monthly: int
    token_budget_remaining: int
    token_budget_reserved: int
    triggered_agent: str | None
    should_execute: bool
    skip_reason: str | None
    execution_priority: str
    execution_cost_estimate: int
    event_type: str
    event_channel: str | None
    context_json: str | None


def _json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except Exception:
        return []
    if not isinstance(parsed, list):
        return []
    out: list[str] = []
    for item in parsed:
        value = str(item or "").strip().lower()
        if value and value not in out:
            out.append(value)
    return out


def _serialize_list(items: list[str]) -> str:
    normalized: list[str] = []
    for item in items:
        value = str(item or "").strip().lower()
        if value and value not in normalized:
            normalized.append(value)
    return json.dumps(normalized, ensure_ascii=False)


def _derive_plan_tier(tenant: Tenant) -> str:
    key = str(tenant.commercial_plan_key or "").lower()
    if "premium" in key:
        return "premium"
    if "growth" in key:
        return "growth"
    return "basic"


def _derive_capability_limit(tenant: Tenant) -> int:
    limits = parse_limits(tenant)
    if int(limits.get("ai_agents_max") or 0) > 0:
        return max(1, min(5, int(limits.get("ai_agents_max") or 0)))
    return PLAN_CAPABILITY_LIMITS.get(_derive_plan_tier(tenant), 1)


def ensure_tenant_orchestrator_entitlements(db: Session, tenant: Tenant) -> dict[str, object]:
    capability_limit = _derive_capability_limit(tenant)
    available = [key for key in _json_list(tenant.available_ai_capabilities_json) if key in CATALOG_KEYS]
    if not available:
        available = CATALOG_KEYS[:capability_limit]
    if len(available) > capability_limit:
        available = available[:capability_limit]

    active = [key for key in _json_list(tenant.active_ai_capabilities_json) if key in available]
    if not active:
        active = available[:capability_limit]

    snapshot = build_brand_credit_snapshot(db, tenant)
    monthly_budget = int(snapshot.assigned_tokens or 0) if int(snapshot.assigned_tokens or 0) > 0 else int(tenant.ai_tokens_included or 0)
    if monthly_budget <= 0:
        monthly_budget = int(tenant.ai_token_budget_monthly or 0)
    remaining_budget = int(snapshot.remaining_tokens or 0)
    reserved_budget = max(0, min(int(tenant.ai_token_budget_reserved or 0), remaining_budget))

    tenant.available_ai_capabilities_json = _serialize_list(available)
    tenant.active_ai_capabilities_json = _serialize_list(active)
    tenant.ai_token_budget_monthly = max(0, monthly_budget)
    tenant.ai_token_budget_remaining = max(0, remaining_budget)
    tenant.ai_token_budget_reserved = reserved_budget
    tenant.ai_autonomy_level = max(0, int(tenant.ai_autonomy_level or 0))
    db.add(tenant)

    return {
        "capability_limit": capability_limit,
        "available_capabilities": available,
        "active_capabilities": active,
        "autonomy_level": int(tenant.ai_autonomy_level or 0),
        "token_budget_monthly": int(tenant.ai_token_budget_monthly or 0),
        "token_budget_remaining": int(tenant.ai_token_budget_remaining or 0),
        "token_budget_reserved": int(tenant.ai_token_budget_reserved or 0),
    }


def _should_skip_for_agent_rules(
    db: Session,
    *,
    tenant_id: int,
    event_type: str,
    triggered_agent: str,
    context: dict,
) -> str | None:
    if triggered_agent == "marketing_agent" and event_type not in {"campaign_request", "abandoned_cart"}:
        return "marketing_sin_campana_o_solicitud"
    if triggered_agent == "support_agent" and event_type not in {"new_ticket", "user_explicit_request"}:
        return "support_sin_ticket_o_chat_abierto"
    if triggered_agent == "growth_agent":
        has_new_data = bool(context.get("has_new_data") or context.get("has_opportunity"))
        if not has_new_data:
            return "growth_sin_datos_nuevos"
    if triggered_agent == "sentinel_agent" and event_type == "sentinel_deep_scan":
        no_changes = bool(context.get("no_changes", True))
        threshold = datetime.utcnow() - timedelta(hours=6)
        recent = db.scalar(
            select(AiOrchestratorExecution.id)
            .where(
                AiOrchestratorExecution.tenant_id == tenant_id,
                AiOrchestratorExecution.triggered_agent == "sentinel_agent",
                AiOrchestratorExecution.event_type == "sentinel_deep_scan",
                AiOrchestratorExecution.executed.is_(True),
                AiOrchestratorExecution.started_at >= threshold,
            )
            .limit(1)
        )
        if no_changes and recent:
            return "sentinel_revisado_recientemente_sin_cambios"
    return None


def evaluate_event_for_execution(
    db: Session,
    *,
    tenant: Tenant,
    event_type: str,
    event_channel: str | None,
    context: dict,
    execution_priority: str | None,
    execution_cost_estimate: int | None,
) -> EventDecision:
    entitlements = ensure_tenant_orchestrator_entitlements(db, tenant)
    normalized_event = (event_type or "").strip().lower()
    priority = (execution_priority or DEFAULT_EVENT_PRIORITY.get(normalized_event) or "normal").strip().lower()
    if priority not in PRIORITY_WEIGHT:
        priority = "normal"
    cost_estimate = max(1, int(execution_cost_estimate or DEFAULT_COST_ESTIMATE.get(normalized_event) or 75))

    if normalized_event not in TRIGGER_EVENTS:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=None,
            should_execute=False,
            skip_reason="sin_trigger_util",
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    triggered_agent = EVENT_AGENT_ROUTING.get(normalized_event)
    if not triggered_agent:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=None,
            should_execute=False,
            skip_reason="sin_agente_disponible_para_evento",
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    if triggered_agent not in entitlements["active_capabilities"]:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=triggered_agent,
            should_execute=False,
            skip_reason="capacidad_no_habilitada_por_plan",
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    available_budget = max(int(entitlements["token_budget_remaining"]) - int(entitlements["token_budget_reserved"]), 0)
    low_budget_threshold = max(30, int(int(entitlements["token_budget_monthly"]) * 0.10))
    if available_budget < cost_estimate:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=triggered_agent,
            should_execute=False,
            skip_reason="presupuesto_insuficiente",
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    if available_budget <= low_budget_threshold and PRIORITY_WEIGHT.get(priority, 1) < PRIORITY_WEIGHT["critical"]:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=triggered_agent,
            should_execute=False,
            skip_reason="umbral_bajo_de_presupuesto",
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    rule_skip_reason = _should_skip_for_agent_rules(
        db,
        tenant_id=tenant.id,
        event_type=normalized_event,
        triggered_agent=triggered_agent,
        context=context,
    )
    if rule_skip_reason:
        return EventDecision(
            tenant=tenant,
            available_capabilities=list(entitlements["available_capabilities"]),
            active_capabilities=list(entitlements["active_capabilities"]),
            autonomy_level=int(entitlements["autonomy_level"]),
            token_budget_monthly=int(entitlements["token_budget_monthly"]),
            token_budget_remaining=int(entitlements["token_budget_remaining"]),
            token_budget_reserved=int(entitlements["token_budget_reserved"]),
            triggered_agent=triggered_agent,
            should_execute=False,
            skip_reason=rule_skip_reason,
            execution_priority=priority,
            execution_cost_estimate=cost_estimate,
            event_type=normalized_event,
            event_channel=(event_channel or "").strip().lower() or None,
            context_json=json.dumps(context, ensure_ascii=False),
        )

    return EventDecision(
        tenant=tenant,
        available_capabilities=list(entitlements["available_capabilities"]),
        active_capabilities=list(entitlements["active_capabilities"]),
        autonomy_level=int(entitlements["autonomy_level"]),
        token_budget_monthly=int(entitlements["token_budget_monthly"]),
        token_budget_remaining=int(entitlements["token_budget_remaining"]),
        token_budget_reserved=int(entitlements["token_budget_reserved"]),
        triggered_agent=triggered_agent,
        should_execute=True,
        skip_reason=None,
        execution_priority=priority,
        execution_cost_estimate=cost_estimate,
        event_type=normalized_event,
        event_channel=(event_channel or "").strip().lower() or None,
        context_json=json.dumps(context, ensure_ascii=False),
    )


def _resolve_provider_key(db: Session) -> str:
    enabled = db.scalar(
        select(AiProviderSetting.provider_key)
        .where(AiProviderSetting.is_enabled.is_(True))
        .order_by(AiProviderSetting.provider_key.asc())
        .limit(1)
    )
    if enabled:
        return str(enabled)
    fallback = db.scalar(select(AiProviderSetting.provider_key).order_by(AiProviderSetting.provider_key.asc()).limit(1))
    return str(fallback or "openai")


def _register_legacy_event(db: Session, *, decision: EventDecision, executed: bool, tokens_used: int, summary: str) -> None:
    db.add(
        AiEvent(
            tenant_id=decision.tenant.id,
            agent_id=None,
            event_type=decision.event_type,
            event_status="ejecutado" if executed else "omitido",
            summary=summary,
            action_payload_json=decision.context_json,
            result_payload_json=None,
            provider_key=_resolve_provider_key(db),
            autonomy_level=decision.autonomy_level,
            tokens_used=max(0, int(tokens_used)),
            cost_mxn=Decimal(tokens_used) * Decimal("0.0075") if executed else Decimal("0"),
            estimated_value_mxn=Decimal("0"),
            roi_delta_mxn=Decimal("0"),
        )
    )


def process_orchestrator_event(
    db: Session,
    *,
    tenant: Tenant,
    brand_id: int | None,
    event_type: str,
    event_channel: str | None,
    context: dict | None,
    execution_priority: str | None,
    execution_cost_estimate: int | None,
) -> AiOrchestratorExecution:
    payload_context = context if isinstance(context, dict) else {}
    decision = evaluate_event_for_execution(
        db,
        tenant=tenant,
        event_type=event_type,
        event_channel=event_channel,
        context=payload_context,
        execution_priority=execution_priority,
        execution_cost_estimate=execution_cost_estimate,
    )

    started_at = datetime.utcnow()
    row = AiOrchestratorExecution(
        tenant_id=tenant.id,
        brand_id=brand_id,
        event_type=decision.event_type,
        event_channel=decision.event_channel,
        triggered_agent=decision.triggered_agent,
        started_at=started_at,
        execution_priority=decision.execution_priority,
        execution_cost_estimate=decision.execution_cost_estimate,
        context_json=decision.context_json,
    )

    if not decision.should_execute:
        row.executed = False
        row.skipped = True
        row.skip_reason = decision.skip_reason
        row.tokens_used = 0
        row.tokens_saved = max(0, int(decision.execution_cost_estimate))
        row.cost_estimate_mxn = Decimal("0")
        row.outcome_summary = f"Ejecucion omitida por regla: {decision.skip_reason or 'no especificada'}"
        row.finished_at = datetime.utcnow()
        db.add(row)
        _register_legacy_event(
            db,
            decision=decision,
            executed=False,
            tokens_used=0,
            summary=row.outcome_summary,
        )
        db.commit()
        db.refresh(row)
        return row

    try:
        credit_snapshot = consume_tenant_credits(
            db,
            tenant=tenant,
            amount=int(decision.execution_cost_estimate),
            source="ai_orchestrator",
            notes=f"{decision.triggered_agent or 'agente'}:{decision.event_type}",
            created_by_user_id=None,
        )
    except ValueError:
        row.executed = False
        row.skipped = True
        row.skip_reason = "presupuesto_insuficiente"
        row.tokens_used = 0
        row.tokens_saved = max(0, int(decision.execution_cost_estimate))
        row.cost_estimate_mxn = Decimal("0")
        row.outcome_summary = "Ejecucion omitida por presupuesto insuficiente durante validacion final"
        row.finished_at = datetime.utcnow()
        db.add(row)
        _register_legacy_event(
            db,
            decision=decision,
            executed=False,
            tokens_used=0,
            summary=row.outcome_summary,
        )
        db.commit()
        db.refresh(row)
        return row

    tenant.ai_token_budget_remaining = int(credit_snapshot.remaining_tokens or 0)
    db.add(tenant)

    row.executed = True
    row.skipped = False
    row.skip_reason = None
    row.tokens_used = int(decision.execution_cost_estimate)
    row.tokens_saved = 0
    row.cost_estimate_mxn = Decimal(row.tokens_used) * Decimal("0.0075")
    row.outcome_summary = f"{decision.triggered_agent} ejecutado por evento {decision.event_type}"
    row.finished_at = datetime.utcnow()
    db.add(row)

    db.add(
        AiUsage(
            tenant_id=tenant.id,
            agent_id=None,
            provider_key=_resolve_provider_key(db),
            input_tokens=int(row.tokens_used * 0.65),
            output_tokens=int(row.tokens_used * 0.35),
            total_tokens=int(row.tokens_used),
            cost_mxn=Decimal(row.cost_estimate_mxn or 0),
            estimated_value_mxn=Decimal("0"),
        )
    )
    _register_legacy_event(
        db,
        decision=decision,
        executed=True,
        tokens_used=int(row.tokens_used),
        summary=row.outcome_summary,
    )

    db.commit()
    db.refresh(row)
    return row


def build_orchestrator_dashboard(db: Session, *, tenant_id: int | None = None) -> dict[str, object]:
    tenant_query = select(Tenant).where(Tenant.is_active.is_(True)).order_by(Tenant.id.asc())
    if tenant_id is not None:
        tenant_query = tenant_query.where(Tenant.id == tenant_id)
    tenant = db.scalar(tenant_query.limit(1))

    selected_tenant_payload: dict[str, object] | None = None
    if tenant:
        entitlements = ensure_tenant_orchestrator_entitlements(db, tenant)
        selected_tenant_payload = {
            "tenant_id": tenant.id,
            "tenant_name": tenant.name,
            "plan_key": tenant.commercial_plan_key,
            "autonomy_level": int(entitlements["autonomy_level"]),
            "available_ai_capabilities": list(entitlements["available_capabilities"]),
            "active_ai_capabilities": list(entitlements["active_capabilities"]),
            "token_budget_monthly": int(entitlements["token_budget_monthly"]),
            "token_budget_remaining": int(entitlements["token_budget_remaining"]),
            "token_budget_reserved": int(entitlements["token_budget_reserved"]),
            "orchestrator_status": "activo_por_eventos",
        }

    execution_query = select(AiOrchestratorExecution).order_by(AiOrchestratorExecution.started_at.desc())
    if tenant:
        execution_query = execution_query.where(AiOrchestratorExecution.tenant_id == tenant.id)

    recent = db.scalars(execution_query.limit(25)).all()
    recent_rows = [
        {
            "id": row.id,
            "tenant_id": row.tenant_id,
            "brand_id": row.brand_id,
            "event_type": row.event_type,
            "event_channel": row.event_channel,
            "triggered_agent": row.triggered_agent,
            "started_at": row.started_at,
            "finished_at": row.finished_at,
            "executed": bool(row.executed),
            "skipped": bool(row.skipped),
            "skip_reason": row.skip_reason,
            "execution_priority": row.execution_priority,
            "execution_cost_estimate": int(row.execution_cost_estimate or 0),
            "tokens_used": int(row.tokens_used or 0),
            "tokens_saved": int(row.tokens_saved or 0),
            "cost_estimate_mxn": Decimal(row.cost_estimate_mxn or 0),
            "outcome_summary": row.outcome_summary,
        }
        for row in recent
    ]

    executed_count = int(sum(1 for row in recent if row.executed))
    skipped_count = int(sum(1 for row in recent if row.skipped))
    tokens_used = int(sum(int(row.tokens_used or 0) for row in recent))
    tokens_saved = int(sum(int(row.tokens_saved or 0) for row in recent))

    active_tenants = int(db.scalar(select(func.count(Tenant.id)).where(Tenant.is_active.is_(True))) or 0)

    db.commit()

    return {
        "orchestrator_status": "activo_por_eventos",
        "active_tenants": active_tenants,
        "logical_agents_catalog": LOGICAL_AGENT_CATALOG,
        "selected_tenant": selected_tenant_payload,
        "executions_total": executed_count,
        "skipped_total": skipped_count,
        "tokens_used_total": tokens_used,
        "tokens_saved_total": tokens_saved,
        "recent_executions": recent_rows,
        "recent_skips": [row for row in recent_rows if row["skipped"]][:10],
    }
