from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryRead
from app.schemas.common import TimestampSchema
from app.schemas.coupon import CouponRead
from app.schemas.membership import MembershipPlanRead
from app.schemas.product import ProductRead
from app.schemas.service_offering import ServiceOfferingRead
from app.schemas.tenant_branding import TenantBrandingRead


class BannerRead(TimestampSchema):
    id: int
    tenant_id: int
    storefront_config_id: int | None
    title: str
    subtitle: str | None
    image_url: str | None
    target_type: str
    target_value: str | None
    position: str
    priority: int
    starts_at: datetime | None
    ends_at: datetime | None
    is_active: bool


class StorefrontConfigRead(TimestampSchema):
    id: int
    tenant_id: int
    is_initialized: bool
    hero_banner_url: str | None
    promotion_text: str | None
    ecommerce_enabled: bool
    landing_enabled: bool
    config_json: str | None


class StorefrontSnapshot(BaseModel):
    tenant_id: int
    tenant_slug: str
    branding: TenantBrandingRead | None
    config: StorefrontConfigRead | None
    banners: list[BannerRead]


class StorefrontTenantRead(BaseModel):
    id: int
    name: str
    slug: str
    subdomain: str
    business_type: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StorefrontPayloadRead(BaseModel):
    tenant: StorefrontTenantRead
    branding: TenantBrandingRead | None
    storefront_config: StorefrontConfigRead | None
    categories: list[CategoryRead]
    featured_products: list[ProductRead]
    recent_products: list[ProductRead]
    banners: list[BannerRead]
    coupons: list[CouponRead]
    average_rating: float | None = None


class StorefrontHomeDataRead(StorefrontPayloadRead):
    promo_products: list[ProductRead]
    best_sellers: list[ProductRead]
    services: list[ServiceOfferingRead]
    membership_plans: list[MembershipPlanRead]
