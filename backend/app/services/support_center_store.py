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
        "next_response_config_id": 1,
        "tickets": [],
        "response_configs": [],
    }


def load_store() -> dict[str, Any]:
    _ensure_dirs()
    if not STORE_PATH.exists():
        data = _default_store()
        STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
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

