from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class StripeConfigCreate(BaseModel):
    tenant_id: int
    publishable_key: str
    secret_key: str
    webhook_secret: str | None = None
    is_reinpia_managed: bool = True
    stripe_account_id: str | None = None


class StripeConfigRead(TimestampSchema):
    id: int
    tenant_id: int
    publishable_key: str
    secret_key: str
    webhook_secret: str | None
    is_reinpia_managed: bool
    stripe_account_id: str | None
