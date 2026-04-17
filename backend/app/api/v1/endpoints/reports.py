from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import MarketingInsight, User
from app.services.marketing_insights_service import generate_tenant_growth_insights
from app.services.report_export_service import (
    export_distributors_csv,
    export_logistics_csv,
    export_loyalty_csv,
    export_marketing_insights_csv,
    export_products_csv,
    export_sales_csv,
    export_services_csv,
    export_users_csv,
)
from app.services.reporting_periods import group_by_from_period, resolve_period_range
from app.services.reporting_service import (
    get_appointments_summary,
    get_customer_repeat_vs_new_summary,
    get_distributor_summary,
    get_logistics_summary,
    get_loyalty_summary,
    get_membership_summary,
    get_sales_summary,
    get_services_summary,
    get_top_categories,
    get_top_selling_products,
    get_unsold_products,
    get_user_registration_summary,
    get_low_selling_products,
    get_order_status_summary,
    get_coupon_performance,
)

router = APIRouter()


def _ensure_tenant_access(user: User, tenant_id: int) -> None:
    if user.role in {"reinpia_admin", "super_admin"}:
        return
    if user.role == "tenant_admin" and user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=403, detail="sin acceso a reportes del tenant")


def _period(period: str, date_from: datetime | None, date_to: datetime | None) -> tuple[datetime | None, datetime | None]:
    return resolve_period_range(period, date_from=date_from, date_to=date_to)


@router.get("/tenant/{tenant_id}/overview")
def tenant_overview(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    group_by = group_by_from_period(period)
    return {
        "users": get_user_registration_summary(db, tenant_id, start, end),
        "sales": get_sales_summary(db, tenant_id, start, end, group_by=group_by),
        "memberships": get_membership_summary(db, tenant_id, start, end),
        "loyalty": get_loyalty_summary(db, tenant_id, start, end),
        "top_products": get_top_selling_products(db, tenant_id, start, end, limit=5),
        "logistics": get_logistics_summary(db, tenant_id, start, end),
    }


@router.get("/tenant/{tenant_id}/users")
def tenant_users_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_user_registration_summary(db, tenant_id, start, end)


@router.get("/tenant/{tenant_id}/sales")
def tenant_sales_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    group_by = group_by_from_period(period)
    return {
        **get_sales_summary(db, tenant_id, start, end, group_by=group_by),
        "order_status": get_order_status_summary(db, tenant_id, start, end),
        "repeat_vs_new": get_customer_repeat_vs_new_summary(db, tenant_id, start, end),
    }


@router.get("/tenant/{tenant_id}/memberships")
def tenant_memberships_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_membership_summary(db, tenant_id, start, end)


@router.get("/tenant/{tenant_id}/loyalty")
def tenant_loyalty_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return {
        **get_loyalty_summary(db, tenant_id, start, end),
        "coupon_performance": get_coupon_performance(db, tenant_id, start, end),
        "repeat_vs_new": get_customer_repeat_vs_new_summary(db, tenant_id, start, end),
    }


@router.get("/tenant/{tenant_id}/products/top-selling")
def tenant_products_top(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_top_selling_products(db, tenant_id, start, end, limit=limit)


@router.get("/tenant/{tenant_id}/products/low-selling")
def tenant_products_low(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_low_selling_products(db, tenant_id, start, end, limit=limit)


@router.get("/tenant/{tenant_id}/products/unsold")
def tenant_products_unsold(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_unsold_products(db, tenant_id, start, end, limit=limit)


@router.get("/tenant/{tenant_id}/distributors")
def tenant_distributors_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_distributor_summary(db, tenant_id, start, end)


@router.get("/tenant/{tenant_id}/logistics")
def tenant_logistics_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return get_logistics_summary(db, tenant_id, start, end)


@router.get("/tenant/{tenant_id}/services")
def tenant_services_report(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return {
        **get_services_summary(db, tenant_id, start, end),
        "appointments": get_appointments_summary(db, tenant_id, start, end),
    }


@router.get("/tenant/{tenant_id}/marketing-insights")
def tenant_marketing_insights(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    generate_tenant_growth_insights(db, tenant_id, start, end)
    rows = db.scalars(
        select(MarketingInsight)
        .where(MarketingInsight.tenant_id == tenant_id)
        .order_by(MarketingInsight.created_at.desc())
        .limit(100)
    ).all()
    return {
        "insights": rows,
        "top_categories": get_top_categories(db, tenant_id, start, end),
    }


@router.get("/tenant/{tenant_id}/export/users.csv")
def export_users(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_users_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/sales.csv")
def export_sales(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_sales_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/products.csv")
def export_products(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_products_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/loyalty.csv")
def export_loyalty(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_loyalty_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/distributors.csv")
def export_distributors(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_distributors_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/logistics.csv")
def export_logistics(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_logistics_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/services.csv")
def export_services(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_services_csv(db, tenant_id, start, end), media_type="text/csv")


@router.get("/tenant/{tenant_id}/export/marketing-insights.csv")
def export_marketing(
    tenant_id: int,
    period: str = "month",
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_tenant_access(user, tenant_id)
    start, end = _period(period, date_from, date_to)
    return Response(content=export_marketing_insights_csv(db, tenant_id, start, end), media_type="text/csv")
