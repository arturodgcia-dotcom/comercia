from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.models import (
    Appointment,
    Category,
    Coupon,
    Customer,
    CustomerLoyaltyAccount,
    DistributorApplication,
    DistributorProfile,
    LogisticsOrder,
    MembershipPlan,
    Order,
    OrderItem,
    Product,
    RecurringOrderSchedule,
    ServiceOffering,
    User,
)


def get_user_registration_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    customer_filters = _tenant_date_filters(Customer.tenant_id, Customer.created_at, tenant_id, date_from, date_to)
    distributor_filters = _tenant_date_filters(
        DistributorProfile.tenant_id, DistributorProfile.created_at, tenant_id, date_from, date_to
    )
    user_filters = _tenant_date_filters(User.tenant_id, User.created_at, tenant_id, date_from, date_to)

    total_public = db.scalar(select(func.count(Customer.id)).where(*customer_filters)) or 0
    total_distributor_users = db.scalar(
        select(func.count(User.id)).where(*user_filters, User.role == "distributor_user")
    ) or 0
    total_distributor_profiles = db.scalar(select(func.count(DistributorProfile.id)).where(*distributor_filters)) or 0
    total_distributor_authorized = db.scalar(
        select(func.count(DistributorProfile.id)).where(*distributor_filters, DistributorProfile.is_authorized.is_(True))
    ) or 0
    return {
        "total_public_users": total_public,
        "total_distributor_users": total_distributor_users,
        "total_distributor_profiles": total_distributor_profiles,
        "total_authorized_distributors": total_distributor_authorized,
        "new_registrations": total_public + total_distributor_users,
    }


def get_sales_summary(
    db: Session,
    tenant_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    group_by: str = "day",
) -> dict:
    filters = _tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to)
    total_sales = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(*filters, Order.status == "paid")) or 0
    paid_orders = db.scalar(select(func.count(Order.id)).where(*filters, Order.status == "paid")) or 0
    failed_orders = db.scalar(select(func.count(Order.id)).where(*filters, Order.status == "failed")) or 0
    avg_ticket = (Decimal(total_sales) / Decimal(paid_orders) if paid_orders else Decimal("0")).quantize(Decimal("0.01"))
    recurring_sales = db.scalar(select(func.count(Order.id)).where(*filters, Order.status == "paid", Order.payment_mode == "plan2")) or 0
    series = get_revenue_timeseries(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to, group_by=group_by)
    return {
        "total_sales": _to_float(total_sales),
        "paid_orders": paid_orders,
        "failed_orders": failed_orders,
        "average_ticket": _to_float(avg_ticket),
        "recurring_sales": recurring_sales,
        "timeseries": series,
    }


def get_sales_period_buckets(db: Session, tenant_id: int | None = None) -> dict:
    now = datetime.utcnow()
    return {
        "last_day": get_sales_summary(db, tenant_id=tenant_id, date_from=now.replace(hour=0, minute=0, second=0, microsecond=0), date_to=now),
        "last_week": get_sales_summary(db, tenant_id=tenant_id, date_from=now.replace(microsecond=0) - timedelta(days=7), date_to=now),
        "last_month": get_sales_summary(db, tenant_id=tenant_id, date_from=now.replace(microsecond=0) - timedelta(days=30), date_to=now),
    }


def get_membership_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    plan_filters = _tenant_date_filters(MembershipPlan.tenant_id, MembershipPlan.created_at, tenant_id, date_from, date_to)
    active_plans = db.scalar(select(func.count(MembershipPlan.id)).where(*plan_filters, MembershipPlan.is_active.is_(True))) or 0
    inactive_plans = db.scalar(select(func.count(MembershipPlan.id)).where(*plan_filters, MembershipPlan.is_active.is_(False))) or 0
    with_membership = db.scalar(
        select(func.count(CustomerLoyaltyAccount.id))
        .select_from(CustomerLoyaltyAccount)
        .join(Customer, Customer.id == CustomerLoyaltyAccount.customer_id)
        .where(*_tenant_date_filters(Customer.tenant_id, Customer.created_at, tenant_id, date_from, date_to), CustomerLoyaltyAccount.membership_plan_id.is_not(None))
    ) or 0
    return {
        "active_memberships": active_plans,
        "inactive_memberships": inactive_plans,
        "customers_with_membership": with_membership,
    }


def get_loyalty_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    filters = _tenant_date_filters(CustomerLoyaltyAccount.tenant_id, CustomerLoyaltyAccount.created_at, tenant_id, date_from, date_to)
    total_points = db.scalar(select(func.coalesce(func.sum(CustomerLoyaltyAccount.points_balance), 0)).where(*filters)) or 0
    accounts = db.scalar(select(func.count(CustomerLoyaltyAccount.id)).where(*filters)) or 0
    used_points = db.scalar(select(func.coalesce(func.sum(Order.loyalty_points_used), 0)).where(*_tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to))) or 0
    return {
        "points_accumulated": int(total_points or 0),
        "points_used": int(used_points or 0),
        "accounts": accounts,
    }


