from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import (
    Banner,
    Category,
    Coupon,
    Distributor,
    MembershipPlan,
    Product,
    ProductReview,
    ServiceOffering,
    StorefrontConfig,
    Tenant,
    TenantBranding,
)
from app.schemas.storefront import StorefrontHomeDataRead, StorefrontPayloadRead
from app.services.recommendation_service import (
    get_best_sellers_placeholder,
    get_checkout_upsell_products,
    get_featured_products,
    get_promo_products,
    get_recent_products,
)

router = APIRouter()


@router.get("/{tenant_slug}", response_model=StorefrontPayloadRead)
def get_storefront_by_slug(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = _tenant_or_404(db, tenant_slug)
    return _base_storefront_payload(db, tenant)


@router.get("/{tenant_slug}/home-data", response_model=StorefrontHomeDataRead)
def get_storefront_home_data(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = _tenant_or_404(db, tenant_slug)
    base = _base_storefront_payload(db, tenant)
    base["promo_products"] = get_promo_products(db, tenant.id, limit=8)
    base["best_sellers"] = get_best_sellers_placeholder(db, tenant.id, limit=8)
    base["services"] = db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant.id, ServiceOffering.is_active.is_(True)).order_by(ServiceOffering.id.desc())
    ).all()
    base["membership_plans"] = db.scalars(
        select(MembershipPlan).where(MembershipPlan.tenant_id == tenant.id, MembershipPlan.is_active.is_(True))
    ).all()
    return base


@router.get("/{tenant_slug}/services")
def get_storefront_services(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = _tenant_or_404(db, tenant_slug)
    services = db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant.id, ServiceOffering.is_active.is_(True)).order_by(ServiceOffering.id.desc())
    ).all()
    return {"tenant": tenant, "services": services}


@router.get("/{tenant_slug}/checkout-upsell")
def storefront_checkout_upsell(
    tenant_slug: str,
    db: Session = Depends(get_db),
    cart_product_ids: str | None = None,
):
    tenant = _tenant_or_404(db, tenant_slug)
    parsed = [int(value) for value in cart_product_ids.split(",")] if cart_product_ids else []
    products = get_checkout_upsell_products(db, tenant.id, parsed, limit=4)
    return {"tenant": tenant, "upsell_products": products}


@router.get("/{tenant_slug}/distribuidores")
def get_distributors_by_slug(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = _tenant_or_404(db, tenant_slug)
    distributors = db.scalars(
        select(Distributor).where(Distributor.tenant_id == tenant.id, Distributor.is_active.is_(True)).order_by(Distributor.id.desc())
    ).all()
    banners = _active_banners(db, tenant.id, "distributors_top")
    return {"tenant": tenant, "distributors": distributors, "banners": banners}


def _tenant_or_404(db: Session, slug: str) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == slug, Tenant.is_active.is_(True)))
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    return tenant


def _active_banners(db: Session, tenant_id: int, position: str | None = None) -> list[Banner]:
    now = datetime.utcnow()
    query = select(Banner).where(Banner.tenant_id == tenant_id, Banner.is_active.is_(True))
    if position:
        query = query.where(Banner.position == position)
    query = query.where((Banner.starts_at.is_(None)) | (Banner.starts_at <= now))
    query = query.where((Banner.ends_at.is_(None)) | (Banner.ends_at >= now))
    return db.scalars(query.order_by(Banner.priority.asc(), Banner.id.desc())).all()


def _base_storefront_payload(db: Session, tenant: Tenant) -> dict:
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
    categories = db.scalars(
        select(Category).where(Category.tenant_id == tenant.id, Category.is_active.is_(True)).order_by(Category.id.asc())
    ).all()
    featured_products = get_featured_products(db, tenant.id, limit=8)
    recent_products = get_recent_products(db, tenant.id, limit=10)
    banners = _active_banners(db, tenant.id)
    coupons = db.scalars(select(Coupon).where(Coupon.tenant_id == tenant.id, Coupon.is_active.is_(True)).limit(3)).all()

    review_avg = db.scalar(
        select(func.avg(ProductReview.rating)).where(ProductReview.tenant_id == tenant.id, ProductReview.is_approved.is_(True))
    )
    return {
        "tenant": tenant,
        "branding": branding,
        "storefront_config": config,
        "categories": categories,
        "featured_products": featured_products,
        "recent_products": recent_products,
        "banners": banners,
        "coupons": coupons,
        "average_rating": float(review_avg) if review_avg else None,
    }
