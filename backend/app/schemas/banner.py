from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class BannerCreate(BaseModel):
    tenant_id: int
    title: str
    image_url: str | None = None
    target_type: str = "promotion"
    target_value: str | None = None
    position: str = "hero"
    priority: int = 1
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    is_active: bool = True


class BannerUpdate(BaseModel):
    title: str | None = None
    image_url: str | None = None
    target_type: str | None = None
    target_value: str | None = None
    position: str | None = None
    priority: int | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    is_active: bool | None = None


class BannerRead(TimestampSchema):
    id: int
    tenant_id: int
    title: str
    image_url: str | None
    target_type: str
    target_value: str | None
    position: str
    priority: int
    starts_at: datetime | None
    ends_at: datetime | None
    is_active: bool
