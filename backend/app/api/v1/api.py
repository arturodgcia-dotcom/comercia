from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    categories,
    plans,
    products,
    storefront,
    stripe_config,
    tenant_branding,
    tenants,
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
