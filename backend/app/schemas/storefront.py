from pydantic import BaseModel

from app.schemas.common import TimestampSchema
from app.schemas.tenant_branding import TenantBrandingRead


class BannerRead(TimestampSchema):
    id: int
    tenant_id: int
    storefront_config_id: int
    title: str
    subtitle: str | None
    image_url: str | None
    position: int
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
