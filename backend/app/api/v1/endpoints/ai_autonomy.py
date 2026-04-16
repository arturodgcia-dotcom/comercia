from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import AiAgent, AiEvent, AiProviderSetting, AiUsage, AutonomyLevel, User
from app.schemas.ai_autonomy import (
    AiAgentCreate,
    AiAgentRead,
    AiAgentUpdate,
    AiAutonomyDashboardRead,
    AiEventCreate,
    AiEventRead,
    AiProviderSettingRead,
    AiProviderSettingUpdate,
    AiUsageRead,
    AutonomyLevelRead,
)
from app.services.ai_autonomy_service import (
    api_key_mask_for_setting,
    build_dashboard_payload,
    ensure_ai_autonomy_seeded,
    register_agent_event,
    to_event_read,
    upsert_provider_setting,
)
from app.services.role_permissions_service import role_matches_any_alias

router = APIRouter()


def _assert_ai_admin(current_user: User) -> None:
    if not role_matches_any_alias(current_user.role, {"super_admin"}):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="requiere rol super_admin o reinpia_admin")


@router.get("/ai-autonomy/dashboard", response_model=AiAutonomyDashboardRead)
def ai_autonomy_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    return build_dashboard_payload(db)


@router.get("/ai-autonomy/autonomy-levels", response_model=list[AutonomyLevelRead])
def list_autonomy_levels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    rows = db.scalars(select(AutonomyLevel).order_by(AutonomyLevel.level.asc())).all()
    return [
        AutonomyLevelRead(
            id=row.id,
            level=row.level,
            code=row.code,
            display_name=row.display_name,
            description=row.description,
            is_premium=row.is_premium,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.get("/ai-autonomy/providers", response_model=list[AiProviderSettingRead])
def list_provider_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    rows = db.scalars(select(AiProviderSetting).order_by(AiProviderSetting.provider_key.asc())).all()
    return [
        AiProviderSettingRead(
            id=row.id,
            provider_key=row.provider_key,
            display_name=row.display_name,
            is_enabled=row.is_enabled,
            default_model=row.default_model,
            api_key_masked=api_key_mask_for_setting(row),
            config_json=row.config_json,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.put("/ai-autonomy/providers/{provider_key}", response_model=AiProviderSettingRead)
def update_provider_setting(
    provider_key: str,
    payload: AiProviderSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    try:
        row = upsert_provider_setting(
            db,
            provider_key=provider_key,
            is_enabled=payload.is_enabled,
            default_model=payload.default_model,
            api_key=payload.api_key,
            config_json=payload.config_json,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return AiProviderSettingRead(
        id=row.id,
        provider_key=row.provider_key,
        display_name=row.display_name,
        is_enabled=row.is_enabled,
        default_model=row.default_model,
        api_key_masked=api_key_mask_for_setting(row),
        config_json=row.config_json,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/ai-autonomy/agents", response_model=list[AiAgentRead])
def list_ai_agents(
    tenant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    query = select(AiAgent).order_by(AiAgent.is_active.desc(), AiAgent.updated_at.desc())
    if tenant_id is not None:
        query = query.where(AiAgent.tenant_id == tenant_id)
    rows = db.scalars(query).all()
    return [
        AiAgentRead(
            id=row.id,
            tenant_id=row.tenant_id,
            name=row.name,
            description=row.description,
            provider_key=row.provider_key,
            autonomy_level=row.autonomy_level,
            status=row.status,
            is_active=row.is_active,
            total_actions=row.total_actions,
            successful_actions=row.successful_actions,
            estimated_roi_mxn=Decimal(row.estimated_roi_mxn or 0),
            last_action_at=row.last_action_at,
            owner_scope=row.owner_scope,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]


@router.post("/ai-autonomy/agents", response_model=AiAgentRead, status_code=status.HTTP_201_CREATED)
def create_ai_agent(
    payload: AiAgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    ensure_ai_autonomy_seeded(db)
    exists = db.scalar(select(AiAgent.id).where(AiAgent.name == payload.name.strip(), AiAgent.tenant_id == payload.tenant_id))
    if exists:
        raise HTTPException(status_code=409, detail="ya existe un agente con ese nombre en el mismo alcance")
    row = AiAgent(
        tenant_id=payload.tenant_id,
        name=payload.name.strip(),
        description=payload.description,
        provider_key=payload.provider_key.strip().lower(),
        autonomy_level=max(0, min(3, int(payload.autonomy_level))),
        status=payload.status.strip().lower(),
        is_active=payload.is_active,
        owner_scope=payload.owner_scope.strip().lower(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return AiAgentRead(
        id=row.id,
        tenant_id=row.tenant_id,
        name=row.name,
        description=row.description,
        provider_key=row.provider_key,
        autonomy_level=row.autonomy_level,
        status=row.status,
        is_active=row.is_active,
        total_actions=row.total_actions,
        successful_actions=row.successful_actions,
        estimated_roi_mxn=Decimal(row.estimated_roi_mxn or 0),
        last_action_at=row.last_action_at,
        owner_scope=row.owner_scope,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.patch("/ai-autonomy/agents/{agent_id}", response_model=AiAgentRead)
def update_ai_agent(
    agent_id: int,
    payload: AiAgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    row = db.get(AiAgent, agent_id)
    if not row:
        raise HTTPException(status_code=404, detail="agente no encontrado")
    changes = payload.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is not None:
        row.name = changes["name"].strip()
    if "description" in changes:
        row.description = changes["description"]
    if "provider_key" in changes and changes["provider_key"] is not None:
        row.provider_key = str(changes["provider_key"]).strip().lower()
    if "autonomy_level" in changes and changes["autonomy_level"] is not None:
        row.autonomy_level = max(0, min(3, int(changes["autonomy_level"])))
    if "status" in changes and changes["status"] is not None:
        row.status = str(changes["status"]).strip().lower()
    if "is_active" in changes and changes["is_active"] is not None:
        row.is_active = bool(changes["is_active"])
    if "owner_scope" in changes and changes["owner_scope"] is not None:
        row.owner_scope = str(changes["owner_scope"]).strip().lower()
    db.add(row)
    db.commit()
    db.refresh(row)
    return AiAgentRead(
        id=row.id,
        tenant_id=row.tenant_id,
        name=row.name,
        description=row.description,
        provider_key=row.provider_key,
        autonomy_level=row.autonomy_level,
        status=row.status,
        is_active=row.is_active,
        total_actions=row.total_actions,
        successful_actions=row.successful_actions,
        estimated_roi_mxn=Decimal(row.estimated_roi_mxn or 0),
        last_action_at=row.last_action_at,
        owner_scope=row.owner_scope,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.get("/ai-autonomy/events", response_model=list[AiEventRead])
def list_ai_events(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    rows = db.scalars(select(AiEvent).order_by(AiEvent.created_at.desc()).limit(limit)).all()
    return [to_event_read(row) for row in rows]


@router.post("/ai-autonomy/agents/{agent_id}/events", response_model=AiEventRead, status_code=status.HTTP_201_CREATED)
def create_ai_event(
    agent_id: int,
    payload: AiEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    agent = db.get(AiAgent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="agente no encontrado")
    row = register_agent_event(
        db,
        agent=agent,
        tenant_id=payload.tenant_id,
        event_type=payload.event_type,
        event_status=payload.event_status,
        summary=payload.summary,
        action_payload_json=payload.action_payload_json,
        result_payload_json=payload.result_payload_json,
        tokens_used=payload.tokens_used,
        input_tokens=payload.input_tokens,
        output_tokens=payload.output_tokens,
        cost_mxn=Decimal(payload.cost_mxn or 0),
        estimated_value_mxn=Decimal(payload.estimated_value_mxn or 0),
    )
    return to_event_read(row)


@router.get("/ai-autonomy/usage", response_model=list[AiUsageRead])
def list_ai_usage(
    limit: int = Query(default=100, ge=1, le=300),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_ai_admin(current_user)
    rows = db.scalars(select(AiUsage).order_by(AiUsage.created_at.desc()).limit(limit)).all()
    return [
        AiUsageRead(
            id=row.id,
            tenant_id=row.tenant_id,
            agent_id=row.agent_id,
            provider_key=row.provider_key,
            usage_date=row.usage_date,
            input_tokens=row.input_tokens,
            output_tokens=row.output_tokens,
            total_tokens=row.total_tokens,
            cost_mxn=Decimal(row.cost_mxn or 0),
            estimated_value_mxn=Decimal(row.estimated_value_mxn or 0),
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in rows
    ]