def get_top_selling_products(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None, limit: int = 10) -> list[dict]:
    return _product_sales(db, tenant_id, date_from, date_to, limit, descending=True)


def get_low_selling_products(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None, limit: int = 10) -> list[dict]:
    return _product_sales(db, tenant_id, date_from, date_to, limit, descending=False)


def get_unsold_products(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None, limit: int = 10) -> list[dict]:
    tenant_filters = [Product.tenant_id == tenant_id] if tenant_id is not None else []
    sold_subquery = (
        select(OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(*_tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to), OrderItem.product_id.is_not(None))
        .group_by(OrderItem.product_id)
    )
    rows = db.execute(
        select(Product.id, Product.name, Product.slug, Product.price_public)
        .where(*tenant_filters, Product.id.not_in(sold_subquery))
        .order_by(Product.id.asc())
        .limit(limit)
    ).all()
    return [{"product_id": r.id, "name": r.name, "slug": r.slug, "price_public": _to_float(r.price_public)} for r in rows]


def get_top_categories(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> list[dict]:
    rows = db.execute(
        select(
            Category.id,
            Category.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units"),
            func.coalesce(func.sum(OrderItem.total_price), 0).label("revenue"),
        )
        .select_from(Category)
        .join(Product, Product.category_id == Category.id, isouter=True)
        .join(OrderItem, OrderItem.product_id == Product.id, isouter=True)
        .join(Order, Order.id == OrderItem.order_id, isouter=True)
        .where(*_tenant_date_filters(Category.tenant_id, Order.created_at, tenant_id, date_from, date_to))
        .group_by(Category.id, Category.name)
        .order_by(func.coalesce(func.sum(OrderItem.total_price), 0).desc())
    ).all()
    return [{"category_id": r.id, "name": r.name, "units": int(r.units or 0), "revenue": _to_float(r.revenue)} for r in rows]


def get_order_status_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    filters = _tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to)
    rows = db.execute(select(Order.status, func.count(Order.id)).where(*filters).group_by(Order.status)).all()
    return {"by_status": [{"status": r[0], "count": int(r[1] or 0)} for r in rows]}


def get_distributor_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    apps = db.scalar(select(func.count(DistributorApplication.id)).where(*_tenant_date_filters(DistributorApplication.tenant_id, DistributorApplication.created_at, tenant_id, date_from, date_to))) or 0
    active = db.scalar(select(func.count(DistributorProfile.id)).where(*_tenant_date_filters(DistributorProfile.tenant_id, DistributorProfile.created_at, tenant_id, date_from, date_to), DistributorProfile.is_authorized.is_(True))) or 0
    inactive = db.scalar(select(func.count(DistributorProfile.id)).where(*_tenant_date_filters(DistributorProfile.tenant_id, DistributorProfile.created_at, tenant_id, date_from, date_to), DistributorProfile.is_authorized.is_(False))) or 0
    recurring = db.scalar(select(func.count(RecurringOrderSchedule.id)).where(*_tenant_date_filters(RecurringOrderSchedule.tenant_id, RecurringOrderSchedule.created_at, tenant_id, date_from, date_to), RecurringOrderSchedule.distributor_profile_id.is_not(None))) or 0
    return {"applications": apps, "active_distributors": active, "inactive_distributors": inactive, "recurring_orders": recurring}


def get_logistics_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    filters = _tenant_date_filters(LogisticsOrder.tenant_id, LogisticsOrder.created_at, tenant_id, date_from, date_to)
    total = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters)) or 0
    delivered = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters, LogisticsOrder.status == "delivered")) or 0
    delayed = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters, LogisticsOrder.status == "rescheduled")) or 0
    failed = db.scalar(select(func.count(LogisticsOrder.id)).where(*filters, LogisticsOrder.status == "failed")) or 0
    return {"total": total, "delivered": delivered, "delayed_or_rescheduled": delayed, "failed": failed}


def get_services_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    service_filters = [ServiceOffering.tenant_id == tenant_id] if tenant_id is not None else []
    top_rows = db.execute(
        select(ServiceOffering.id, ServiceOffering.name, func.count(Appointment.id).label("bookings"))
        .select_from(ServiceOffering)
        .join(Appointment, Appointment.service_offering_id == ServiceOffering.id, isouter=True)
        .where(*service_filters, *_date_filters(Appointment.created_at, date_from, date_to))
        .group_by(ServiceOffering.id, ServiceOffering.name)
        .order_by(func.count(Appointment.id).desc())
        .limit(10)
    ).all()
    cancelled = db.scalar(
        select(func.count(Appointment.id)).where(
            *_tenant_date_filters(Appointment.tenant_id, Appointment.created_at, tenant_id, date_from, date_to),
            Appointment.status == "cancelled",
        )
    ) or 0
    completed = db.scalar(
        select(func.count(Appointment.id)).where(
            *_tenant_date_filters(Appointment.tenant_id, Appointment.created_at, tenant_id, date_from, date_to),
            Appointment.status == "completed",
        )
    ) or 0
    return {
        "top_services": [{"service_id": r.id, "name": r.name, "bookings": int(r.bookings or 0)} for r in top_rows],
        "cancelled_appointments": cancelled,
        "completed_appointments": completed,
    }


