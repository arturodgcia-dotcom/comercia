"""Initial COMERCIA schema

Revision ID: 20260327_01
Revises:
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260327_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("subdomain", sa.String(length=120), nullable=False),
        sa.Column("business_type", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
        sa.UniqueConstraint("subdomain"),
    )
    op.create_index("ix_tenants_id", "tenants", ["id"])

    op.create_table(
        "plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("monthly_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("monthly_price_after_month_2", sa.Numeric(12, 2), nullable=False),
        sa.Column("commission_low_rate", sa.Numeric(6, 4), nullable=False),
        sa.Column("commission_high_rate", sa.Numeric(6, 4), nullable=False),
        sa.Column("commission_threshold", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_plans_id", "plans", ["id"])

    op.create_table(
        "tenant_branding",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("primary_color", sa.String(length=30), nullable=True),
        sa.Column("secondary_color", sa.String(length=30), nullable=True),
        sa.Column("logo_url", sa.String(length=255), nullable=True),
        sa.Column("font_family", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index("ix_tenant_branding_id", "tenant_branding", ["id"])
    op.create_index("ix_tenant_branding_tenant_id", "tenant_branding", ["tenant_id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscriptions_id", "subscriptions", ["id"])
    op.create_index("ix_subscriptions_tenant_id", "subscriptions", ["tenant_id"])

    op.create_table(
        "stripe_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("publishable_key", sa.String(length=255), nullable=False),
        sa.Column("secret_key", sa.String(length=255), nullable=False),
        sa.Column("webhook_secret", sa.String(length=255), nullable=True),
        sa.Column("is_reinpia_managed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index("ix_stripe_configs_id", "stripe_configs", ["id"])
    op.create_index("ix_stripe_configs_tenant_id", "stripe_configs", ["tenant_id"])

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_categories_id", "categories", ["id"])
    op.create_index("ix_categories_tenant_id", "categories", ["tenant_id"])

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_public", sa.Numeric(12, 2), nullable=False),
        sa.Column("price_wholesale", sa.Numeric(12, 2), nullable=True),
        sa.Column("price_retail", sa.Numeric(12, 2), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_id", "products", ["id"])
    op.create_index("ix_products_tenant_id", "products", ["tenant_id"])
    op.create_index("ix_products_category_id", "products", ["category_id"])

    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("loyalty_points", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customers_id", "customers", ["id"])
    op.create_index("ix_customers_tenant_id", "customers", ["tenant_id"])

    op.create_table(
        "distributors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_distributors_id", "distributors", ["id"])
    op.create_index("ix_distributors_tenant_id", "distributors", ["tenant_id"])

    op.create_table(
        "loyalty_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("rule_type", sa.String(length=50), nullable=False),
        sa.Column("config_json", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_loyalty_rules_id", "loyalty_rules", ["id"])
    op.create_index("ix_loyalty_rules_tenant_id", "loyalty_rules", ["tenant_id"])

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("service_name", sa.String(length=180), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_id", "appointments", ["id"])
    op.create_index("ix_appointments_tenant_id", "appointments", ["tenant_id"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("recipient", sa.String(length=180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_id", "notifications", ["id"])
    op.create_index("ix_notifications_tenant_id", "notifications", ["tenant_id"])

    op.create_table(
        "commission_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("low_rate", sa.Numeric(6, 4), nullable=False),
        sa.Column("high_rate", sa.Numeric(6, 4), nullable=False),
        sa.Column("threshold_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_commission_rules_id", "commission_rules", ["id"])
    op.create_index("ix_commission_rules_tenant_id", "commission_rules", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_commission_rules_tenant_id", table_name="commission_rules")
    op.drop_index("ix_commission_rules_id", table_name="commission_rules")
    op.drop_table("commission_rules")
    op.drop_index("ix_notifications_tenant_id", table_name="notifications")
    op.drop_index("ix_notifications_id", table_name="notifications")
    op.drop_table("notifications")
    op.drop_index("ix_appointments_tenant_id", table_name="appointments")
    op.drop_index("ix_appointments_id", table_name="appointments")
    op.drop_table("appointments")
    op.drop_index("ix_loyalty_rules_tenant_id", table_name="loyalty_rules")
    op.drop_index("ix_loyalty_rules_id", table_name="loyalty_rules")
    op.drop_table("loyalty_rules")
    op.drop_index("ix_distributors_tenant_id", table_name="distributors")
    op.drop_index("ix_distributors_id", table_name="distributors")
    op.drop_table("distributors")
    op.drop_index("ix_customers_tenant_id", table_name="customers")
    op.drop_index("ix_customers_id", table_name="customers")
    op.drop_table("customers")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_index("ix_products_tenant_id", table_name="products")
    op.drop_index("ix_products_id", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_categories_tenant_id", table_name="categories")
    op.drop_index("ix_categories_id", table_name="categories")
    op.drop_table("categories")
    op.drop_index("ix_stripe_configs_tenant_id", table_name="stripe_configs")
    op.drop_index("ix_stripe_configs_id", table_name="stripe_configs")
    op.drop_table("stripe_configs")
    op.drop_index("ix_subscriptions_tenant_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_id", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_index("ix_tenant_branding_tenant_id", table_name="tenant_branding")
    op.drop_index("ix_tenant_branding_id", table_name="tenant_branding")
    op.drop_table("tenant_branding")
    op.drop_index("ix_plans_id", table_name="plans")
    op.drop_table("plans")
    op.drop_index("ix_tenants_id", table_name="tenants")
    op.drop_table("tenants")
