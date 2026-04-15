import json
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]
STORE_DIR = BASE_DIR / "media" / "nervia_bridge"
STORE_PATH = STORE_DIR / "metrics.json"
LOCK = Lock()


def _default_store() -> dict[str, Any]:
    return {"next_id": 1, "metrics": []}


def _ensure_store() -> None:
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        STORE_PATH.write_text(json.dumps(_default_store(), ensure_ascii=False, indent=2), encoding="utf-8")


def _load() -> dict[str, Any]:
    _ensure_store()
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = _default_store()
        STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data


def _save(data: dict[str, Any]) -> None:
    _ensure_store()
    STORE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def with_store(mutator):
    with LOCK:
        data = _load()
        result = mutator(data)
        _save(data)
        return result


def utc_now() -> datetime:
    return datetime.utcnow()