def get_appointments_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    rows = db.execute(
        select(Appointment.status, func.count(Appointment.id))
        .where(*_tenant_date_filters(Appointment.tenant_id, Appointment.created_at, tenant_id, date_from, date_to))
        .group_by(Appointment.status)
    ).all()
    return {"by_status": [{"status": r[0], "count": int(r[1] or 0)} for r in rows]}


def get_coupon_performance(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> list[dict]:
    rows = db.execute(
        select(
            Coupon.code,
            Coupon.used_count,
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.discount_amount), 0).label("discount_total"),
        )
        .select_from(Coupon)
        .join(Order, and_(Order.coupon_code == Coupon.code, Order.tenant_id == Coupon.tenant_id), isouter=True)
        .where(*_tenant_date_filters(Coupon.tenant_id, Order.created_at, tenant_id, date_from, date_to))
        .group_by(Coupon.code, Coupon.used_count)
        .order_by(func.count(Order.id).desc())
    ).all()
    return [
        {"code": r.code, "used_count": int(r.used_count or 0), "orders": int(r.orders or 0), "discount_total": _to_float(r.discount_total)}
        for r in rows
    ]


def get_banner_performance_placeholder(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> list[dict]:
    from app.models.models import Banner

    rows = db.execute(
        select(Banner.id, Banner.title, Banner.position, Banner.priority)
        .where(*_tenant_date_filters(Banner.tenant_id, Banner.created_at, tenant_id, date_from, date_to))
        .order_by(Banner.priority.asc())
    ).all()
    return [
        {
            "banner_id": r.id,
            "title": r.title,
            "position": r.position,
            "estimated_ctr": round(0.7 + (max(1, 5 - int(r.priority))) * 0.1, 2),
            "note": "placeholder basado en prioridad hasta integrar tracking real",
        }
        for r in rows
    ]


def get_customer_repeat_vs_new_summary(db: Session, tenant_id: int | None = None, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    filters = _tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to)
    customer_orders = db.execute(
        select(Order.customer_id, func.count(Order.id))
        .where(*filters, Order.customer_id.is_not(None))
        .group_by(Order.customer_id)
    ).all()
    repeat_customers = len([row for row in customer_orders if int(row[1] or 0) > 1])
    new_customers = len([row for row in customer_orders if int(row[1] or 0) == 1])
    return {"repeat_customers": repeat_customers, "new_customers": new_customers}


def get_revenue_timeseries(
    db: Session,
    tenant_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    group_by: str = "day",
) -> list[dict]:
    date_expr = func.date(Order.created_at)
    if group_by == "month":
        date_expr = func.strftime("%Y-%m", Order.created_at)
    elif group_by == "week":
        date_expr = func.strftime("%Y-W%W", Order.created_at)
    rows = db.execute(
        select(
            date_expr.label("bucket"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .where(*_tenant_date_filters(Order.tenant_id, Order.created_at, tenant_id, date_from, date_to), Order.status == "paid")
        .group_by("bucket")
        .order_by("bucket")
    ).all()
    return [{"bucket": str(r.bucket), "revenue": _to_float(r.revenue), "orders": int(r.orders or 0)} for r in rows]


def _product_sales(db: Session, tenant_id: int | None, date_from: datetime | None, date_to: datetime | None, limit: int, descending: bool) -> list[dict]:
    order_by_expr = func.coalesce(func.sum(OrderItem.quantity), 0).desc() if descending else func.coalesce(func.sum(OrderItem.quantity), 0).asc()
    rows = db.execute(
        select(
            Product.id,
            Product.name,
            Product.slug,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units"),
            func.coalesce(func.sum(OrderItem.total_price), 0).label("revenue"),
        )
        .select_from(Product)
        .join(OrderItem, OrderItem.product_id == Product.id, isouter=True)
        .join(Order, Order.id == OrderItem.order_id, isouter=True)
        .where(*_tenant_date_filters(Product.tenant_id, Order.created_at, tenant_id, date_from, date_to))
        .group_by(Product.id, Product.name, Product.slug)
        .order_by(order_by_expr)
        .limit(limit)
    ).all()
    return [{"product_id": r.id, "name": r.name, "slug": r.slug, "units": int(r.units or 0), "revenue": _to_float(r.revenue)} for r in rows]


def _tenant_date_filters(tenant_col, date_col, tenant_id: int | None, date_from: datetime | None, date_to: datetime | None) -> list:
    filters = []
    if tenant_id is not None:
        filters.append(tenant_col == tenant_id)
    filters.extend(_date_filters(date_col, date_from, date_to))
    return filters


def _date_filters(date_col, date_from: datetime | None, date_to: datetime | None) -> list:
    out = []
    if date_from:
        out.append(date_col >= date_from)
    if date_to:
        out.append(date_col <= date_to)
    return out


def _to_float(value: Decimal | int | float) -> float:
    return float(Decimal(value).quantize(Decimal("0.01")))
