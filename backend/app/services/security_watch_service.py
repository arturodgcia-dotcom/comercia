from __future__ import annotations

from datetime import datetime, timedelta
import json
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import BlockedEntity, RiskScore, SecurityAlert, SecurityEvent, SecurityRule


def log_security_event(
    db: Session,
    event_type: str,
    severity: str = "low",
    status: str = "new",
    tenant_id: int | None = None,
    user_id: int | None = None,
    source_ip: str | None = None,
    user_agent: str | None = None,
    payload: dict[str, Any] | None = None,
    auto_commit: bool = True,
) -> SecurityEvent:
    event = SecurityEvent(
        tenant_id=tenant_id,
        user_id=user_id,
        event_type=event_type,
        source_ip=source_ip,
        user_agent=user_agent,
        severity=severity,
        status=status,
        event_payload_json=json.dumps(payload or {}, ensure_ascii=True),
    )
    db.add(event)
    db.flush()
    if auto_commit:
        db.commit()
        db.refresh(event)
    return event


def create_security_alert(
    db: Session,
    alert_type: str,
    title: str,
    message: str,
    severity: str = "medium",
    tenant_id: int | None = None,
    security_event_id: int | None = None,
    assigned_to: str | None = None,
    auto_commit: bool = True,
) -> SecurityAlert:
    alert = SecurityAlert(
        tenant_id=tenant_id,
        security_event_id=security_event_id,
        alert_type=alert_type,
        title=title,
        message=message,
        severity=severity,
        is_read=False,
        assigned_to=assigned_to,
    )
    db.add(alert)
    db.flush()
    if auto_commit:
        db.commit()
        db.refresh(alert)
    return alert


def block_entity(
    db: Session,
    entity_type: str,
    entity_key: str,
    reason: str,
    blocked_until: datetime | None = None,
    auto_commit: bool = True,
) -> BlockedEntity:
    row = db.scalar(
        select(BlockedEntity).where(
            BlockedEntity.entity_type == entity_type,
            BlockedEntity.entity_key == entity_key,
            BlockedEntity.is_active.is_(True),
        )
    )
    if not row:
        row = BlockedEntity(
            entity_type=entity_type,
            entity_key=entity_key,
            reason=reason,
            blocked_until=blocked_until,
            is_active=True,
        )
        db.add(row)
    else:
        row.reason = reason
        row.blocked_until = blocked_until
    db.flush()
    if auto_commit:
        db.commit()
        db.refresh(row)
    return row


def is_blocked(db: Session, entity_type: str, entity_key: str) -> bool:
    now = datetime.utcnow()
    row = db.scalar(
        select(BlockedEntity).where(
            BlockedEntity.entity_type == entity_type,
            BlockedEntity.entity_key == entity_key,
            BlockedEntity.is_active.is_(True),
        )
    )
    if not row:
        return False
    if row.blocked_until and row.blocked_until < now:
        row.is_active = False
        db.commit()
        return False
    return True


def _get_rule(db: Session, code: str) -> SecurityRule | None:
    return db.scalar(select(SecurityRule).where(SecurityRule.code == code, SecurityRule.is_active.is_(True)))


def _count_recent_events(
    db: Session,
    event_type: str,
    minutes: int,
    source_ip: str | None = None,
    user_id: int | None = None,
    tenant_id: int | None = None,
    extra_payload_match: str | None = None,
) -> int:
    since = datetime.utcnow() - timedelta(minutes=minutes)
    filters = [SecurityEvent.event_type == event_type, SecurityEvent.created_at >= since]
    if source_ip:
        filters.append(SecurityEvent.source_ip == source_ip)
    if user_id:
        filters.append(SecurityEvent.user_id == user_id)
    if tenant_id:
        filters.append(SecurityEvent.tenant_id == tenant_id)
    if extra_payload_match:
        filters.append(SecurityEvent.event_payload_json.like(f"%{extra_payload_match}%"))
    return db.scalar(select(func.count(SecurityEvent.id)).where(*filters)) or 0


