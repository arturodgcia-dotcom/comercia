from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import AiBrandCreditAllocation, AiCreditMovement, CommercialClientAccount, Tenant
from app.services.commercial_account_guard_service import get_tenant_commercial_account

WARNING_RATIO = 0.80


@dataclass
class BrandCreditSnapshot:
    tenant_id: int
    tenant_name: str
    assigned_tokens: int
    reserved_tokens: int
    consumed_tokens: int
    remaining_tokens: int
    percentage_consumed: float
    key_state: str
    override_active: bool
    override_reason: str | None
    included_by_plan: int
    extra_assigned: int


def _parse_json_dict(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _addon_qty(account: CommercialClientAccount, addon_id: str) -> int:
    addons = _parse_json_dict(account.addons_json)
    try:
        return max(0, int(addons.get(addon_id, 0)))
    except Exception:
        return 0


def _account_extra_tokens(account: CommercialClientAccount) -> int:
    qty_legacy = _addon_qty(account, "extra_500_tokens")
    qty_official = _addon_qty(account, "extra_500_ai_credits")
    return max(qty_legacy, qty_official) * 500


def _derive_key_state(*, override_active: bool, locked: bool, remaining_tokens: int, assigned_tokens: int, consumed_tokens: int) -> str:
    if override_active:
        return "override_admin"
    if locked or remaining_tokens <= 0:
        return "bloqueada"
    if assigned_tokens > 0 and consumed_tokens >= int(assigned_tokens * WARNING_RATIO):
        return "advertencia"
    return "abierta"


def _get_active_tenants_for_account(db: Session, account_id: int) -> list[Tenant]:
    return db.scalars(
        select(Tenant)
        .where(Tenant.commercial_client_account_id == account_id, Tenant.is_active.is_(True))
        .order_by(Tenant.id.asc())
    ).all()


def _get_or_create_allocation(db: Session, *, account_id: int, tenant_id: int) -> AiBrandCreditAllocation:
    row = db.scalar(
        select(AiBrandCreditAllocation).where(
            AiBrandCreditAllocation.commercial_client_account_id == account_id,
            AiBrandCreditAllocation.tenant_id == tenant_id,
        )
    )
    if row:
        return row
    row = AiBrandCreditAllocation(
        commercial_client_account_id=account_id,
        tenant_id=tenant_id,
        assigned_tokens=0,
        reserved_tokens=0,
        manual_assignment=False,
        override_active=False,
    )
    db.add(row)
    db.flush()
    return row


def ensure_account_distribution(db: Session, account: CommercialClientAccount, *, force_auto: bool = False) -> None:
    tenants = _get_active_tenants_for_account(db, account.id)
    if not tenants:
        return

    rows = db.scalars(
        select(AiBrandCreditAllocation).where(AiBrandCreditAllocation.commercial_client_account_id == account.id)
    ).all()
    rows_by_tenant = {row.tenant_id: row for row in rows}
    has_manual = any(row.manual_assignment for row in rows)
    if has_manual and not force_auto:
        for tenant in tenants:
            if tenant.id not in rows_by_tenant:
                _get_or_create_allocation(db, account_id=account.id, tenant_id=tenant.id)
        return

    total_capacity = int(sum(int(tenant.ai_tokens_included or 0) for tenant in tenants)) + _account_extra_tokens(account)
    base_allocation = int(total_capacity / len(tenants)) if tenants else 0
    remainder = max(total_capacity - (base_allocation * len(tenants)), 0)
    for index, tenant in enumerate(tenants):
        assigned = base_allocation + (1 if index < remainder else 0)
        row = rows_by_tenant.get(tenant.id) or _get_or_create_allocation(db, account_id=account.id, tenant_id=tenant.id)
        row.assigned_tokens = max(0, assigned)
        row.reserved_tokens = max(0, int(row.reserved_tokens or 0))
        row.manual_assignment = False
        db.add(row)


def _sync_tenant_lock(tenant: Tenant, snapshot: BrandCreditSnapshot) -> None:
    if snapshot.override_active:
        tenant.ai_tokens_locked = False
        tenant.ai_tokens_lock_reason = snapshot.override_reason or "override administrativo REINPIA"
        return
    if snapshot.remaining_tokens <= 0:
        tenant.ai_tokens_locked = True
        tenant.ai_tokens_lock_reason = "creditos IA asignados agotados"
        return
    if tenant.ai_tokens_lock_reason == "creditos IA asignados agotados":
        tenant.ai_tokens_locked = False
        tenant.ai_tokens_lock_reason = None


def build_brand_credit_snapshot(db: Session, tenant: Tenant) -> BrandCreditSnapshot:
    account = get_tenant_commercial_account(db, tenant.id)
    if account:
        ensure_account_distribution(db, account, force_auto=False)
        allocation = _get_or_create_allocation(db, account_id=account.id, tenant_id=tenant.id)
        assigned_tokens = int(allocation.assigned_tokens or 0)
        reserved_tokens = int(allocation.reserved_tokens or 0)
        override_active = bool(allocation.override_active)
        override_reason = allocation.override_reason
    else:
        assigned_tokens = int(tenant.ai_tokens_included or 0)
        reserved_tokens = 0
        override_active = False
        override_reason = None
    consumed_tokens = int(tenant.ai_tokens_used or 0)
    remaining_tokens = max(assigned_tokens - reserved_tokens - consumed_tokens, 0)
    percentage_consumed = round((consumed_tokens / assigned_tokens) * 100, 2) if assigned_tokens > 0 else 0.0
    key_state = _derive_key_state(
        override_active=override_active,
        locked=bool(tenant.ai_tokens_locked),
        remaining_tokens=remaining_tokens,
        assigned_tokens=assigned_tokens,
        consumed_tokens=consumed_tokens,
    )
    included_by_plan = int(tenant.ai_tokens_included or 0)
    extra_assigned = max(assigned_tokens - included_by_plan, 0)
    snapshot = BrandCreditSnapshot(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        assigned_tokens=assigned_tokens,
        reserved_tokens=reserved_tokens,
        consumed_tokens=consumed_tokens,
        remaining_tokens=remaining_tokens,
        percentage_consumed=percentage_consumed,
        key_state=key_state,
        override_active=override_active,
        override_reason=override_reason,
        included_by_plan=included_by_plan,
        extra_assigned=extra_assigned,
    )
    _sync_tenant_lock(tenant, snapshot)
    tenant.ai_tokens_balance = int(snapshot.remaining_tokens)
    return snapshot


def record_credit_movement(
    db: Session,
    *,
    tenant: Tenant,
    action: str,
    source: str,
    tokens_delta: int,
    balance_after: int,
    notes: str | None = None,
    created_by_user_id: int | None = None,
) -> None:
    db.add(
        AiCreditMovement(
            tenant_id=tenant.id,
            commercial_client_account_id=tenant.commercial_client_account_id,
            source=source,
            action=action,
            tokens_delta=tokens_delta,
            balance_after=balance_after,
            notes=notes,
            created_by_user_id=created_by_user_id,
        )
    )


def consume_tenant_credits(
    db: Session,
    *,
    tenant: Tenant,
    amount: int,
    source: str,
    notes: str | None = None,
    created_by_user_id: int | None = None,
) -> BrandCreditSnapshot:
    if amount <= 0:
        raise ValueError("tokens a consumir debe ser mayor a 0")
    snapshot = build_brand_credit_snapshot(db, tenant)
    if snapshot.key_state == "bloqueada" and not snapshot.override_active:
        raise ValueError("la llave IA esta bloqueada por saldo agotado")
    if not snapshot.override_active and amount > snapshot.remaining_tokens:
        raise ValueError("consumo excede creditos asignados de la marca")

    tenant.ai_tokens_used = int(tenant.ai_tokens_used or 0) + amount
    next_snapshot = build_brand_credit_snapshot(db, tenant)
    record_credit_movement(
        db,
        tenant=tenant,
        action="consume",
        source=source,
        tokens_delta=-abs(amount),
        balance_after=next_snapshot.remaining_tokens,
        notes=notes,
        created_by_user_id=created_by_user_id,
    )
    return next_snapshot


def topup_tenant_credits(
    db: Session,
    *,
    tenant: Tenant,
    amount: int,
    reason: str | None = None,
    created_by_user_id: int | None = None,
) -> BrandCreditSnapshot:
    if amount <= 0:
        raise ValueError("tokens a recargar debe ser mayor a 0")
    tenant.ai_tokens_included = int(tenant.ai_tokens_included or 0) + amount
    tenant.ai_tokens_last_reset_at = datetime.utcnow()
    snapshot = build_brand_credit_snapshot(db, tenant)
    record_credit_movement(
        db,
        tenant=tenant,
        action="topup",
        source="admin_topup",
        tokens_delta=abs(amount),
        balance_after=snapshot.remaining_tokens,
        notes=reason,
        created_by_user_id=created_by_user_id,
    )
    return snapshot


def set_tenant_override(
    db: Session,
    *,
    tenant: Tenant,
    active: bool,
    reason: str | None,
    actor_user_id: int | None,
) -> BrandCreditSnapshot:
    account = get_tenant_commercial_account(db, tenant.id)
    if account:
        ensure_account_distribution(db, account, force_auto=False)
        allocation = _get_or_create_allocation(db, account_id=account.id, tenant_id=tenant.id)
        allocation.override_active = bool(active)
        allocation.override_reason = (reason or "").strip() or None
        allocation.override_by_user_id = actor_user_id
        db.add(allocation)
    if active:
        tenant.ai_tokens_locked = False
        tenant.ai_tokens_lock_reason = (reason or "").strip() or "override administrativo REINPIA"
    else:
        tenant.ai_tokens_lock_reason = None
    snapshot = build_brand_credit_snapshot(db, tenant)
    record_credit_movement(
        db,
        tenant=tenant,
        action="override_on" if active else "override_off",
        source="admin_override",
        tokens_delta=0,
        balance_after=snapshot.remaining_tokens,
        notes=reason,
        created_by_user_id=actor_user_id,
    )
    return snapshot


def set_manual_account_distribution(
    db: Session,
    *,
    account: CommercialClientAccount,
    allocations: list[dict],
    actor_user_id: int | None,
) -> None:
    tenants = _get_active_tenants_for_account(db, account.id)
    allowed_ids = {tenant.id for tenant in tenants}
    total_capacity = int(sum(int(tenant.ai_tokens_included or 0) for tenant in tenants)) + _account_extra_tokens(account)
    assigned_sum = 0
    for item in allocations:
        tenant_id = int(item.get("tenant_id") or 0)
        if tenant_id not in allowed_ids:
            raise ValueError("una asignacion incluye una marca fuera de la cuenta comercial")
        assigned_tokens = max(0, int(item.get("assigned_tokens") or 0))
        reserved_tokens = max(0, int(item.get("reserved_tokens") or 0))
        if reserved_tokens > assigned_tokens:
            raise ValueError("creditos reservados no puede ser mayor a creditos asignados")
        assigned_sum += assigned_tokens
    if assigned_sum > total_capacity:
        raise ValueError("la distribucion excede la capacidad total de creditos IA del tenant comercial")

    for item in allocations:
        tenant_id = int(item.get("tenant_id") or 0)
        row = _get_or_create_allocation(db, account_id=account.id, tenant_id=tenant_id)
        row.assigned_tokens = max(0, int(item.get("assigned_tokens") or 0))
        row.reserved_tokens = max(0, int(item.get("reserved_tokens") or 0))
        row.manual_assignment = True
        db.add(row)
        tenant = db.get(Tenant, tenant_id)
        if tenant:
            snapshot = build_brand_credit_snapshot(db, tenant)
            record_credit_movement(
                db,
                tenant=tenant,
                action="assign_manual",
                source="admin_distribution",
                tokens_delta=0,
                balance_after=snapshot.remaining_tokens,
                notes="asignacion manual de creditos IA",
                created_by_user_id=actor_user_id,
            )


def build_account_ai_credit_payload(db: Session, account: CommercialClientAccount) -> dict:
    ensure_account_distribution(db, account, force_auto=False)
    tenants = _get_active_tenants_for_account(db, account.id)
    snapshots: list[BrandCreditSnapshot] = []
    for tenant in tenants:
        snapshots.append(build_brand_credit_snapshot(db, tenant))
    total_included = int(sum(int(tenant.ai_tokens_included or 0) for tenant in tenants))
    total_extra = _account_extra_tokens(account)
    total_capacity = total_included + total_extra
    total_assigned = int(sum(item.assigned_tokens for item in snapshots))
    total_consumed = int(sum(item.consumed_tokens for item in snapshots))
    total_reserved = int(sum(item.reserved_tokens for item in snapshots))
    total_remaining = max(total_assigned - total_consumed - total_reserved, 0)
    brands_warning = sum(1 for item in snapshots if item.key_state == "advertencia")
    brands_blocked = sum(1 for item in snapshots if item.key_state == "bloqueada")
    brands_override = sum(1 for item in snapshots if item.override_active)

    return {
        "account_id": account.id,
        "total_tokens_included": total_included,
        "total_tokens_extra": total_extra,
        "total_tokens_capacity": total_capacity,
        "total_tokens_assigned": total_assigned,
        "total_tokens_consumed": total_consumed,
        "total_tokens_reserved": total_reserved,
        "total_tokens_remaining": total_remaining,
        "brands_warning": brands_warning,
        "brands_blocked": brands_blocked,
        "brands_override": brands_override,
        "brands": [
            {
                "tenant_id": item.tenant_id,
                "tenant_name": item.tenant_name,
                "assigned_tokens": item.assigned_tokens,
                "reserved_tokens": item.reserved_tokens,
                "consumed_tokens": item.consumed_tokens,
                "remaining_tokens": item.remaining_tokens,
                "percentage_consumed": item.percentage_consumed,
                "key_state": item.key_state,
                "override_active": item.override_active,
                "override_reason": item.override_reason,
                "included_by_plan": item.included_by_plan,
                "extra_assigned": item.extra_assigned,
            }
            for item in snapshots
        ],
    }


def list_tenant_credit_movements(
    db: Session,
    *,
    tenant_id: int,
    limit: int = 20,
) -> list[AiCreditMovement]:
    return db.scalars(
        select(AiCreditMovement)
        .where(AiCreditMovement.tenant_id == tenant_id)
        .order_by(AiCreditMovement.created_at.desc(), AiCreditMovement.id.desc())
        .limit(max(1, min(limit, 100)))
    ).all()
