from sqlalchemy import select

from app.api.v1.endpoints.storefront import get_storefront_home_data
from app.db.seed_demo import seed_demo_data
from app.db.session import SessionLocal
from app.models.models import StorefrontConfig, Tenant, TenantBranding


def run() -> None:
    with SessionLocal() as db:
        seed_demo_data(db)

        tenant = db.scalar(select(Tenant).where(Tenant.slug == "reinpia"))
        if not tenant:
            raise RuntimeError("No existe tenant reinpia en la base de datos.")

        branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
        storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
        payload = get_storefront_home_data("reinpia", db)

        print(f"tenant_slug={tenant.slug} active={tenant.is_active} id={tenant.id}")
        print(f"branding_ok={branding is not None}")
        print(f"storefront_config_ok={storefront is not None}")
        print(f"payload_tenant_slug={payload['tenant'].slug}")
        print(f"categories={len(payload.get('categories', []))}")
        print(f"featured_products={len(payload.get('featured_products', []))}")
        print(f"recent_products={len(payload.get('recent_products', []))}")
        print(f"promo_products={len(payload.get('promo_products', []))}")
        print(f"best_sellers={len(payload.get('best_sellers', []))}")
        print(f"services={len(payload.get('services', []))}")
        print(f"banners={len(payload.get('banners', []))}")
        print("verify_result=ok")


if __name__ == "__main__":
    run()