def evaluate_login_failures(
    db: Session, source_ip: str | None, user_id: int | None = None, tenant_id: int | None = None
) -> None:
    rule = _get_rule(db, "LOGIN_FAIL_5_IN_10")
    if not rule or not rule.threshold_count or not rule.threshold_window_minutes:
        return
    count = _count_recent_events(
        db,
        event_type="login_failed",
        minutes=rule.threshold_window_minutes,
        source_ip=source_ip,
        user_id=user_id,
        tenant_id=tenant_id,
    )
    if count < rule.threshold_count:
        return
    alert = create_security_alert(
        db,
        alert_type="possible_fraud_login",
        title="Actividad sospechosa de login",
        message=f"Se detectaron {count} intentos fallidos de login en {rule.threshold_window_minutes} minutos.",
        severity=rule.severity,
        tenant_id=tenant_id,
        auto_commit=False,
    )
    if rule.action_type == "block_ip" and source_ip:
        block_entity(
            db,
            entity_type="ip",
            entity_key=source_ip,
            reason="Bloqueo temporal por intentos fallidos de login",
            blocked_until=datetime.utcnow() + timedelta(minutes=30),
            auto_commit=False,
        )
    db.commit()
    _ = alert


def evaluate_failed_payments(db: Session, tenant_id: int | None = None, source_ip: str | None = None) -> None:
    rule = _get_rule(db, "FAILED_PAYMENTS_3_IN_15")
    if not rule or not rule.threshold_count or not rule.threshold_window_minutes:
        return
    count = _count_recent_events(
        db,
        event_type="excessive_failed_payments",
        minutes=rule.threshold_window_minutes,
        tenant_id=tenant_id,
        source_ip=source_ip,
    )
    if count >= rule.threshold_count:
        create_security_alert(
            db,
            alert_type="possible_fraud_payments",
            title="Pagos fallidos repetidos",
            message=f"Se detectaron {count} pagos fallidos en {rule.threshold_window_minutes} minutos.",
            severity=rule.severity,
            tenant_id=tenant_id,
        )


def evaluate_coupon_abuse(
    db: Session, code: str, source_ip: str | None = None, user_id: int | None = None, tenant_id: int | None = None
) -> None:
    rule = _get_rule(db, "COUPON_ABUSE_10_IN_30")
    if not rule or not rule.threshold_count or not rule.threshold_window_minutes:
        return
    count = _count_recent_events(
        db,
        event_type="coupon_abuse",
        minutes=rule.threshold_window_minutes,
        source_ip=source_ip,
        user_id=user_id,
        tenant_id=tenant_id,
        extra_payload_match=code.upper(),
    )
    if count >= rule.threshold_count:
        create_security_alert(
            db,
            alert_type="coupon_abuse",
            title="Abuso de cupon detectado",
            message=f"El cupon {code.upper()} supero el umbral de uso sospechoso.",
            severity=rule.severity,
            tenant_id=tenant_id,
        )


def evaluate_referral_code_abuse(db: Session, code: str, source_ip: str | None = None) -> None:
    rule = _get_rule(db, "REFERRAL_ABUSE_8_IN_30")
    if not rule or not rule.threshold_count or not rule.threshold_window_minutes:
        return
    count = _count_recent_events(
        db,
        event_type="referral_code_abuse",
        minutes=rule.threshold_window_minutes,
        source_ip=source_ip,
        extra_payload_match=code.upper(),
    )
    if count >= rule.threshold_count:
        create_security_alert(
            db,
            alert_type="referral_abuse",
            title="Abuso de codigo comisionista",
            message=f"El codigo {code.upper()} se intento validar de forma anormal.",
            severity=rule.severity,
        )


def evaluate_suspicious_commission_activity(db: Session, referral_code: str, tenant_id: int | None = None) -> None:
    event = log_security_event(
        db,
        event_type="suspicious_commission_activity",
        severity="high",
        tenant_id=tenant_id,
        payload={"referral_code": referral_code.upper()},
        auto_commit=False,
    )
    create_security_alert(
        db,
        alert_type="suspicious_commission_activity",
        title="Actividad sospechosa en comisiones",
        message=f"Revisar actividad de la clave {referral_code.upper()} para posibles irregularidades.",
        severity="high",
        tenant_id=tenant_id,
        security_event_id=event.id,
        auto_commit=False,
    )
    db.commit()


def evaluate_admin_actions(db: Session, user_id: int | None, source_ip: str | None = None) -> None:
    rule = _get_rule(db, "ADMIN_ACTION_SPIKE")
    if not rule or not rule.threshold_count or not rule.threshold_window_minutes:
        return
    count = _count_recent_events(
        db,
        event_type="unusual_admin_action",
        minutes=rule.threshold_window_minutes,
        source_ip=source_ip,
        user_id=user_id,
    )
    if count >= rule.threshold_count:
        create_security_alert(
            db,
            alert_type="admin_action_spike",
            title="Pico de acciones administrativas",
            message=f"Se detectaron {count} acciones administrativas sensibles en ventana corta.",
            severity=rule.severity,
        )


