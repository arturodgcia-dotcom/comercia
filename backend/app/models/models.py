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
    business_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("plans.id"), nullable=True, index=True)

    branding: Mapped["TenantBranding"] = relationship(back_populates="tenant", uselist=False)
    stripe_config: Mapped["StripeConfig"] = relationship(back_populates="tenant", uselist=False)
    storefront_config: Mapped["StorefrontConfig"] = relationship(back_populates="tenant", uselist=False)
    orders: Mapped[list["Order"]] = relationship(back_populates="tenant")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True, index=True)


class TenantBranding(Base, TimestampMixin):
    __tablename__ = "tenant_branding"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False, index=True)
    primary_color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    secondary_color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hero_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hero_subtitle: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact_whatsapp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    font_family: Mapped[str | None] = mapped_column(String(120), nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="branding")


class StorefrontConfig(Base, TimestampMixin):
    __tablename__ = "storefront_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False, index=True)
    is_initialized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hero_banner_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    promotion_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ecommerce_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    landing_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="storefront_config")


class Banner(Base, TimestampMixin):
    __tablename__ = "banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    storefront_config_id: Mapped[int | None] = mapped_column(ForeignKey("storefront_configs.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_type: Mapped[str] = mapped_column(String(30), default="promotion", nullable=False)
    target_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    position: Mapped[str] = mapped_column(String(30), default="hero", nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    monthly_price_after_month_2: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    commission_low_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=0, nullable=False)
    commission_high_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=0, nullable=False)
    commission_threshold: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    commission_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
    stripe_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

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


class ServiceOffering(Base, TimestampMixin):
    __tablename__ = "service_offerings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_schedule: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="mxn", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    payment_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    coupon_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    loyalty_points_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    has_service_items: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    service_payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_gift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gift_sender_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_sender_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gift_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    gift_recipient_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_recipient_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_recipient_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    appointment_scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    tenant: Mapped["Tenant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    commission_details: Mapped[list["CommissionDetail"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    service_offering_id: Mapped[int | None] = mapped_column(
        ForeignKey("service_offerings.id"), nullable=True, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")


class CommissionDetail(Base):
    __tablename__ = "commission_details"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    rule_applied: Mapped[str] = mapped_column(String(20), nullable=False)
    percentage: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="commission_details")


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class LoyaltyProgram(Base, TimestampMixin):
    __tablename__ = "loyalty_programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    points_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    points_conversion_rate: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=1, nullable=False)
    welcome_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    birthday_points: Mapped[int | None] = mapped_column(Integer, nullable=True)


class LoyaltyRule(Base, TimestampMixin):
    __tablename__ = "loyalty_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, default="rule")
    loyalty_program_id: Mapped[int] = mapped_column(ForeignKey("loyalty_programs.id"), nullable=False, index=True)
    rule_type: Mapped[str] = mapped_column(String(60), nullable=False)
    min_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    discount_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    discount_value: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    applies_to: Mapped[str] = mapped_column(String(20), default="all", nullable=False)
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class MembershipPlan(Base, TimestampMixin):
    __tablename__ = "membership_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    points_multiplier: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=1, nullable=False)
    benefits_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Coupon(Base, TimestampMixin):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    min_order_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    applies_to: Mapped[str] = mapped_column(String(20), default="all", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class CustomerLoyaltyAccount(Base, TimestampMixin):
    __tablename__ = "customer_loyalty_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    loyalty_program_id: Mapped[int] = mapped_column(ForeignKey("loyalty_programs.id"), nullable=False, index=True)
    points_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    membership_plan_id: Mapped[int | None] = mapped_column(ForeignKey("membership_plans.id"), nullable=True, index=True)
    membership_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(180), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Distributor(Base, TimestampMixin):
    __tablename__ = "distributors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    service_offering_id: Mapped[int | None] = mapped_column(ForeignKey("service_offerings.id"), nullable=True, index=True)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    service_name: Mapped[str] = mapped_column(String(180), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="scheduled", nullable=False)
    is_gift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gift_sender_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_sender_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    gift_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    gift_recipient_name: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_recipient_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    gift_recipient_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    instructions_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    confirmation_received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class DistributorApplication(Base, TimestampMixin):
    __tablename__ = "distributor_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(180), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    requested_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class DistributorProfile(Base, TimestampMixin):
    __tablename__ = "distributor_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    distributor_application_id: Mapped[int | None] = mapped_column(
        ForeignKey("distributor_applications.id"), nullable=True, index=True
    )
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(180), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    is_authorized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    authorization_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    can_purchase_wholesale: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_sell_as_franchise: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    warehouse_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class DistributorEmployee(Base, TimestampMixin):
    __tablename__ = "distributor_employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    distributor_profile_id: Mapped[int] = mapped_column(ForeignKey("distributor_profiles.id"), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(180), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    role_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ContractTemplate(Base, TimestampMixin):
    __tablename__ = "contract_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True, index=True)
    contract_type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SignedContract(Base, TimestampMixin):
    __tablename__ = "signed_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    contract_template_id: Mapped[int] = mapped_column(ForeignKey("contract_templates.id"), nullable=False, index=True)
    distributor_profile_id: Mapped[int | None] = mapped_column(ForeignKey("distributor_profiles.id"), nullable=True, index=True)
    signed_by_name: Mapped[str] = mapped_column(String(180), nullable=False)
    signed_by_email: Mapped[str] = mapped_column(String(180), nullable=False)
    signed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    signature_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="signed", nullable=False)


class RecurringOrderSchedule(Base, TimestampMixin):
    __tablename__ = "recurring_order_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    distributor_profile_id: Mapped[int | None] = mapped_column(ForeignKey("distributor_profiles.id"), nullable=True, index=True)
    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    next_run_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class RecurringOrderItem(Base):
    __tablename__ = "recurring_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recurring_order_schedule_id: Mapped[int] = mapped_column(
        ForeignKey("recurring_order_schedules.id"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class LogisticsOrder(Base, TimestampMixin):
    __tablename__ = "logistics_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    recurring_order_schedule_id: Mapped[int | None] = mapped_column(
        ForeignKey("recurring_order_schedules.id"), nullable=True, index=True
    )
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True, index=True)
    distributor_profile_id: Mapped[int | None] = mapped_column(ForeignKey("distributor_profiles.id"), nullable=True, index=True)
    delivery_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    warehouse_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    scheduled_delivery_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    tracking_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    courier_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    delivery_notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class LogisticsEvent(Base):
    __tablename__ = "logistics_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    logistics_order_id: Mapped[int] = mapped_column(ForeignKey("logistics_orders.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    event_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


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
