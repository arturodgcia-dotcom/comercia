from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_reinpia_admin
from app.db.session import get_db
from app.models.models import BlockedEntity, SecurityAlert, SecurityRule, User
from app.schemas.security import (
    BlockedEntityCreate,
    BlockedEntityRead,
    SecurityAlertRead,
    SecurityEventRead,
    SecurityKpisResponse,
    SecurityRuleRead,
    SecurityRuleUpdate,
    ToggleRuleResponse,
)
from app.services.security_watch_service import block_entity, get_recent_security_events, get_security_kpis
from app.services.security_rules_service import list_rules, toggle_rule, update_rule

router = APIRouter(dependencies=[Depends(get_reinpia_admin)])


@router.get("/events", response_model=list[SecurityEventRead])
def list_security_events(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    severity: str | None = None,
    status: str | None = None,
    event_type: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(get_reinpia_admin),
):
    return get_recent_security_events(
        db,
        date_from=date_from,
        date_to=date_to,
        tenant_id=tenant_id,
        severity=severity,
        status=status,
        event_type=event_type,
        limit=max(1, min(limit, 1000)),
    )


@router.get("/alerts", response_model=list[SecurityAlertRead])
def list_security_alerts(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    severity: str | None = None,
    is_read: bool | None = None,
    alert_type: str | None = None,
    db: Session = Depends(get_db),
):
    filters = []
    if date_from:
        filters.append(SecurityAlert.created_at >= date_from)
    if date_to:
        filters.append(SecurityAlert.created_at <= date_to)
    if tenant_id is not None:
        filters.append(SecurityAlert.tenant_id == tenant_id)
    if severity:
        filters.append(SecurityAlert.severity == severity)
    if is_read is not None:
        filters.append(SecurityAlert.is_read.is_(is_read))
    if alert_type:
        filters.append(SecurityAlert.alert_type == alert_type)
    return db.scalars(select(SecurityAlert).where(*filters).order_by(SecurityAlert.id.desc()).limit(500)).all()


@router.put("/alerts/{alert_id}/read", response_model=SecurityAlertRead)
def mark_security_alert_read(alert_id: int, db: Session = Depends(get_db)):
    row = db.get(SecurityAlert, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail="security alert no encontrada")
    row.is_read = True
    db.commit()
    db.refresh(row)
    return row


@router.get("/rules", response_model=list[SecurityRuleRead])
def get_security_rules(db: Session = Depends(get_db)):
    return list_rules(db)


@router.put("/rules/{rule_id}", response_model=SecurityRuleRead)
def update_security_rule(rule_id: int, payload: SecurityRuleUpdate, db: Session = Depends(get_db)):
    row = db.get(SecurityRule, rule_id)
    if not row:
        raise HTTPException(status_code=404, detail="security rule no encontrada")
    return update_rule(db, row, **payload.model_dump(exclude_unset=True))


@router.post("/rules/{rule_id}/toggle", response_model=ToggleRuleResponse)
def toggle_security_rule(rule_id: int, db: Session = Depends(get_db)):
    row = db.get(SecurityRule, rule_id)
    if not row:
        raise HTTPException(status_code=404, detail="security rule no encontrada")
    updated = toggle_rule(db, row)
    return ToggleRuleResponse(id=updated.id, is_active=updated.is_active)


@router.get("/blocked-entities", response_model=list[BlockedEntityRead])
def list_blocked_entities(entity_type: str | None = None, db: Session = Depends(get_db)):
    filters = []
    if entity_type:
        filters.append(BlockedEntity.entity_type == entity_type)
    return db.scalars(select(BlockedEntity).where(*filters).order_by(BlockedEntity.id.desc()).limit(500)).all()


@router.post("/blocked-entities", response_model=BlockedEntityRead)
def create_blocked_entity(payload: BlockedEntityCreate, db: Session = Depends(get_db)):
    return block_entity(
        db,
        entity_type=payload.entity_type,
        entity_key=payload.entity_key,
        reason=payload.reason,
        blocked_until=payload.blocked_until,
        auto_commit=True,
    )


@router.put("/blocked-entities/{blocked_id}/unblock", response_model=BlockedEntityRead)
def unblock_entity(blocked_id: int, db: Session = Depends(get_db)):
    row = db.get(BlockedEntity, blocked_id)
    if not row:
        raise HTTPException(status_code=404, detail="entidad bloqueada no encontrada")
    row.is_active = False
    db.commit()
    db.refresh(row)
    return row


@router.get("/kpis", response_model=SecurityKpisResponse)
def security_kpis(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return get_security_kpis(db, date_from=date_from, date_to=date_to)

