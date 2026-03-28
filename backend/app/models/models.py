from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    subdomain: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    business_type: Mapped[str] = mapped_column(String(20), nullable=False)  # products, services, mixed
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    branding: Mapped["TenantBranding"] = relationship(back_populates="tenant", uselist=False)
    stripe_config: Mapped["StripeConfig"] = relationship(back_populates="tenant", uselist=False)


class TenantBranding(Base, TimestampMixin):
    __tablename__ = "tenant_branding"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False, index=True)
    primary_color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    secondary_color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    font_family: Mapped[str | None] = mapped_column(String(120), nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="branding")


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # fixed | commission
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    monthly_price_after_month_2: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    commission_low_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=0, nullable=False)
    commission_high_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=0, nullable=False)
    commission_threshold: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class StripeConfig(Base, TimestampMixin):
    __tablename__ = "stripe_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False, index=True)
    publishable_key: Mapped[str] = mapped_column(String(255), nullable=False)
    secret_key: Mapped[str] = mapped_column(String(255), nullable=False)
    webhook_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_reinpia_managed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship(back_populates="stripe_config")


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_public: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    price_wholesale: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    price_retail: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Distributor(Base, TimestampMixin):
    __tablename__ = "distributors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LoyaltyRule(Base, TimestampMixin):
    __tablename__ = "loyalty_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    service_name: Mapped[str] = mapped_column(String(180), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="scheduled", nullable=False)


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    recipient: Mapped[str] = mapped_column(String(180), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)


class CommissionRule(Base, TimestampMixin):
    __tablename__ = "commission_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    low_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    high_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    threshold_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
