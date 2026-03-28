from app.models.models import InternalAlert
from sqlalchemy.orm import Session


def create_internal_alert(
    db: Session,
    alert_type: str,
    title: str,
    message: str,
    severity: str = "info",
    related_entity_type: str | None = None,
    related_entity_id: int | None = None,
    tenant_id: int | None = None,
    commission_agent_id: int | None = None,
) -> InternalAlert:
    alert = InternalAlert(
        alert_type=alert_type,
        title=title,
        message=message,
        severity=severity,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        tenant_id=tenant_id,
        commission_agent_id=commission_agent_id,
        is_read=False,
    )
    db.add(alert)
    db.flush()
    return alert


def create_commission_sale_alert(
    db: Session,
    plan_code: str,
    referral_code: str,
    commission_agent_id: int,
    related_entity_type: str,
    related_entity_id: int,
) -> InternalAlert:
    return create_internal_alert(
        db=db,
        alert_type="commission_sale",
        title="Nueva compra de plan con comisionista",
        message=f"Nueva compra del plan {plan_code} asociada al comisionista {referral_code}. Revisar comisión para contador.",
        severity="high",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        commission_agent_id=commission_agent_id,
    )


def create_direct_sale_alert(
    db: Session, plan_code: str, related_entity_type: str, related_entity_id: int
) -> InternalAlert:
    return create_internal_alert(
        db=db,
        alert_type="direct_sale",
        title="Nueva venta directa de plan",
        message=f"Nueva venta directa del plan {plan_code} sin comisionista.",
        severity="info",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )


def create_plan_purchase_alert(
    db: Session, plan_code: str, related_entity_type: str, related_entity_id: int
) -> InternalAlert:
    return create_internal_alert(
        db=db,
        alert_type="plan_purchase",
        title="Nueva compra o inicio de compra de plan",
        message=f"Se registró un proceso de compra para el plan {plan_code}.",
        severity="info",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )


def create_appointment_request_alert(
    db: Session, related_entity_type: str, related_entity_id: int
) -> InternalAlert:
    return create_internal_alert(
        db=db,
        alert_type="appointment_request",
        title="Lead solicitó cita de diagnóstico",
        message="Lead solicitó cita de diagnóstico.",
        severity="warning",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )


def create_followup_required_alert(
    db: Session, related_entity_type: str, related_entity_id: int
) -> InternalAlert:
    return create_internal_alert(
        db=db,
        alert_type="followup_required",
        title="Lead requiere atención comercial",
        message="Lead solicitó atención comercial y requiere seguimiento.",
        severity="warning",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )


def create_accountant_notice_alert(
    db: Session,
    plan_code: str,
    referral_code: str | None,
    commission_agent_id: int | None,
    related_entity_type: str,
    related_entity_id: int,
) -> InternalAlert:
    suffix = f" con comisionista {referral_code}" if referral_code else " sin comisionista"
    return create_internal_alert(
        db=db,
        alert_type="accountant_notice",
        title="Aviso para contador",
        message=f"Registrar compra del plan {plan_code}{suffix} para control contable.",
        severity="high",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        commission_agent_id=commission_agent_id,
    )

