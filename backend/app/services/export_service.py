import csv
import io
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.services.analytics_service import (
    get_commissions_summary,
    get_orders,
    get_sales_summary,
    get_tenants_summary,
)
from app.models.models import PlanPurchaseLead, SalesCommissionAgent


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


def export_commission_agents_csv(db: Session) -> str:
    rows = db.scalars(select(SalesCommissionAgent).order_by(SalesCommissionAgent.id.asc())).all()
    return _to_csv(
        headers=["id", "code", "full_name", "email", "phone", "is_active", "commission_percentage", "valid_from", "valid_until", "notes"],
        rows=[
            [
                row.id,
                row.code,
                row.full_name,
                row.email,
                row.phone,
                row.is_active,
                row.commission_percentage,
                row.valid_from.isoformat() if row.valid_from else "",
                row.valid_until.isoformat() if row.valid_until else "",
                row.notes or "",
            ]
            for row in rows
        ],
    )


def export_plan_purchase_leads_csv(
    db: Session,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
) -> str:
    filters = []
    if date_from:
        filters.append(PlanPurchaseLead.created_at >= date_from)
    if date_to:
        filters.append(PlanPurchaseLead.created_at <= date_to)
    if status:
        filters.append(PlanPurchaseLead.purchase_status == status)
    rows = db.scalars(select(PlanPurchaseLead).where(*filters).order_by(PlanPurchaseLead.id.desc())).all()
    return _to_csv(
        headers=[
            "id",
            "company_name",
            "legal_type",
            "buyer_name",
            "buyer_email",
            "buyer_phone",
            "selected_plan_code",
            "commission_agent_id",
            "referral_code",
            "is_commissioned_sale",
            "needs_followup",
            "needs_appointment",
            "purchase_status",
            "notes",
            "created_at",
        ],
        rows=[
            [
                row.id,
                row.company_name,
                row.legal_type,
                row.buyer_name,
                row.buyer_email,
                row.buyer_phone,
                row.selected_plan_code,
                row.commission_agent_id or "",
                row.referral_code or "",
                row.is_commissioned_sale,
                row.needs_followup,
                row.needs_appointment,
                row.purchase_status,
                row.notes or "",
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
