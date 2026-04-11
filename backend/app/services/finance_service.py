from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import (
    CommercialClientAccount,
    CommissionAgentSettlement,
    Order,
    SalesCommissionAgent,
    Tenant,
)


def _round(value: Decimal | int | float) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _resolve_agent_for_tenant(
    tenant_id: int,
    account_id: int | None,
    by_tenant: dict[int, SalesCommissionAgent],
    by_account: dict[int, SalesCommissionAgent],
) -> SalesCommissionAgent | None:
    tenant_agent = by_tenant.get(tenant_id)
    if tenant_agent:
        return tenant_agent
    if account_id is not None:
        return by_account.get(account_id)
    return None


def _build_agent_indexes(db: Session) -> tuple[dict[int, SalesCommissionAgent], dict[int, SalesCommissionAgent]]:
    rows = db.scalars(
        select(SalesCommissionAgent)
        .where(SalesCommissionAgent.is_active.is_(True))
        .order_by(SalesCommissionAgent.id.desc())
    ).all()
    by_tenant: dict[int, SalesCommissionAgent] = {}
    by_account: dict[int, SalesCommissionAgent] = {}
    for row in rows:
        if row.tenant_id is not None and row.tenant_id not in by_tenant:
            by_tenant[row.tenant_id] = row
        if row.commercial_client_account_id is not None and row.commercial_client_account_id not in by_account:
            by_account[row.commercial_client_account_id] = row
    return by_tenant, by_account


