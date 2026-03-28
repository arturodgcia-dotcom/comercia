from __future__ import annotations

from sqlalchemy.orm import Session

from app.services.security_watch_service import (
    evaluate_coupon_abuse,
    evaluate_failed_payments,
    evaluate_login_failures,
    evaluate_referral_code_abuse,
    log_security_event,
)


def on_auth_login_failed(
    db: Session,
    email: str,
    source_ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    log_security_event(
        db,
        event_type="login_failed",
        severity="medium",
        source_ip=source_ip,
        user_agent=user_agent,
        payload={"email": email},
        auto_commit=False,
    )
    evaluate_login_failures(db, source_ip=source_ip)
    db.commit()


def on_auth_login_success(
    db: Session,
    user_id: int,
    tenant_id: int | None = None,
    source_ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    log_security_event(
        db,
        event_type="login_success",
        severity="low",
        tenant_id=tenant_id,
        user_id=user_id,
        source_ip=source_ip,
        user_agent=user_agent,
        payload={},
        auto_commit=True,
    )


def on_checkout_payment_failed(db: Session, tenant_id: int | None = None, source_ip: str | None = None) -> None:
    log_security_event(
        db,
        event_type="excessive_failed_payments",
        severity="high",
        tenant_id=tenant_id,
        source_ip=source_ip,
        payload={},
        auto_commit=False,
    )
    evaluate_failed_payments(db, tenant_id=tenant_id, source_ip=source_ip)
    db.commit()


def on_coupon_validation_failed(
    db: Session,
    code: str,
    tenant_id: int,
    source_ip: str | None = None,
    user_id: int | None = None,
) -> None:
    log_security_event(
        db,
        event_type="coupon_abuse",
        severity="medium",
        tenant_id=tenant_id,
        user_id=user_id,
        source_ip=source_ip,
        payload={"code": code.upper()},
        auto_commit=False,
    )
    evaluate_coupon_abuse(db, code=code, source_ip=source_ip, user_id=user_id, tenant_id=tenant_id)
    db.commit()


def on_referral_validation_failed(db: Session, code: str, source_ip: str | None = None) -> None:
    log_security_event(
        db,
        event_type="referral_code_abuse",
        severity="high",
        source_ip=source_ip,
        payload={"code": code.upper()},
        auto_commit=False,
    )
    evaluate_referral_code_abuse(db, code=code, source_ip=source_ip)
    db.commit()


def on_webhook_verification_failed(db: Session, source_ip: str | None = None, reason: str | None = None) -> None:
    log_security_event(
        db,
        event_type="webhook_verification_failed",
        severity="critical",
        source_ip=source_ip,
        payload={"reason": reason or "invalid_signature"},
        auto_commit=False,
    )
    evaluate_failed_payments(db, tenant_id=None, source_ip=source_ip)
    db.commit()

