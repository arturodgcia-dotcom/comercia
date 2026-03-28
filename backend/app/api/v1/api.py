from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    banners,
    categories,
    checkout,
    coupons,
    loyalty,
    memberships,
    payments,
    plans,
    products,
    reviews,
    storefront,
    stripe_config,
    stripe_webhook,
    tenant_branding,
    tenants,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(tenant_branding.router, prefix="/tenant-branding", tags=["tenant-branding"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(stripe_config.router, prefix="/stripe-config", tags=["stripe-config"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(storefront.router, prefix="/storefront", tags=["storefront"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
api_router.include_router(stripe_webhook.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(loyalty.router, prefix="/loyalty", tags=["loyalty"])
api_router.include_router(memberships.router, prefix="/memberships", tags=["memberships"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(banners.router, prefix="/banners", tags=["banners"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
