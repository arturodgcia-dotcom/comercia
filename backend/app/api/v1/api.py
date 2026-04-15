from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin_settings,
    automation,
    appointments,
    auth,
    banners,
    brand_diagnostics,
    brand_setup,
    categories,
    commercial_plans,
    comercia_public,
    checkout,
    contracts,
    coupons,
    currency,
    distributors_ops,
    logistics,
    loyalty,
    memberships,
    mercadopago_settings,
    onboarding,
    payments,
    plans,
    pos,
    products,
    reports,
    recurring_orders,
    reinpia_admin,
    reinpia_finance,
    reviews,
    security,
    services,
    storefront,
    support_center,
    stripe_config,
    stripe_webhook,
    tenant_branding,
    tenant_config,
    tenants,
    users_admin,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(tenant_branding.router, prefix="/tenant-branding", tags=["tenant-branding"])
api_router.include_router(tenant_config.router, prefix="/tenant", tags=["tenant-config"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(stripe_config.router, prefix="/stripe-config", tags=["stripe-config"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(commercial_plans.router, prefix="/commercial-plans", tags=["commercial-plans"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(storefront.router, prefix="/storefront", tags=["storefront"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
api_router.include_router(stripe_webhook.router, prefix="/stripe", tags=["stripe"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(loyalty.router, prefix="/loyalty", tags=["loyalty"])
api_router.include_router(memberships.router, prefix="/memberships", tags=["memberships"])
api_router.include_router(mercadopago_settings.router, prefix="/mercadopago-settings", tags=["mercadopago-settings"])
api_router.include_router(coupons.router, prefix="/coupons", tags=["coupons"])
api_router.include_router(banners.router, prefix="/banners", tags=["banners"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(security.router, prefix="/security", tags=["security"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(distributors_ops.router, prefix="/distributors", tags=["distributors"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(support_center.router, prefix="/support-center", tags=["support-center"])
api_router.include_router(recurring_orders.router, prefix="/recurring-orders", tags=["recurring-orders"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["logistics"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(currency.router, tags=["currency"])
api_router.include_router(pos.router, prefix="/pos", tags=["pos"])
api_router.include_router(automation.router, prefix="/automation", tags=["automation"])
api_router.include_router(reinpia_admin.router, prefix="/reinpia", tags=["reinpia-admin"])
api_router.include_router(reinpia_finance.router)
api_router.include_router(comercia_public.router, prefix="/comercia", tags=["comercia-public"])
api_router.include_router(brand_setup.router, prefix="/brand-setup", tags=["brand-setup"])
api_router.include_router(brand_diagnostics.router, tags=["brand-diagnostics"])
api_router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
api_router.include_router(users_admin.router, prefix="/admin", tags=["users-admin"])
