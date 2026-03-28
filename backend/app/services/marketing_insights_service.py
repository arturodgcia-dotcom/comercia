from __future__ import annotations

from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.models import MarketingInsight
from app.services.reporting_service import (
    get_coupon_performance,
    get_customer_repeat_vs_new_summary,
    get_distributor_summary,
    get_low_selling_products,
    get_services_summary,
    get_top_categories,
    get_top_selling_products,
    get_unsold_products,
)


def generate_product_marketing_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    _clear_period(db, tenant_id, "product")
    insights: list[MarketingInsight] = []
    top = get_top_selling_products(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to, limit=1)
    low = get_low_selling_products(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to, limit=1)
    unsold = get_unsold_products(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to, limit=3)

    if top:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="product_top",
                category=None,
                product_id=top[0]["product_id"],
                message=f"Producto mas vendido: {top[0]['name']}.",
                recommendation="Escalar pauta digital y stock del producto top.",
            )
        )
    if low:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="product_low",
                category=None,
                product_id=low[0]["product_id"],
                message=f"Producto con baja rotacion: {low[0]['name']}.",
                recommendation="Probar bundle o descuento temporal para activar conversion.",
            )
        )
    for row in unsold:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="product_unsold",
                category=None,
                product_id=row["product_id"],
                message=f"Producto sin ventas detectado: {row['name']}.",
                recommendation="Revisar precio, visibilidad en home o retirar del catalogo.",
            )
        )
    db.commit()
    return insights


def generate_category_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    top_categories = get_top_categories(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)
    if not top_categories:
        return []
    insights = [
        _add(
            db,
            tenant_id=tenant_id,
            insight_type="category_strong",
            category=top_categories[0]["name"],
            product_id=None,
            message=f"Categoria fuerte: {top_categories[0]['name']}.",
            recommendation="Mantener inversion de marketing y ampliar oferta relacionada.",
        )
    ]
    weak = top_categories[-1]
    insights.append(
        _add(
            db,
            tenant_id=tenant_id,
            insight_type="category_weak",
            category=weak["name"],
            product_id=None,
            message=f"Categoria debil: {weak['name']}.",
            recommendation="Crear campaña puntual y revisar posicionamiento de categoria.",
        )
    )
    db.commit()
    return insights


def generate_loyalty_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    repeat = get_customer_repeat_vs_new_summary(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)
    coupons = get_coupon_performance(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)
    insights: list[MarketingInsight] = []
    if repeat["repeat_customers"] < repeat["new_customers"]:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="low_repeat_purchase",
                category="loyalty",
                product_id=None,
                message="Baja recompra detectada respecto a clientes nuevos.",
                recommendation="Impulsar membresias, puntos extra y secuencia post-venta.",
            )
        )
    if coupons:
        best_coupon = sorted(coupons, key=lambda c: c["orders"], reverse=True)[0]
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="coupon_effective",
                category="coupon",
                product_id=None,
                message=f"Cupon mas efectivo: {best_coupon['code']} con {best_coupon['orders']} ordenes.",
                recommendation="Repetir estrategia del cupon ganador con audiencia similar.",
            )
        )
    db.commit()
    return insights


def generate_distributor_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    summary = get_distributor_summary(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)
    insights = []
    if summary["active_distributors"] == 0 and summary["applications"] > 0:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="distributor_inactive",
                category="distributors",
                product_id=None,
                message="Hay solicitudes de distribuidor sin activacion comercial.",
                recommendation="Acelerar aprobaciones y onboarding de canal distribuidor.",
            )
        )
    else:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="distributor_active",
                category="distributors",
                product_id=None,
                message=f"Distribuidores activos: {summary['active_distributors']}.",
                recommendation="Crear plan de incentivos y seguimiento mensual por canal.",
            )
        )
    db.commit()
    return insights


def generate_service_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    summary = get_services_summary(db, tenant_id=tenant_id, date_from=date_from, date_to=date_to)
    insights = []
    if summary["top_services"]:
        top = summary["top_services"][0]
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="service_top_reserved",
                category="services",
                product_id=None,
                message=f"Servicio mas reservado: {top['name']}.",
                recommendation="Convertirlo en oferta ancla y upsell asociado.",
            )
        )
    if summary["cancelled_appointments"] > 0:
        insights.append(
            _add(
                db,
                tenant_id=tenant_id,
                insight_type="service_cancellations",
                category="services",
                product_id=None,
                message=f"Citas canceladas: {summary['cancelled_appointments']}.",
                recommendation="Reforzar confirmacion previa y recordatorios automatizados.",
            )
        )
    db.commit()
    return insights


def generate_tenant_growth_insights(
    db: Session, tenant_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> list[MarketingInsight]:
    return (
        generate_product_marketing_insights(db, tenant_id, date_from, date_to)
        + generate_category_insights(db, tenant_id, date_from, date_to)
        + generate_loyalty_insights(db, tenant_id, date_from, date_to)
        + generate_distributor_insights(db, tenant_id, date_from, date_to)
        + generate_service_insights(db, tenant_id, date_from, date_to)
    )


def _clear_period(db: Session, tenant_id: int, prefix: str) -> None:
    db.execute(
        delete(MarketingInsight).where(
            MarketingInsight.tenant_id == tenant_id,
            MarketingInsight.insight_type.like(f"{prefix}%"),
            MarketingInsight.period_label == "current",
        )
    )


def _add(
    db: Session,
    tenant_id: int,
    insight_type: str,
    category: str | None,
    product_id: int | None,
    message: str,
    recommendation: str,
) -> MarketingInsight:
    row = MarketingInsight(
        tenant_id=tenant_id,
        insight_type=insight_type,
        category=category,
        product_id=product_id,
        message=message,
        recommendation=recommendation,
        period_label="current",
    )
    db.add(row)
    db.flush()
    return row

