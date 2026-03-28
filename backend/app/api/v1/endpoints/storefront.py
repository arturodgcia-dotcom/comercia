from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Category, Distributor, Product, StorefrontConfig, Tenant, TenantBranding

router = APIRouter()


@router.get("/{tenant_slug}")
def get_storefront_by_slug(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug, Tenant.is_active.is_(True)))
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
    categories = db.scalars(
        select(Category).where(Category.tenant_id == tenant.id, Category.is_active.is_(True)).order_by(Category.id.asc())
    ).all()
    featured_products = db.scalars(
        select(Product)
        .where(Product.tenant_id == tenant.id, Product.is_featured.is_(True), Product.is_active.is_(True))
        .order_by(Product.id.desc())
        .limit(8)
    ).all()
    recent_products = db.scalars(
        select(Product).where(Product.tenant_id == tenant.id, Product.is_active.is_(True)).order_by(Product.id.desc()).limit(10)
    ).all()
    return {
        "tenant": tenant,
        "branding": branding,
        "storefront_config": config,
        "categories": categories,
        "featured_products": featured_products,
        "recent_products": recent_products,
    }


@router.get("/{tenant_slug}/distribuidores")
def get_distributors_by_slug(tenant_slug: str, db: Session = Depends(get_db)) -> dict:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug, Tenant.is_active.is_(True)))
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    distributors = db.scalars(
        select(Distributor).where(Distributor.tenant_id == tenant.id, Distributor.is_active.is_(True)).order_by(Distributor.id.desc())
    ).all()
    return {"tenant": tenant, "distributors": distributors}
