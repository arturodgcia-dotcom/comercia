from __future__ import annotations

from datetime import datetime, timedelta


def resolve_period_range(
    period_code: str,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> tuple[datetime | None, datetime | None]:
    period = (period_code or "month").strip().lower()
    now = datetime.utcnow()
    if period == "custom":
        return date_from, date_to
    if period == "day":
        return now - timedelta(days=1), now
    if period == "week":
        return now - timedelta(days=7), now
    if period == "fortnight":
        return now - timedelta(days=15), now
    if period == "month":
        return now - timedelta(days=30), now
    if period == "quarter":
        return now - timedelta(days=90), now
    if period == "half_year":
        return now - timedelta(days=180), now
    if period == "year":
        return now - timedelta(days=365), now
    return now - timedelta(days=30), now


def group_by_from_period(period_code: str) -> str:
    period = (period_code or "month").strip().lower()
    if period in {"day", "week", "fortnight"}:
        return "day"
    if period in {"month", "quarter"}:
        return "week"
    return "month"

