from pydantic import BaseModel, Field

from app.schemas.common import TimestampSchema


class CustomerContactLeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    email: str = Field(min_length=5, max_length=180)
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, max_length=180)
    contact_reason: str = Field(min_length=2, max_length=50)
    message: str = Field(min_length=8, max_length=3000)
    channel: str = Field(default="customer_service_form", max_length=40)
    recommended_plan: str | None = Field(default=None, max_length=40)
    status: str = Field(default="new", max_length=30)


class CustomerContactLeadRead(TimestampSchema):
    id: int
    name: str
    email: str
    phone: str | None
    company: str | None
    contact_reason: str
    message: str
    channel: str
    recommended_plan: str | None
    status: str


class CustomerContactLeadUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=30)
    message: str | None = Field(default=None, min_length=8, max_length=3000)
    contact_reason: str | None = Field(default=None, min_length=2, max_length=50)
    recommended_plan: str | None = Field(default=None, max_length=40)
