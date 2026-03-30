from datetime import datetime

from pydantic import BaseModel, Field


class ProductReviewCreate(BaseModel):
    tenant_id: int
    product_id: int
    customer_id: int | None = None
    rating: int = Field(ge=1, le=5)
    title: str | None = None
    comment: str | None = None


class ProductReviewRead(BaseModel):
    id: int
    tenant_id: int
    product_id: int
    customer_id: int | None
    rating: int
    title: str | None
    comment: str | None
    moderation_status: str
    is_approved: bool
    created_at: datetime
