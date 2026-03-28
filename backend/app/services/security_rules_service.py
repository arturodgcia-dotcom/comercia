from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import SecurityRule


DEFAULT_SECURITY_RULES = [
    {
        "code": "LOGIN_FAIL_5_IN_10",
        "name": "Intentos fallidos de login",
        "description": "Detecta 5 intentos fallidos de login en 10 minutos.",
        "rule_type": "login_failures",
        "threshold_count": 5,
        "threshold_window_minutes": 10,
        "action_type": "block_ip",
        "severity": "high",
    },
    {
        "code": "FAILED_PAYMENTS_3_IN_15",
        "name": "Pagos fallidos repetidos",
        "description": "Detecta 3 pagos fallidos en 15 minutos por tenant o cliente.",
        "rule_type": "failed_payments",
        "threshold_count": 3,
        "threshold_window_minutes": 15,
        "action_type": "mark_review",
        "severity": "high",
    },
    {
        "code": "COUPON_ABUSE_10_IN_30",
        "name": "Abuso de cupones",
        "description": "Detecta abuso por intentos repetidos de validacion de cupon.",
        "rule_type": "coupon_abuse",
        "threshold_count": 10,
        "threshold_window_minutes": 30,
        "action_type": "disable_coupon",
        "severity": "medium",
    },
    {
        "code": "REFERRAL_ABUSE_8_IN_30",
        "name": "Abuso de referral/comisionista",
        "description": "Detecta uso anormal de codigos de comisionista.",
        "rule_type": "referral_abuse",
        "threshold_count": 8,
        "threshold_window_minutes": 30,
        "action_type": "freeze_referral",
        "severity": "high",
    },
    {
        "code": "ADMIN_ACTION_SPIKE",
        "name": "Pico de acciones administrativas",
        "description": "Detecta volumen anormal de acciones administrativas sensibles.",
        "rule_type": "admin_action_spike",
        "threshold_count": 20,
        "threshold_window_minutes": 10,
        "action_type": "alert_only",
        "severity": "medium",
    },
    {
        "code": "WEBHOOK_FAILURE_REPEAT",
        "name": "Fallas repetidas de webhook",
        "description": "Detecta fallas reiteradas de verificacion de firma webhook.",
        "rule_type": "webhook_failure",
        "threshold_count": 3,
        "threshold_window_minutes": 15,
        "action_type": "alert_only",
        "severity": "critical",
    },
]


def seed_default_security_rules(db: Session) -> None:
    for rule_data in DEFAULT_SECURITY_RULES:
        rule = db.scalar(select(SecurityRule).where(SecurityRule.code == rule_data["code"]))
        if not rule:
            db.add(SecurityRule(**rule_data, is_active=True))
            continue
        for key, value in rule_data.items():
            setattr(rule, key, value)
        if rule.is_active is None:
            rule.is_active = True
    db.flush()


def list_rules(db: Session) -> list[SecurityRule]:
    return db.scalars(select(SecurityRule).order_by(SecurityRule.id.asc())).all()


def update_rule(db: Session, rule: SecurityRule, **changes) -> SecurityRule:
    for key, value in changes.items():
        if value is not None:
            setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return rule


def toggle_rule(db: Session, rule: SecurityRule) -> SecurityRule:
    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)
    return rule

