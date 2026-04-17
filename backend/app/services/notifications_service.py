from __future__ import annotations

from app.core.config import get_settings
from app.services.transactional_email_service import send_transactional_email


def send_whatsapp_placeholder(phone: str | None, message: str) -> None:
    # Placeholder intencional para futura integracion oficial WhatsApp Business API.
    print("[WHATSAPP_PLACEHOLDER]", {"phone": phone, "message": message})


def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    *,
    from_email: str | None = None,
    reply_to: str | None = None,
    tags: list[str] | None = None,
) -> None:
    try:
        send_transactional_email(
            to_email=to_email,
            subject=subject,
            text_body=body,
            from_email=from_email,
            reply_to=reply_to,
            tags=tags,
        )
    except Exception as exc:
        print("[EMAIL_ERROR]", {"to": to_email, "subject": subject, "error": str(exc)[:240]})


def send_support_notification(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()
    send_email_notification(
        to_email=to_email,
        subject=subject,
        body=body,
        from_email=settings.support_from_email,
        tags=["soporte"],
    )


def send_welcome_notification(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()
    sender = settings.sales_from_email or settings.support_from_email
    send_email_notification(
        to_email=to_email,
        subject=subject,
        body=body,
        from_email=sender,
        tags=["bienvenida"],
    )


def send_alert_notification(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()
    sender = settings.alerts_from_email or settings.support_from_email
    send_email_notification(
        to_email=to_email,
        subject=subject,
        body=body,
        from_email=sender,
        tags=["alerta"],
    )