def get_finance_dashboard(
    db: Session,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    commercial_client_account_id: int | None = None,
    commission_agent_id: int | None = None,
) -> dict:
    filters = [Order.status == "paid"]
    if date_from:
        filters.append(Order.created_at >= date_from)
    if date_to:
        filters.append(Order.created_at <= date_to)
    if tenant_id is not None:
        filters.append(Order.tenant_id == tenant_id)

    rows = db.execute(
        select(
            Order.id,
            Order.tenant_id,
            Order.total_amount,
            Order.commission_amount,
            Order.status,
            Order.created_at,
            Tenant.name.label("tenant_name"),
            Tenant.commission_enabled.label("tenant_commission_enabled"),
            Tenant.commercial_client_account_id.label("account_id"),
            CommercialClientAccount.legal_name.label("account_name"),
        )
        .join(Tenant, Tenant.id == Order.tenant_id)
        .join(CommercialClientAccount, CommercialClientAccount.id == Tenant.commercial_client_account_id, isouter=True)
        .where(*filters)
        .order_by(Order.created_at.desc())
    ).all()

    by_tenant_agent, by_account_agent = _build_agent_indexes(db)
    if commission_agent_id is not None:
        agent_filter = db.get(SalesCommissionAgent, commission_agent_id)
        if not agent_filter:
            return {
                "resumen_ejecutivo": [],
                "comisionistas": [],
                "detalle_operaciones": [],
                "conciliacion": {
                    "comisiones_generadas": _round(0),
                    "comisiones_distribuidas": _round(0),
                    "comisiones_pagadas": _round(0),
                    "comisiones_por_pagar": _round(0),
                },
            }
        if agent_filter.tenant_id is not None:
            rows = [r for r in rows if int(r.tenant_id) == int(agent_filter.tenant_id)]
        elif agent_filter.commercial_client_account_id is not None:
            rows = [r for r in rows if r.account_id == agent_filter.commercial_client_account_id]

    if commercial_client_account_id is not None:
        rows = [r for r in rows if r.account_id == commercial_client_account_id]

    account_summary: dict[int | None, dict[str, Decimal | str | int | None]] = {}
    agent_summary: dict[int, dict[str, object]] = {}
    operation_rows: list[dict] = []

    generated_total = Decimal("0")
    distributed_total = Decimal("0")

    for row in rows:
        account_id = int(row.account_id) if row.account_id is not None else None
        account_name = str(row.account_name or "Sin cliente principal")
        tenant_name = str(row.tenant_name)
        total_amount = _round(row.total_amount or 0)
        reinpia_commission = _round(row.commission_amount or 0)
        sales_subject = total_amount if bool(row.tenant_commission_enabled) else Decimal("0")
        generated_total += reinpia_commission

        account_item = account_summary.setdefault(
            account_id,
            {
                "commercial_client_account_id": account_id,
                "cliente_principal": account_name,
                "ventas_totales": Decimal("0"),
                "ventas_sujetas_comision": Decimal("0"),
                "comision_total_generada": Decimal("0"),
                "comision_reinpia": Decimal("0"),
                "comision_distribuida": Decimal("0"),
            },
        )
        account_item["ventas_totales"] = _round(Decimal(account_item["ventas_totales"]) + total_amount)
        account_item["ventas_sujetas_comision"] = _round(Decimal(account_item["ventas_sujetas_comision"]) + sales_subject)
        account_item["comision_total_generada"] = _round(Decimal(account_item["comision_total_generada"]) + reinpia_commission)

        agent = _resolve_agent_for_tenant(int(row.tenant_id), account_id, by_tenant_agent, by_account_agent)
        agent_percentage = _round(agent.commission_percentage if agent else 0)
        distributed_commission = _round(reinpia_commission * (agent_percentage / Decimal("100")))
        distributed_total += distributed_commission
        account_item["comision_distribuida"] = _round(Decimal(account_item["comision_distribuida"]) + distributed_commission)
        account_item["comision_reinpia"] = _round(
            Decimal(account_item["comision_total_generada"]) - Decimal(account_item["comision_distribuida"])
        )

        if agent:
            agent_item = agent_summary.setdefault(
                agent.id,
                {
                    "commission_agent_id": agent.id,
                    "nombre": agent.full_name,
                    "tipo": agent.agent_type,
                    "marcas_set": set(),
                    "porcentaje": _round(agent.commission_percentage),
                    "comision_generada": Decimal("0"),
                    "comision_pagada": Decimal("0"),
                    "comision_pendiente": Decimal("0"),
                },
            )
            agent_item["marcas_set"].add(tenant_name)
            agent_item["comision_generada"] = _round(Decimal(agent_item["comision_generada"]) + distributed_commission)

        operation_rows.append(
            {
                "order_id": int(row.id),
                "tenant_id": int(row.tenant_id),
                "tenant_name": tenant_name,
                "commercial_client_account_id": account_id,
                "cliente_principal": account_name,
                "status": str(row.status),
                "total_venta": total_amount,
                "comision_reinpia": reinpia_commission,
                "comisionista_id": agent.id if agent else None,
                "comisionista_nombre": agent.full_name if agent else None,
                "comisionista_porcentaje": agent_percentage,
                "comision_distribuida": distributed_commission,
                "created_at": row.created_at,
            }
        )

    settlement_filters = []
    if commission_agent_id is not None:
        settlement_filters.append(CommissionAgentSettlement.commission_agent_id == commission_agent_id)
    if tenant_id is not None:
        settlement_filters.append(CommissionAgentSettlement.tenant_id == tenant_id)
    if commercial_client_account_id is not None:
        settlement_filters.append(CommissionAgentSettlement.commercial_client_account_id == commercial_client_account_id)
    if date_from:
        settlement_filters.append(CommissionAgentSettlement.created_at >= date_from)
    if date_to:
        settlement_filters.append(CommissionAgentSettlement.created_at <= date_to)

    settlement_rows = db.execute(
        select(CommissionAgentSettlement.commission_agent_id, func.coalesce(func.sum(CommissionAgentSettlement.amount_paid), 0))
        .where(*settlement_filters)
        .group_by(CommissionAgentSettlement.commission_agent_id)
    ).all()
    paid_by_agent = {int(agent_id): _round(amount) for agent_id, amount in settlement_rows}

    for agent_id, item in agent_summary.items():
        paid = paid_by_agent.get(agent_id, Decimal("0"))
        generated = _round(item["comision_generada"])
        pending = generated - paid
        item["comision_pagada"] = _round(paid if paid > 0 else 0)
        item["comision_pendiente"] = _round(pending if pending > 0 else 0)
        item["marcas_asociadas"] = sorted(item.pop("marcas_set"))

    paid_total = _round(sum(paid_by_agent.values(), Decimal("0")))
    pending_total = _round(max(distributed_total - paid_total, Decimal("0")))

    return {
        "resumen_ejecutivo": sorted(account_summary.values(), key=lambda row: str(row["cliente_principal"])),
        "comisionistas": sorted(agent_summary.values(), key=lambda row: str(row["nombre"])),
        "detalle_operaciones": operation_rows,
        "conciliacion": {
            "comisiones_generadas": _round(generated_total),
            "comisiones_distribuidas": _round(distributed_total),
            "comisiones_pagadas": _round(paid_total),
            "comisiones_por_pagar": _round(pending_total),
        },
    }
