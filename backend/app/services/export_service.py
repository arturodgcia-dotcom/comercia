import csv
import io
from datetime import datetime

from sqlalchemy.orm import Session

from app.services.analytics_service import (
    get_commissions_summary,
    get_orders,
    get_sales_summary,
    get_tenants_summary,
)


def export_sales_summary_csv(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> str:
    data = get_sales_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return _to_csv(
        headers=["total_orders", "subtotal_amount", "discount_amount", "total_revenue"],
        rows=[[data["total_orders"], data["subtotal_amount"], data["discount_amount"], data["total_revenue"]]],
    )


def export_commissions_summary_csv(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> str:
    data = get_commissions_summary(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return _to_csv(
        headers=["total_commissions", "total_net_amount"],
        rows=[[data["total_commissions"], data["total_net_amount"]]],
    )


def export_tenants_summary_csv(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    plan_id: int | None = None,
    business_type: str | None = None,
) -> str:
    rows = get_tenants_summary(
        db, date_from=date_from, date_to=date_to, status=status, plan_id=plan_id, business_type=business_type
    )
    return _to_csv(
        headers=["tenant_id", "tenant_name", "slug", "is_active", "plan_id", "business_type", "revenue", "commissions", "net_amount", "paid_orders"],
        rows=[
            [
                row["tenant_id"],
                row["tenant_name"],
                row["slug"],
                row["is_active"],
                row["plan_id"],
                row["business_type"],
                row["revenue"],
                row["commissions"],
                row["net_amount"],
                row["paid_orders"],
            ]
            for row in rows
        ],
    )


def export_orders_csv(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    status: str | None = None,
) -> str:
    rows = get_orders(db, date_from=date_from, date_to=date_to, tenant_id=tenant_id, status=status)
    return _to_csv(
        headers=[
            "id",
            "tenant_id",
            "status",
            "subtotal_amount",
            "discount_amount",
            "commission_amount",
            "net_amount",
            "total_amount",
            "currency",
            "payment_mode",
            "created_at",
        ],
        rows=[
            [
                row.id,
                row.tenant_id,
                row.status,
                row.subtotal_amount,
                row.discount_amount,
                row.commission_amount,
                row.net_amount,
                row.total_amount,
                row.currency,
                row.payment_mode,
                row.created_at.isoformat(),
            ]
            for row in rows
        ],
    )


def _to_csv(headers: list[str], rows: list[list]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    return buffer.getvalue()

