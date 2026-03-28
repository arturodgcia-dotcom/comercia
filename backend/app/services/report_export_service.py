from __future__ import annotations

import csv
import io
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Customer, DistributorProfile, LogisticsOrder, MarketingInsight, Order, Product, ServiceOffering
from app.services.reporting_service import (
    get_coupon_performance,
    get_loyalty_summary,
    get_low_selling_products,
    get_top_selling_products,
    get_unsold_products,
)


def export_sales_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    rows = db.scalars(
        select(Order).where(
            Order.tenant_id == tenant_id,
            *((Order.created_at >= date_from,) if date_from else ()),
            *((Order.created_at <= date_to,) if date_to else ()),
        ).order_by(Order.created_at.desc())
    ).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["order_id", "status", "subtotal", "discount", "total", "commission", "net", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.status, row.subtotal_amount, row.discount_amount, row.total_amount, row.commission_amount, row.net_amount, row.created_at.isoformat()])
    return out.getvalue()


def export_users_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    rows = db.scalars(
        select(Customer).where(
            Customer.tenant_id == tenant_id,
            *((Customer.created_at >= date_from,) if date_from else ()),
            *((Customer.created_at <= date_to,) if date_to else ()),
        )
    ).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["customer_id", "full_name", "email", "phone", "loyalty_points", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.full_name, row.email, row.phone, row.loyalty_points, row.created_at.isoformat()])
    return out.getvalue()


def export_products_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    top = get_top_selling_products(db, tenant_id, date_from, date_to, 50)
    low = get_low_selling_products(db, tenant_id, date_from, date_to, 50)
    unsold = get_unsold_products(db, tenant_id, date_from, date_to, 50)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["type", "product_id", "name", "units", "revenue"])
    for row in top:
        writer.writerow(["top", row["product_id"], row["name"], row["units"], row["revenue"]])
    for row in low:
        writer.writerow(["low", row["product_id"], row["name"], row["units"], row["revenue"]])
    for row in unsold:
        writer.writerow(["unsold", row["product_id"], row["name"], 0, 0])
    return out.getvalue()


def export_loyalty_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    summary = get_loyalty_summary(db, tenant_id, date_from, date_to)
    coupons = get_coupon_performance(db, tenant_id, date_from, date_to)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["metric", "value"])
    writer.writerow(["points_accumulated", summary["points_accumulated"]])
    writer.writerow(["points_used", summary["points_used"]])
    writer.writerow(["accounts", summary["accounts"]])
    for row in coupons:
        writer.writerow([f"coupon_{row['code']}_orders", row["orders"]])
    return out.getvalue()


def export_distributors_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    rows = db.scalars(
        select(DistributorProfile).where(
            DistributorProfile.tenant_id == tenant_id,
            *((DistributorProfile.created_at >= date_from,) if date_from else ()),
            *((DistributorProfile.created_at <= date_to,) if date_to else ()),
        )
    ).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["distributor_id", "business_name", "email", "authorized", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.business_name, row.email, row.is_authorized, row.created_at.isoformat()])
    return out.getvalue()


def export_logistics_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    rows = db.scalars(
        select(LogisticsOrder).where(
            LogisticsOrder.tenant_id == tenant_id,
            *((LogisticsOrder.created_at >= date_from,) if date_from else ()),
            *((LogisticsOrder.created_at <= date_to,) if date_to else ()),
        )
    ).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["logistics_id", "status", "delivery_type", "tracking_reference", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.status, row.delivery_type, row.tracking_reference, row.created_at.isoformat()])
    return out.getvalue()


def export_services_csv(db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None) -> str:
    rows = db.scalars(select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id)).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["service_id", "name", "price", "is_active", "is_featured"])
    for row in rows:
        writer.writerow([row.id, row.name, row.price, row.is_active, row.is_featured])
    return out.getvalue()


def export_marketing_insights_csv(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> str:
    rows = db.scalars(
        select(MarketingInsight).where(
            MarketingInsight.tenant_id == tenant_id,
            *((MarketingInsight.created_at >= date_from,) if date_from else ()),
            *((MarketingInsight.created_at <= date_to,) if date_to else ()),
        )
    ).all()
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["insight_type", "category", "product_id", "message", "recommendation", "period_label", "created_at"])
    for row in rows:
        writer.writerow([row.insight_type, row.category, row.product_id, row.message, row.recommendation, row.period_label, row.created_at.isoformat()])
    return out.getvalue()

