from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import AutomationEventLog, BotChannelConfig, BotMessageTemplate


def log_automation_event(
    db: Session,
    event_type: str,
    tenant_id: int | None = None,
    related_entity_type: str | None = None,
    related_entity_id: int | None = None,
    payload_json: str | None = None,
    auto_commit: bool = True,
) -> AutomationEventLog:
    event = AutomationEventLog(
        tenant_id=tenant_id,
        event_type=event_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        payload_json=payload_json,
    )
    db.add(event)
    if auto_commit:
        db.commit()
        db.refresh(event)
    else:
        db.flush()
    return event


def upsert_bot_channel(
    db: Session,
    channel: str,
    tenant_id: int | None = None,
    is_enabled: bool = False,
    provider_name: str | None = None,
    config_json: str | None = None,
    auto_commit: bool = True,
) -> BotChannelConfig:
    row = db.scalar(
        select(BotChannelConfig).where(BotChannelConfig.channel == channel, BotChannelConfig.tenant_id == tenant_id)
    )
    if not row:
        row = BotChannelConfig(
            channel=channel,
            tenant_id=tenant_id,
            is_enabled=is_enabled,
            provider_name=provider_name,
            config_json=config_json,
        )
        db.add(row)
    else:
        row.is_enabled = is_enabled
        row.provider_name = provider_name
        row.config_json = config_json
    if auto_commit:
        db.commit()
        db.refresh(row)
    else:
        db.flush()
    return row


def upsert_bot_template(
    db: Session,
    event_type: str,
    channel: str,
    template_text: str,
    tenant_id: int | None = None,
    is_active: bool = True,
    auto_commit: bool = True,
) -> BotMessageTemplate:
    row = db.scalar(
        select(BotMessageTemplate).where(
            BotMessageTemplate.event_type == event_type,
            BotMessageTemplate.channel == channel,
            BotMessageTemplate.tenant_id == tenant_id,
        )
    )
    if not row:
        row = BotMessageTemplate(
            event_type=event_type,
            channel=channel,
            template_text=template_text,
            tenant_id=tenant_id,
            is_active=is_active,
        )
        db.add(row)
    else:
        row.template_text = template_text
        row.is_active = is_active
    if auto_commit:
        db.commit()
        db.refresh(row)
    else:
        db.flush()
    return row
