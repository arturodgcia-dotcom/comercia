from __future__ import annotations

import json
import re
from urllib import error, request

from app.core.config import get_settings


def _normalize_phone(phone: str | None) -> str:
    raw = (phone or "").strip()
    if not raw:
        return ""
    cleaned = re.sub(r"[^0-9+]", "", raw)
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    if not cleaned.startswith("+"):
        cleaned = f"+{cleaned}"
    return cleaned


def _build_headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def send_whatsapp_text(phone: str | None, message: str) -> dict[str, object]:
    settings = get_settings()
    provider = (settings.whatsapp_provider or "").strip().lower() or "meta_cloud"
    if provider != "meta_cloud":
        return {
            "sent": False,
            "provider": provider,
            "blocker": f"Proveedor WhatsApp no soportado: {provider}",
        }

    access_token = settings.whatsapp_cloud_access_token.strip()
    phone_number_id = settings.whatsapp_cloud_phone_number_id.strip()
    api_version = settings.whatsapp_cloud_api_version.strip() or "v22.0"
    if not access_token:
        return {"sent": False, "provider": provider, "blocker": "WHATSAPP_CLOUD_ACCESS_TOKEN vacio"}
    if not phone_number_id:
        return {"sent": False, "provider": provider, "blocker": "WHATSAPP_CLOUD_PHONE_NUMBER_ID vacio"}

    destination = _normalize_phone(phone) or _normalize_phone(settings.whatsapp_default_to)
    if not destination:
        return {"sent": False, "provider": provider, "blocker": "Telefono destino vacio y WHATSAPP_DEFAULT_TO no configurado"}

    endpoint = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": destination,
        "type": "text",
        "text": {"preview_url": False, "body": (message or "").strip()[:4096]},
    }
    req = request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers=_build_headers(access_token),
    )
    try:
        with request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            msg_id = None
            messages = body.get("messages")
            if isinstance(messages, list) and messages:
                msg_id = messages[0].get("id")
            return {
                "sent": True,
                "provider": provider,
                "to": destination,
                "message_id": str(msg_id or ""),
                "raw": body,
            }
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {
            "sent": False,
            "provider": provider,
            "to": destination,
            "blocker": f"Meta WhatsApp HTTP {exc.code}",
            "detail": detail[:400],
        }
    except Exception as exc:
        return {
            "sent": False,
            "provider": provider,
            "to": destination,
            "blocker": f"{exc.__class__.__name__}: {str(exc)[:240]}",
        }


def smoke_test_whatsapp(send_message: bool = False, test_to: str | None = None) -> dict[str, object]:
    settings = get_settings()
    provider = (settings.whatsapp_provider or "").strip().lower() or "meta_cloud"
    if provider != "meta_cloud":
        return {"ok": False, "provider": provider, "blocker": f"Proveedor no soportado: {provider}"}

    access_token = settings.whatsapp_cloud_access_token.strip()
    phone_number_id = settings.whatsapp_cloud_phone_number_id.strip()
    api_version = settings.whatsapp_cloud_api_version.strip() or "v22.0"
    if not access_token:
        return {"ok": False, "provider": provider, "blocker": "WHATSAPP_CLOUD_ACCESS_TOKEN vacio"}
    if not phone_number_id:
        return {"ok": False, "provider": provider, "blocker": "WHATSAPP_CLOUD_PHONE_NUMBER_ID vacio"}

    profile_endpoint = f"https://graph.facebook.com/{api_version}/{phone_number_id}?fields=id,display_phone_number,verified_name"
    req = request.Request(profile_endpoint, headers=_build_headers(access_token), method="GET")
    try:
        with request.urlopen(req, timeout=20) as resp:
            profile = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return {"ok": False, "provider": provider, "blocker": f"Meta WhatsApp HTTP {exc.code}", "detail": detail[:400]}
    except Exception as exc:
        return {"ok": False, "provider": provider, "blocker": f"{exc.__class__.__name__}: {str(exc)[:240]}"}

    output: dict[str, object] = {
        "ok": True,
        "provider": provider,
        "profile": {
            "id": str(profile.get("id") or ""),
            "display_phone_number": str(profile.get("display_phone_number") or ""),
            "verified_name": str(profile.get("verified_name") or ""),
        },
    }

    if send_message:
        ping_result = send_whatsapp_text(test_to, "Smoke test COMERCIA WhatsApp Cloud API")
        output["send_message"] = ping_result
        if not bool(ping_result.get("sent")):
            output["ok"] = False
            output["blocker"] = str(ping_result.get("blocker") or "No fue posible enviar mensaje de smoke test")

    return output
