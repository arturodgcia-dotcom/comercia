from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import AiAgent, AiEvent, AiProviderSetting, AiUsage, AutonomyLevel
from app.schemas.ai_autonomy import AiAutonomyDashboardRead, AiEventRead

AUTONOMY_LEVEL_SEED = [
    {"level": 0, "code": "suggestion", "display_name": "Nivel 0 · Sugerencia", "description": "Solo sugiere acciones", "is_premium": False},
    {"level": 1, "code": "draft", "display_name": "Nivel 1 · Draft", "description": "Genera borradores para validación humana", "is_premium": False},
    {"level": 2, "code": "partial_auto", "display_name": "Nivel 2 · Automatizado parcial", "description": "Ejecuta tareas controladas", "is_premium": False},
    {"level": 3, "code": "premium_auto", "display_name": "Nivel 3 · Premium", "description": "Autonomía avanzada premium", "is_premium": True},
]

PROVIDER_SEED = [
    {"provider_key": "openai", "display_name": "OpenAI", "default_model": "gpt-5.4-mini"},
    {"provider_key": "gemini", "display_name": "Gemini", "default_model": "gemini-2.5-pro"},
]


def _mask_api_key(last4: str | None) -> str | None:
    if not last4:
        return None
    return f"****{last4}"


def ensure_ai_autonomy_seeded(db: Session) -> None:
    if not db.scalar(select(AutonomyLevel.id).limit(1)):
        for item in AUTONOMY_LEVEL_SEED:
            db.add(
                AutonomyLevel(
                    level=item["level"],
                    code=item["code"],
                    display_name=item["display_name"],
                    description=item["description"],
                    is_premium=item["is_premium"],
                )
            )

    existing_settings = {row.provider_key: row for row in db.scalars(select(AiProviderSetting)).all()}
    for item in PROVIDER_SEED:
        if item["provider_key"] in existing_settings:
            continue
        db.add(
            AiProviderSetting(
                provider_key=item["provider_key"],
                display_name=item["display_name"],
                default_model=item["default_model"],
                is_enabled=False,
                config_json="{}",
            )
        )
    db.commit()


def normalize_provider_key(provider_key: str) -> str:
    return (provider_key or "").strip().lower()


def upsert_provider_setting(
    db: Session,
    *,
    provider_key: str,
    is_enabled: bool | None = None,
    default_model: str | None = None,
    api_key: str | None = None,
    config_json: str | None = None,
) -> AiProviderSetting:
    normalized = normalize_provider_key(provider_key)
    row = db.scalar(select(AiProviderSetting).where(AiProviderSetting.provider_key == normalized))
    if not row:
        raise ValueError("proveedor no encontrado")

    if is_enabled is not None:
        row.is_enabled = bool(is_enabled)
    if default_model is not None:
        row.default_model = default_model.strip()
    if config_json is not None:
        row.config_json = config_json
    if api_key is not None:
        clean = api_key.strip()
        row.api_key_encrypted = clean if clean else None
        row.api_key_last4 = clean[-4:] if clean else None
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def build_dashboard_payload(db: Session) -> AiAutonomyDashboardRead:
    active_agents = int(db.scalar(select(func.count(AiAgent.id)).where(AiAgent.is_active.is_(True))) or 0)
    total_actions = int(db.scalar(select(func.coalesce(func.sum(AiAgent.total_actions), 0))) or 0)
    total_successful = int(db.scalar(select(func.coalesce(func.sum(AiAgent.successful_actions), 0))) or 0)
    estimated_roi = Decimal(db.scalar(select(func.coalesce(func.sum(AiAgent.estimated_roi_mxn), 0))) or 0)

    usage_row = db.execute(
        select(
            func.coalesce(func.sum(AiUsage.total_tokens), 0),
            func.coalesce(func.sum(AiUsage.cost_mxn), 0),
        )
    ).one()
    total_tokens = int(usage_row[0] or 0)
    total_cost = Decimal(usage_row[1] or 0)

    autonomy_rows = db.execute(
        select(AiAgent.autonomy_level, func.count(AiAgent.id))
        .group_by(AiAgent.autonomy_level)
        .order_by(AiAgent.autonomy_level.asc())
    ).all()
    autonomy_distribution = [{"autonomy_level": int(level), "count": int(count)} for level, count in autonomy_rows]

    provider_rows = db.execute(
        select(AiAgent.provider_key, func.count(AiAgent.id))
        .group_by(AiAgent.provider_key)
        .order_by(AiAgent.provider_key.asc())
    ).all()
    provider_distribution = [{"provider_key": str(provider), "count": int(count)} for provider, count in provider_rows]

    events = db.scalars(select(AiEvent).order_by(AiEvent.created_at.desc()).limit(15)).all()
    recent_events = [to_event_read(row) for row in events]

    success_rate = round((total_successful / total_actions) * 100, 2) if total_actions > 0 else 0.0
    return AiAutonomyDashboardRead(
        active_agents=active_agents,
        total_consumption_tokens=total_tokens,
        total_cost_mxn=total_cost,
        total_actions=total_actions,
        estimated_roi_mxn=estimated_roi,
        success_rate_pct=success_rate,
        autonomy_distribution=autonomy_distribution,
        provider_distribution=provider_distribution,
        recent_events=recent_events,
    )


