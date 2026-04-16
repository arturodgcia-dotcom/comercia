import json
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]
MEDIA_DIR = BASE_DIR / "media" / "support_center"
UPLOADS_DIR = MEDIA_DIR / "uploads"
STORE_PATH = MEDIA_DIR / "store.json"
LOCK = Lock()


def _ensure_dirs() -> None:
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _default_store() -> dict[str, Any]:
    return {
        "next_ticket_id": 1,
        "next_attachment_id": 1,
        "next_message_id": 1,
        "next_timeline_event_id": 1,
        "next_response_config_id": 1,
        "tickets": [],
        "timeline_events": [],
        "response_configs": [],
    }


def _normalize_store(data: dict[str, Any]) -> dict[str, Any]:
    if "next_timeline_event_id" not in data:
        data["next_timeline_event_id"] = 1
    if "timeline_events" not in data or not isinstance(data.get("timeline_events"), list):
        data["timeline_events"] = []
    if "tickets" not in data or not isinstance(data.get("tickets"), list):
        data["tickets"] = []
    if "response_configs" not in data or not isinstance(data.get("response_configs"), list):
        data["response_configs"] = []

    max_ticket_id = 0
    for ticket in data["tickets"]:
        try:
            ticket_id = int(ticket.get("id", 0))
        except Exception:
            ticket_id = 0
        max_ticket_id = max(max_ticket_id, ticket_id)
        if not ticket.get("folio"):
            ticket["folio"] = f"SUP-{ticket_id:06d}" if ticket_id else None
        if not ticket.get("origen"):
            ticket["origen"] = "cliente"
        if "responsable_user_id" not in ticket:
            ticket["responsable_user_id"] = None
        if "ultima_respuesta_at" not in ticket:
            ticket["ultima_respuesta_at"] = ticket.get("updated_at")

    if int(data.get("next_ticket_id", 1)) <= max_ticket_id:
        data["next_ticket_id"] = max_ticket_id + 1

    max_event_id = 0
    for event in data["timeline_events"]:
        try:
            max_event_id = max(max_event_id, int(event.get("id", 0)))
        except Exception:
            continue
    if int(data.get("next_timeline_event_id", 1)) <= max_event_id:
        data["next_timeline_event_id"] = max_event_id + 1
    return data


def load_store() -> dict[str, Any]:
    _ensure_dirs()
    if not STORE_PATH.exists():
        data = _default_store()
        STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data
    try:
        data = json.loads(STORE_PATH.read_text(encoding="utf-8"))
        return _normalize_store(data)
    except Exception:
        data = _default_store()
        STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data


def save_store(data: dict[str, Any]) -> None:
    _ensure_dirs()
    STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def with_store(mutator):
    with LOCK:
        data = load_store()
        result = mutator(data)
        save_store(data)
        return result


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat()


def to_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return datetime.utcnow()
