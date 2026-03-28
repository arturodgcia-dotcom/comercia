from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class TenantBrandingUpsert(BaseModel):
    primary_color: str | None = None
    secondary_color: str | None = None
    logo_url: str | None = None
    hero_title: str | None = None
    hero_subtitle: str | None = None
    contact_whatsapp: str | None = None
    contact_email: str | None = None
    font_family: str | None = None


class TenantBrandingRead(TimestampSchema):
    id: int
    tenant_id: int
    primary_color: str | None
    secondary_color: str | None
    logo_url: str | None
    hero_title: str | None
    hero_subtitle: str | None
    contact_whatsapp: str | None
    contact_email: str | None
    font_family: str | None
