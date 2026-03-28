from datetime import datetime

from pydantic import BaseModel


class WishlistCreate(BaseModel):
    tenant_id: int
    customer_id: int
    product_id: int


class WishlistRead(BaseModel):
    id: int
    tenant_id: int
    customer_id: int
    product_id: int
    created_at: datetime