def calculate_risk_score(
    db: Session,
    entity_type: str,
    entity_key: str,
    tenant_id: int | None = None,
    user_id: int | None = None,
) -> RiskScore:
    last_day = datetime.utcnow() - timedelta(hours=24)
    filters = [SecurityEvent.created_at >= last_day]
    if entity_type == "user" and user_id:
        filters.append(SecurityEvent.user_id == user_id)
    if entity_type == "ip":
        filters.append(SecurityEvent.source_ip == entity_key)
    if tenant_id:
        filters.append(SecurityEvent.tenant_id == tenant_id)

    events = db.scalars(select(SecurityEvent).where(*filters)).all()
    weight = {"low": 1, "medium": 2, "high": 5, "critical": 8}
    score_value = sum(weight.get(evt.severity, 1) for evt in events)
    if score_value >= 20:
        risk_level = "critical"
    elif score_value >= 12:
        risk_level = "high"
    elif score_value >= 6:
        risk_level = "medium"
    else:
        risk_level = "low"

    row = db.scalar(
        select(RiskScore).where(
            RiskScore.entity_type == entity_type,
            RiskScore.entity_key == entity_key,
        )
    )
    if not row:
        row = RiskScore(
            tenant_id=tenant_id,
            user_id=user_id,
            entity_type=entity_type,
            entity_key=entity_key,
            score=score_value,
            risk_level=risk_level,
            last_evaluated_at=datetime.utcnow(),
        )
        db.add(row)
    else:
        row.score = score_value
        row.risk_level = risk_level
        row.last_evaluated_at = datetime.utcnow()
        row.tenant_id = tenant_id
        row.user_id = user_id
    db.commit()
    db.refresh(row)
    return row


def get_recent_security_events(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    severity: str | None = None,
    status: str | None = None,
    event_type: str | None = None,
    limit: int = 200,
) -> list[SecurityEvent]:
    filters = []
    if date_from:
        filters.append(SecurityEvent.created_at >= date_from)
    if date_to:
        filters.append(SecurityEvent.created_at <= date_to)
    if tenant_id is not None:
        filters.append(SecurityEvent.tenant_id == tenant_id)
    if severity:
        filters.append(SecurityEvent.severity == severity)
    if status:
        filters.append(SecurityEvent.status == status)
    if event_type:
        filters.append(SecurityEvent.event_type == event_type)
    return db.scalars(select(SecurityEvent).where(*filters).order_by(SecurityEvent.id.desc()).limit(limit)).all()


def get_security_kpis(db: Session, date_from: datetime | None = None, date_to: datetime | None = None) -> dict[str, Any]:
    filters = []
    if date_from:
        filters.append(SecurityEvent.created_at >= date_from)
    if date_to:
        filters.append(SecurityEvent.created_at <= date_to)
    total_events = db.scalar(select(func.count(SecurityEvent.id)).where(*filters)) or 0
    by_severity_rows = db.execute(
        select(SecurityEvent.severity, func.count(SecurityEvent.id)).where(*filters).group_by(SecurityEvent.severity)
    ).all()
    by_severity = {row[0]: row[1] for row in by_severity_rows}
    top_event_types = [
        {"event_type": row[0], "count": row[1]}
        for row in db.execute(
            select(SecurityEvent.event_type, func.count(SecurityEvent.id))
            .where(*filters)
            .group_by(SecurityEvent.event_type)
            .order_by(func.count(SecurityEvent.id).desc())
            .limit(8)
        ).all()
    ]
    new_alerts = db.scalar(select(func.count(SecurityAlert.id)).where(SecurityAlert.is_read.is_(False))) or 0
    unread_alerts = new_alerts
    blocked_entities = db.scalar(select(func.count(BlockedEntity.id)).where(BlockedEntity.is_active.is_(True))) or 0
    return {
        "total_events": total_events,
        "critical_events": by_severity.get("critical", 0),
        "high_events": by_severity.get("high", 0),
        "medium_events": by_severity.get("medium", 0),
        "low_events": by_severity.get("low", 0),
        "new_alerts": new_alerts,
        "unread_alerts": unread_alerts,
        "blocked_entities": blocked_entities,
        "top_event_types": top_event_types,
    }

