from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Product


def get_featured_products(db: Session, tenant_id: int, limit: int = 8) -> list[Product]:
    return db.scalars(
        select(Product)
        .where(Product.tenant_id == tenant_id, Product.is_featured.is_(True), Product.is_active.is_(True))
        .order_by(Product.id.desc())
        .limit(limit)
    ).all()


def get_recent_products(db: Session, tenant_id: int, limit: int = 8) -> list[Product]:
    return db.scalars(
        select(Product).where(Product.tenant_id == tenant_id, Product.is_active.is_(True)).order_by(Product.id.desc()).limit(limit)
    ).all()


def get_promo_products(db: Session, tenant_id: int, limit: int = 8) -> list[Product]:
    # Base inicial: productos destacados como proxy de promociones.
    return get_featured_products(db, tenant_id, limit)


def get_best_sellers_placeholder(db: Session, tenant_id: int, limit: int = 8) -> list[Product]:
    # Placeholder documentado: mezcla featured + recientes por falta de historico de ventas.
    featured = get_featured_products(db, tenant_id, limit=limit)
    recent = get_recent_products(db, tenant_id, limit=limit)
    seen = {p.id for p in featured}
    output = list(featured)
    for product in recent:
        if product.id not in seen:
            output.append(product)
        if len(output) >= limit:
            break
    return output[:limit]


def get_checkout_upsell_products(db: Session, tenant_id: int, cart_product_ids: list[int], limit: int = 4) -> list[Product]:
    return db.scalars(
        select(Product)
        .where(Product.tenant_id == tenant_id, Product.is_active.is_(True), Product.id.not_in(cart_product_ids or [0]))
        .order_by(Product.is_featured.desc(), Product.id.desc())
        .limit(limit)
    ).all()