def register_agent_event(
    db: Session,
    *,
    agent: AiAgent,
    tenant_id: int | None,
    event_type: str,
    event_status: str,
    summary: str,
    action_payload_json: str | None,
    result_payload_json: str | None,
    tokens_used: int,
    input_tokens: int,
    output_tokens: int,
    cost_mxn: Decimal,
    estimated_value_mxn: Decimal,
) -> AiEvent:
    total_tokens = max(int(tokens_used or 0), int(input_tokens or 0) + int(output_tokens or 0))
    roi_delta = Decimal(estimated_value_mxn or 0) - Decimal(cost_mxn or 0)

    event_row = AiEvent(
        tenant_id=tenant_id if tenant_id is not None else agent.tenant_id,
        agent_id=agent.id,
        event_type=event_type.strip().lower(),
        event_status=event_status.strip().lower(),
        summary=summary,
        action_payload_json=action_payload_json,
        result_payload_json=result_payload_json,
        provider_key=agent.provider_key,
        autonomy_level=agent.autonomy_level,
        tokens_used=total_tokens,
        cost_mxn=Decimal(cost_mxn or 0),
        estimated_value_mxn=Decimal(estimated_value_mxn or 0),
        roi_delta_mxn=roi_delta,
    )
    db.add(event_row)

    usage_row = AiUsage(
        tenant_id=event_row.tenant_id,
        agent_id=agent.id,
        provider_key=agent.provider_key,
        usage_date=date.today(),
        input_tokens=max(0, int(input_tokens or 0)),
        output_tokens=max(0, int(output_tokens or 0)),
        total_tokens=max(0, int(total_tokens)),
        cost_mxn=Decimal(cost_mxn or 0),
        estimated_value_mxn=Decimal(estimated_value_mxn or 0),
    )
    db.add(usage_row)

    agent.total_actions = int(agent.total_actions or 0) + 1
    if event_row.event_status in {"ejecutado", "completado", "success"}:
        agent.successful_actions = int(agent.successful_actions or 0) + 1
    agent.estimated_roi_mxn = Decimal(agent.estimated_roi_mxn or 0) + roi_delta
    agent.last_action_at = datetime.utcnow()
    db.add(agent)

    db.commit()
    db.refresh(event_row)
    db.refresh(agent)
    return event_row


def to_event_read(event: AiEvent) -> AiEventRead:
    return AiEventRead(
        id=event.id,
        tenant_id=event.tenant_id,
        agent_id=event.agent_id,
        event_type=event.event_type,
        event_status=event.event_status,
        summary=event.summary,
        action_payload_json=event.action_payload_json,
        result_payload_json=event.result_payload_json,
        provider_key=event.provider_key,
        autonomy_level=event.autonomy_level,
        tokens_used=int(event.tokens_used or 0),
        cost_mxn=Decimal(event.cost_mxn or 0),
        estimated_value_mxn=Decimal(event.estimated_value_mxn or 0),
        roi_delta_mxn=Decimal(event.roi_delta_mxn or 0),
        created_at=event.created_at,
    )


def api_key_mask_for_setting(setting: AiProviderSetting) -> str | None:
    return _mask_api_key(setting.api_key_last4)
