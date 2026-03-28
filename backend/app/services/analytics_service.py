from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.models import (
    Appointment,
    DistributorApplication,
    DistributorProfile,
    LogisticsOrder,
    Order,
    Plan,
    PlanPurchaseLead,
    InternalAlert,
    Subscription,
    Tenant,
)
from app.services.commission_agents_service import get_commission_sales_kpis


def get_global_kpis(db: Session, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    order_filters = _order_filters(date_from=date_from, date_to=date_to)
    paid_count = db.scalar(select(func.count(Order.id)).where(*order_filters, Order.status == "paid")) or 0
    failed_count = db.scalar(select(func.count(Order.id)).where(*order_filters, Order.status == "failed")) or 0
    total_revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(*order_filters, Order.status == "paid")) or 0
    total_commissions = db.scalar(
        select(func.coalesce(func.sum(Order.commission_amount), 0)).where(*order_filters, Order.status == "paid")
    ) or 0
    total_net = db.scalar(select(func.coalesce(func.sum(Order.net_amount), 0)).where(*order_filters, Order.status == "paid")) or 0
    avg_order_value = (
        Decimal(total_revenue) / Decimal(paid_count) if paid_count else Decimal("0")
    ).quantize(Decimal("0.01"))

    tenant_total = db.scalar(select(func.count(Tenant.id))) or 0
    tenant_active = db.scalar(select(func.count(Tenant.id)).where(Tenant.is_active.is_(True))) or 0
    tenant_inactive = tenant_total - tenant_active

    appointments_total = db.scalar(
        select(func.count(Appointment.id)).where(*_date_filters(Appointment.created_at, date_from, date_to))
    ) or 0
    logistics_total = db.scalar(
        select(func.count(LogisticsOrder.id)).where(*_date_filters(LogisticsOrder.created_at, date_from, date_to))
    ) or 0
    logistics_delivered = db.scalar(
        select(func.count(LogisticsOrder.id)).where(
            *_date_filters(LogisticsOrder.created_at, date_from, date_to),
            LogisticsOrder.status == "delivered",
        )
    ) or 0
    distributor_apps = db.scalar(
        select(func.count(DistributorApplication.id)).where(
            *_date_filters(DistributorApplication.created_at, date_from, date_to)
        )
    ) or 0
    approved_distributors = db.scalar(
        select(func.count(DistributorProfile.id)).where(
            *_date_filters(DistributorProfile.created_at, date_from, date_to),
            DistributorProfile.is_authorized.is_(True),
        )
    ) or 0
    active_subscriptions = db.scalar(
        select(func.count(Subscription.id)).where(Subscription.status == "active")
    ) or 0

    commission_kpis = get_commission_sales_kpis(db, date_from=date_from, date_to=date_to)
    return {
        "total_tenants": tenant_total,
        "tenants_active": tenant_active,
        "tenants_inactive": tenant_inactive,
        "total_revenue": _to_float(total_revenue),
        "total_commissions": _to_float(total_commissions),
        "total_net_amount": _to_float(total_net),
        "total_paid_orders": paid_count,
        "total_failed_orders": failed_count,
        "average_order_value": _to_float(avg_order_value),
        "total_distributor_applications": distributor_apps,
        "total_approved_distributors": approved_distributors,
        "total_active_subscriptions": active_subscriptions,
        "total_appointments": appointments_total,
        "total_logistics_orders": logistics_total,
        "delivered_logistics_orders": logistics_delivered,
        **commission_kpis,
    }


def get_tenant_kpis(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    order_filters = _order_filters(date_from=date_from, date_to=date_to, tenant_id=tenant_id)
    paid_orders = db.scalar(select(func.count(Order.id)).where(*order_filters, Order.status == "paid")) or 0
    failed_orders = db.scalar(select(func.count(Order.id)).where(*order_filters, Order.status == "failed")) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(*order_filters, Order.status == "paid")) or 0
    commissions = db.scalar(
        select(func.coalesce(func.sum(Order.commission_amount), 0)).where(*order_filters, Order.status == "paid")
    ) or 0
    net = db.scalar(select(func.coalesce(func.sum(Order.net_amount), 0)).where(*order_filters, Order.status == "paid")) or 0
    active_sub = db.scalar(
        select(func.count(Subscription.id)).where(Subscription.tenant_id == tenant_id, Subscription.status == "active")
    ) or 0
    distributors_approved = db.scalar(
        select(func.count(DistributorProfile.id)).where(
            DistributorProfile.tenant_id == tenant_id,
            DistributorProfile.is_authorized.is_(True),
        )
    ) or 0
    appointments = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.tenant_id == tenant_id,
            *_date_filters(Appointment.created_at, date_from, date_to),
        )
    ) or 0
    logistics_delivered = db.scalar(
        select(func.count(LogisticsOrder.id)).where(
            LogisticsOrder.tenant_id == tenant_id,
            LogisticsOrder.status == "delivered",
            *_date_filters(LogisticsOrder.created_at, date_from, date_to),
        )
    ) or 0

    return {
        "tenant_id": tenant_id,
        "revenue": _to_float(revenue),
        "commissions": _to_float(commissions),
        "net_amount": _to_float(net),
        "paid_orders": paid_orders,
        "failed_orders": failed_orders,
        "active_subscription_status": active_sub > 0,
        "distributors_approved": distributors_approved,
        "appointments_count": appointments,
        "logistics_delivered_count": logistics_delivered,
    }


