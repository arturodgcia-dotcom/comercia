from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import InternalAlert, Order, PosLocation, Product, Tenant, User
from app.services.commercial_plan_service import parse_limits
from app.services.support_center_store import load_store


def _upsert_alert(
    db: Session,
    *,
    tenant_id: int,
    code: str,
    title: str,
    message: str,
    severity: str,
) -> None:
    row = db.scalar(
        select(InternalAlert).where(
            InternalAlert.alert_type == "sentinel_minimo",
            InternalAlert.tenant_id == tenant_id,
            InternalAlert.related_entity_type == code,
            InternalAlert.is_read.is_(False),
        )
    )
    if row:
        row.title = title
        row.message = message
        row.severity = severity
        db.add(row)
        return
    db.add(
        InternalAlert(
            alert_type="sentinel_minimo",
            tenant_id=tenant_id,
            related_entity_type=code,
            related_entity_id=tenant_id,
            title=title,
            message=message,
            severity=severity,
            is_read=False,
        )
    )


def _resolve_alert(db: Session, *, tenant_id: int, code: str) -> None:
    row = db.scalar(
        select(InternalAlert).where(
            InternalAlert.alert_type == "sentinel_minimo",
            InternalAlert.tenant_id == tenant_id,
            InternalAlert.related_entity_type == code,
            InternalAlert.is_read.is_(False),
        )
    )
    if row:
        row.is_read = True
        db.add(row)


def _sync_tokens_low(db: Session, tenant: Tenant) -> None:
    included = int(tenant.ai_tokens_included or 0)
    used = int(tenant.ai_tokens_used or 0)
    balance = int(tenant.ai_tokens_balance or 0)
    if included <= 0:
        _resolve_alert(db, tenant_id=tenant.id, code="tokens_bajos")
        return
    threshold = max(10, int(included * 0.2))
    if balance > threshold:
        _resolve_alert(db, tenant_id=tenant.id, code="tokens_bajos")
        return
    _upsert_alert(
        db,
        tenant_id=tenant.id,
        code="tokens_bajos",
        title="Centinela: tokens IA bajos",
        message=f"Marca al limite de IA ({used}/{included} usados, {balance} restantes).",
        severity="high" if balance <= max(1, int(included * 0.1)) else "warning",
    )


def _sync_plan_full(db: Session, tenant: Tenant) -> None:
    limits = parse_limits(tenant)
    checks: list[tuple[str, int, int]] = []
    users_used = int(
        db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant.id, User.is_active.is_(True))) or 0
    )
    users_limit = int(limits.get("users_max") or 0)
    if users_limit > 0:
        checks.append(("usuarios", users_used, users_limit))
    products_used = int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id == tenant.id)) or 0)
    products_limit = int(limits.get("products_max") or 0)
    if products_limit > 0:
        checks.append(("productos", products_used, products_limit))
    branches_used = int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id)) or 0)
    branches_limit = int(limits.get("branches_max") or 0)
    if branches_limit > 0:
        checks.append(("sucursales", branches_used, branches_limit))

    full = [f"{name} {used}/{limit}" for name, used, limit in checks if used >= limit]
    if not full:
        _resolve_alert(db, tenant_id=tenant.id, code="plan_lleno")
        return
    _upsert_alert(
        db,
        tenant_id=tenant.id,
        code="plan_lleno",
        title="Centinela: plan lleno",
        message="Se alcanzo el limite del plan en: " + ", ".join(full) + ".",
        severity="high",
    )


def _sync_failed_payment(db: Session, tenant: Tenant) -> None:
    since = datetime.utcnow() - timedelta(hours=24)
    failed_count = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.tenant_id == tenant.id,
                Order.status == "failed",
                Order.created_at >= since,
            )
        )
        or 0
    )
    if failed_count <= 0:
        _resolve_alert(db, tenant_id=tenant.id, code="pago_fallido")
        return
    _upsert_alert(
        db,
        tenant_id=tenant.id,
        code="pago_fallido",
        title="Centinela: pagos fallidos",
        message=f"Se detectaron {failed_count} pagos fallidos en las ultimas 24 horas.",
        severity="high" if failed_count >= 3 else "warning",
    )


def _sync_urgent_ticket(db: Session, tenant: Tenant) -> None:
    store = load_store()
    urgent_open = 0
    for ticket in store.get("tickets", []):
        if int(ticket.get("tenant_id", 0)) != tenant.id:
            continue
        if str(ticket.get("prioridad", "")).strip().lower() != "urgente":
            continue
        state = str(ticket.get("estado", "")).strip().lower()
        if state in {"resuelto", "cerrado"}:
            continue
        urgent_open += 1
    if urgent_open <= 0:
        _resolve_alert(db, tenant_id=tenant.id, code="ticket_urgente")
        return
    _upsert_alert(
        db,
        tenant_id=tenant.id,
        code="ticket_urgente",
        title="Centinela: ticket urgente",
        message=f"Hay {urgent_open} ticket(s) urgentes abiertos sin cierre.",
        severity="high",
    )


def _sync_brand_no_activity(db: Session, tenant: Tenant) -> None:
    since = datetime.utcnow() - timedelta(days=30)
    orders_30d = int(
        db.scalar(select(func.count(Order.id)).where(Order.tenant_id == tenant.id, Order.created_at >= since)) or 0
    )
    if orders_30d > 0:
        _resolve_alert(db, tenant_id=tenant.id, code="marca_sin_actividad")
        return
    _upsert_alert(
        db,
        tenant_id=tenant.id,
        code="marca_sin_actividad",
        title="Centinela: marca sin actividad",
        message="No se detectaron ordenes en los ultimos 30 dias.",
        severity="warning",
    )


def sync_minimal_sentinel_alerts(db: Session) -> int:
    tenants = db.scalars(select(Tenant).where(Tenant.is_active.is_(True))).all()
    for tenant in tenants:
        _sync_tokens_low(db, tenant)
        _sync_plan_full(db, tenant)
        _sync_failed_payment(db, tenant)
        _sync_urgent_ticket(db, tenant)
        _sync_brand_no_activity(db, tenant)
    return len(tenants)
