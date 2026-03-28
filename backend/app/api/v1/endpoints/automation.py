from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import AutomationEventLog, BotChannelConfig, BotMessageTemplate, User
from app.schemas.automation import (
    AutomationEventCreate,
    AutomationEventRead,
    BotChannelConfigCreate,
    BotChannelConfigRead,
    BotChannelConfigUpdate,
    BotMessageTemplateCreate,
    BotMessageTemplateRead,
)
from app.services.automation_service import log_automation_event, upsert_bot_channel, upsert_bot_template

router = APIRouter()


@router.get("/events", response_model=list[AutomationEventRead])
def list_automation_events(
    tenant_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    query = select(AutomationEventLog)
    if tenant_id is not None:
        query = query.where(AutomationEventLog.tenant_id == tenant_id)
    return db.scalars(query.order_by(AutomationEventLog.id.desc()).limit(200)).all()


@router.post("/events", response_model=AutomationEventRead)
def create_automation_event(payload: AutomationEventCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return log_automation_event(
        db,
        event_type=payload.event_type,
        tenant_id=payload.tenant_id,
        related_entity_type=payload.related_entity_type,
        related_entity_id=payload.related_entity_id,
        payload_json=payload.payload_json,
    )


@router.get("/channels", response_model=list[BotChannelConfigRead])
def list_bot_channels(tenant_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = select(BotChannelConfig)
    if tenant_id is not None:
        query = query.where(BotChannelConfig.tenant_id == tenant_id)
    return db.scalars(query.order_by(BotChannelConfig.id.desc())).all()


@router.post("/channels", response_model=BotChannelConfigRead)
def upsert_channel(payload: BotChannelConfigCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return upsert_bot_channel(
        db,
        tenant_id=payload.tenant_id,
        channel=payload.channel,
        is_enabled=payload.is_enabled,
        provider_name=payload.provider_name,
        config_json=payload.config_json,
    )


@router.put("/channels/{channel_id}", response_model=BotChannelConfigRead)
def update_channel(
    channel_id: int, payload: BotChannelConfigUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    current = db.get(BotChannelConfig, channel_id)
    if not current:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="canal no encontrado")
    return upsert_bot_channel(
        db,
        tenant_id=current.tenant_id,
        channel=current.channel,
        is_enabled=payload.is_enabled if payload.is_enabled is not None else current.is_enabled,
        provider_name=payload.provider_name if payload.provider_name is not None else current.provider_name,
        config_json=payload.config_json if payload.config_json is not None else current.config_json,
    )


@router.get("/templates", response_model=list[BotMessageTemplateRead])
def list_templates(tenant_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = select(BotMessageTemplate)
    if tenant_id is not None:
        query = query.where(BotMessageTemplate.tenant_id == tenant_id)
    return db.scalars(query.order_by(BotMessageTemplate.id.desc())).all()


@router.post("/templates", response_model=BotMessageTemplateRead)
def upsert_template(payload: BotMessageTemplateCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return upsert_bot_template(
        db,
        event_type=payload.event_type,
        channel=payload.channel,
        template_text=payload.template_text,
        tenant_id=payload.tenant_id,
        is_active=payload.is_active,
    )