def get_sales_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> dict:
    filters = _order_filters(date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    total_orders = db.scalar(select(func.count(Order.id)).where(*filters)) or 0
    total_revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(*filters)) or 0
    subtotal = db.scalar(select(func.coalesce(func.sum(Order.subtotal_amount), 0)).where(*filters)) or 0
    discounts = db.scalar(select(func.coalesce(func.sum(Order.discount_amount), 0)).where(*filters)) or 0
    return {
        "total_orders": total_orders,
        "subtotal_amount": _to_float(subtotal),
        "discount_amount": _to_float(discounts),
        "total_revenue": _to_float(total_revenue),
    }


def get_commissions_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> dict:
    filters = _order_filters(date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    commission = db.scalar(select(func.coalesce(func.sum(Order.commission_amount), 0)).where(*filters)) or 0
    net = db.scalar(select(func.coalesce(func.sum(Order.net_amount), 0)).where(*filters)) or 0
    return {"total_commissions": _to_float(commission), "total_net_amount": _to_float(net)}


def get_orders_timeseries(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
) -> list[dict]:
    filters = _order_filters(date_from=date_from, date_to=date_to, tenant_id=tenant_id)
    rows = db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.coalesce(func.sum(Order.commission_amount), 0).label("commissions"),
            func.count(Order.id).label("orders"),
            func.sum(case((Order.status == "paid", 1), else_=0)).label("paid_orders"),
            func.sum(case((Order.status == "failed", 1), else_=0)).label("failed_orders"),
        )
        .where(*filters)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at).asc())
    ).all()
    return [
        {
            "day": str(row.day),
            "revenue": _to_float(row.revenue),
            "commissions": _to_float(row.commissions),
            "orders": int(row.orders or 0),
            "paid_orders": int(row.paid_orders or 0),
            "failed_orders": int(row.failed_orders or 0),
        }
        for row in rows
    ]


def get_top_tenants_by_revenue(
    db: Session,
    limit: int = 10,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[dict]:
    filters = _order_filters(date_from=date_from, date_to=date_to, status="paid")
    rows = db.execute(
        select(
            Tenant.id.label("tenant_id"),
            Tenant.name.label("tenant_name"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.coalesce(func.sum(Order.commission_amount), 0).label("commissions"),
            func.coalesce(func.sum(Order.net_amount), 0).label("net_amount"),
        )
        .join(Order, Order.tenant_id == Tenant.id)
        .where(*filters)
        .group_by(Tenant.id, Tenant.name)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(limit)
    ).all()
    return [
        {
            "tenant_id": row.tenant_id,
            "tenant_name": row.tenant_name,
            "revenue": _to_float(row.revenue),
            "commissions": _to_float(row.commissions),
            "net_amount": _to_float(row.net_amount),
        }
        for row in rows
    ]


def get_plan_distribution(db: Session) -> list[dict]:
    rows = db.execute(
        select(Plan.code, Plan.name, func.count(Tenant.id))
        .select_from(Tenant)
        .join(Plan, Plan.id == Tenant.plan_id, isouter=True)
        .group_by(Plan.code, Plan.name)
        .order_by(func.count(Tenant.id).desc())
    ).all()
    return [{"plan_code": row[0] or "NONE", "plan_name": row[1] or "Sin plan", "count": int(row[2] or 0)} for row in rows]


def get_business_type_distribution(db: Session) -> list[dict]:
    rows = db.execute(
        select(Tenant.business_type, func.count(Tenant.id)).group_by(Tenant.business_type).order_by(func.count(Tenant.id).desc())
    ).all()
    return [{"business_type": row[0], "count": int(row[1] or 0)} for row in rows]


def get_active_vs_inactive_tenants(db: Session) -> dict:
    active = db.scalar(select(func.count(Tenant.id)).where(Tenant.is_active.is_(True))) or 0
    inactive = db.scalar(select(func.count(Tenant.id)).where(Tenant.is_active.is_(False))) or 0
    return {"active": active, "inactive": inactive}


def get_appointments_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> dict:
    filters = _generic_filters(Appointment.tenant_id, tenant_id, Appointment.created_at, date_from, date_to)
    if status:
        filters.append(Appointment.status == status)
    total = db.scalar(select(func.count(Appointment.id)).where(*filters)) or 0
    by_status_rows = db.execute(select(Appointment.status, func.count(Appointment.id)).where(*filters).group_by(Appointment.status)).all()
    return {
        "total": total,
        "by_status": [{"status": row[0], "count": int(row[1] or 0)} for row in by_status_rows],
    }


def get_logistics_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> dict:
    filters = _generic_filters(LogisticsOrder.tenant_id, tenant_id, LogisticsOrder.created_at, date_from, date_to)
    if status:
        filters.append(LogisticsOrder.status == status)
    total = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters)) or 0
    delivered = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters, LogisticsOrder.status == "delivered")) or 0
    by_status_rows = db.execute(
        select(LogisticsOrder.status, func.count(LogisticsOrder.id)).where(*filters).group_by(LogisticsOrder.status)
    ).all()
    return {
        "total": total,
        "delivered": delivered,
        "by_status": [{"status": row[0], "count": int(row[1] or 0)} for row in by_status_rows],
    }


