from __future__ import annotations

import json
from urllib import error, request

from app.core.config import get_settings


def _to_html(text: str) -> str:
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br />")
    return f"<div style='font-family:Arial,sans-serif;font-size:14px;line-height:1.5'>{safe}</div>"


def get_email_provider_name() -> str:
    settings = get_settings()
    if settings.resend_api_key.strip():
        return "resend"
    if settings.sendgrid_api_key.strip():
        return "sendgrid"
    return "none"


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    from_email: str | None = None,
    reply_to: str | None = None,
    tags: list[str] | None = None,
) -> str:
    settings = get_settings()
    target = (to_email or "").strip()
    if not target:
        raise ValueError("to_email es obligatorio")
    sender = (from_email or settings.support_from_email or "").strip()
    if not sender:
        raise ValueError("from_email no configurado")

    provider = get_email_provider_name()
    if provider == "resend":
        return _send_with_resend(
            api_key=settings.resend_api_key.strip(),
            from_email=sender,
            to_email=target,
            subject=subject,
            text_body=text_body,
            reply_to=reply_to,
            tags=tags or [],
        )
    if provider == "sendgrid":
        return _send_with_sendgrid(
            api_key=settings.sendgrid_api_key.strip(),
            from_email=sender,
            to_email=target,
            subject=subject,
            text_body=text_body,
            reply_to=reply_to,
            tags=tags or [],
        )
    raise RuntimeError("No hay proveedor de correo configurado (RESEND_API_KEY o SENDGRID_API_KEY)")


def _send_with_resend(
    *,
    api_key: str,
    from_email: str,
    to_email: str,
    subject: str,
    text_body: str,
    reply_to: str | None,
    tags: list[str],
) -> str:
    payload: dict[str, object] = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "text": text_body,
        "html": _to_html(text_body),
    }
    if reply_to:
        payload["reply_to"] = reply_to
    if tags:
        payload["tags"] = [{"name": "flow", "value": ",".join(tags[:3])}]
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        "https://api.resend.com/emails",
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return str(body.get("id") or "resend:accepted")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Resend HTTP {exc.code}: {detail[:240]}") from exc


def _send_with_sendgrid(
    *,
    api_key: str,
    from_email: str,
    to_email: str,
    subject: str,
    text_body: str,
    reply_to: str | None,
    tags: list[str],
) -> str:
    payload: dict[str, object] = {
        "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
        "from": {"email": from_email},
        "content": [
            {"type": "text/plain", "value": text_body},
            {"type": "text/html", "value": _to_html(text_body)},
        ],
    }
    if reply_to:
        payload["reply_to"] = {"email": reply_to}
    if tags:
        payload["categories"] = tags[:10]
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        "https://api.sendgrid.com/v3/mail/send",
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            if resp.status not in (200, 202):
                raise RuntimeError(f"SendGrid estatus inesperado {resp.status}")
            return "sendgrid:accepted"
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"SendGrid HTTP {exc.code}: {detail[:240]}") from exc