def get_distributors_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> dict:
    app_filters = _generic_filters(
        DistributorApplication.tenant_id, tenant_id, DistributorApplication.created_at, date_from, date_to
    )
    if status:
        app_filters.append(DistributorApplication.status == status)
    total_applications = db.scalar(select(func.count(DistributorApplication.id)).where(*app_filters)) or 0

    profile_filters = _generic_filters(DistributorProfile.tenant_id, tenant_id, DistributorProfile.created_at, date_from, date_to)
    approved_profiles = db.scalar(
        select(func.count(DistributorProfile.id)).where(*profile_filters, DistributorProfile.is_authorized.is_(True))
    ) or 0
    return {"total_applications": total_applications, "approved_profiles": approved_profiles}


def get_tenants_summary(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    plan_id: int | None = None,
    business_type: str | None = None,
) -> list[dict]:
    tenant_filters = []
    if status == "active":
        tenant_filters.append(Tenant.is_active.is_(True))
    elif status == "inactive":
        tenant_filters.append(Tenant.is_active.is_(False))
    if plan_id is not None:
        tenant_filters.append(Tenant.plan_id == plan_id)
    if business_type:
        tenant_filters.append(Tenant.business_type == business_type)

    tenants = db.scalars(select(Tenant).where(*tenant_filters).order_by(Tenant.id.asc())).all()
    summary: list[dict] = []
    for tenant in tenants:
        kpis = get_tenant_kpis(db, tenant.id, date_from=date_from, date_to=date_to)
        summary.append(
            {
                "tenant_id": tenant.id,
                "tenant_name": tenant.name,
                "slug": tenant.slug,
                "is_active": tenant.is_active,
                "plan_id": tenant.plan_id,
                "business_type": tenant.business_type,
                "revenue": kpis["revenue"],
                "commissions": kpis["commissions"],
                "net_amount": kpis["net_amount"],
                "paid_orders": kpis["paid_orders"],
            }
        )
    return summary


def get_orders(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> list[Order]:
    filters = _order_filters(date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return db.scalars(select(Order).where(*filters).order_by(Order.id.desc())).all()


def get_tenant_subscriptions(db: Session, tenant_id: int, status: str | None = None, plan_id: int | None = None) -> list[Subscription]:
    filters = [Subscription.tenant_id == tenant_id]
    if status:
        filters.append(Subscription.status == status)
    if plan_id is not None:
        filters.append(Subscription.plan_id == plan_id)
    return db.scalars(select(Subscription).where(*filters).order_by(Subscription.id.desc())).all()


def _order_filters(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> list:
    filters = _generic_filters(Order.tenant_id, tenant_id, Order.created_at, date_from, date_to)
    if status:
        filters.append(Order.status == status)
    return filters


def _generic_filters(tenant_col, tenant_id: int | None, date_col, date_from: datetime | None, date_to: datetime | None) -> list:
    filters = []
    if tenant_id is not None:
        filters.append(tenant_col == tenant_id)
    filters.extend(_date_filters(date_col, date_from, date_to))
    return filters


def _date_filters(date_col, date_from: datetime | None, date_to: datetime | None) -> list:
    clauses = []
    if date_from:
        clauses.append(date_col >= date_from)
    if date_to:
        clauses.append(date_col <= date_to)
    return clauses


def _to_float(value: Decimal | int | float) -> float:
    return float(Decimal(value).quantize(Decimal("0.01")))
