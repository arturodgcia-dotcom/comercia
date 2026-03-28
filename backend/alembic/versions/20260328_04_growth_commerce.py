"""Add growth commerce domain

Revision ID: 20260328_04
Revises: 20260328_03
Create Date: 2026-03-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260328_04"
down_revision = "20260328_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("subtotal_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")))
    op.add_column("orders", sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")))
    op.add_column("orders", sa.Column("coupon_code", sa.String(length=80), nullable=True))
    op.add_column("orders", sa.Column("loyalty_points_used", sa.Integer(), nullable=False, server_default=sa.text("0")))

    op.add_column("banners", sa.Column("target_type", sa.String(length=30), nullable=False, server_default=sa.text("'promotion'")))
    op.add_column("banners", sa.Column("target_value", sa.String(length=255), nullable=True))
    op.add_column("banners", sa.Column("priority", sa.Integer(), nullable=False, server_default=sa.text("1")))
    op.add_column("banners", sa.Column("starts_at", sa.DateTime(), nullable=True))
    op.add_column("banners", sa.Column("ends_at", sa.DateTime(), nullable=True))

    op.add_column("loyalty_rules", sa.Column("loyalty_program_id", sa.Integer(), nullable=True))
    op.add_column("loyalty_rules", sa.Column("min_points", sa.Integer(), nullable=True))
    op.add_column("loyalty_rules", sa.Column("discount_type", sa.String(length=20), nullable=True))
    op.add_column("loyalty_rules", sa.Column("discount_value", sa.Numeric(12, 2), nullable=True))
    op.add_column("loyalty_rules", sa.Column("applies_to", sa.String(length=20), nullable=False, server_default=sa.text("'all'")))
    op.create_index("ix_loyalty_rules_loyalty_program_id", "loyalty_rules", ["loyalty_program_id"])

    op.create_table(
        "loyalty_programs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("points_enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("points_conversion_rate", sa.Numeric(12, 4), nullable=False, server_default=sa.text("1")),
        sa.Column("welcome_points", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("birthday_points", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index("ix_loyalty_programs_id", "loyalty_programs", ["id"])
    op.create_index("ix_loyalty_programs_tenant_id", "loyalty_programs", ["tenant_id"])
    op.create_foreign_key(
        "fk_loyalty_rules_loyalty_program_id", "loyalty_rules", "loyalty_programs", ["loyalty_program_id"], ["id"]
    )

    op.create_table(
        "membership_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("points_multiplier", sa.Numeric(8, 2), nullable=False, server_default=sa.text("1")),
        sa.Column("benefits_json", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_membership_plans_id", "membership_plans", ["id"])
    op.create_index("ix_membership_plans_tenant_id", "membership_plans", ["tenant_id"])

    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("discount_type", sa.String(length=20), nullable=False),
        sa.Column("discount_value", sa.Numeric(12, 2), nullable=False),
        sa.Column("min_order_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("starts_at", sa.DateTime(), nullable=True),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("applies_to", sa.String(length=20), nullable=False, server_default=sa.text("'all'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_coupons_id", "coupons", ["id"])
    op.create_index("ix_coupons_tenant_id", "coupons", ["tenant_id"])
    op.create_index("ix_coupons_code", "coupons", ["code"])

    op.create_table(
        "customer_loyalty_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("loyalty_program_id", sa.Integer(), nullable=False),
        sa.Column("points_balance", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("membership_plan_id", sa.Integer(), nullable=True),
        sa.Column("membership_expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["loyalty_program_id"], ["loyalty_programs.id"]),
        sa.ForeignKeyConstraint(["membership_plan_id"], ["membership_plans.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customer_loyalty_accounts_id", "customer_loyalty_accounts", ["id"])
    op.create_index("ix_customer_loyalty_accounts_tenant_id", "customer_loyalty_accounts", ["tenant_id"])
    op.create_index("ix_customer_loyalty_accounts_customer_id", "customer_loyalty_accounts", ["customer_id"])
    op.create_index(
        "ix_customer_loyalty_accounts_loyalty_program_id", "customer_loyalty_accounts", ["loyalty_program_id"]
    )
    op.create_index(
        "ix_customer_loyalty_accounts_membership_plan_id", "customer_loyalty_accounts", ["membership_plan_id"]
    )

    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wishlist_items_id", "wishlist_items", ["id"])
    op.create_index("ix_wishlist_items_tenant_id", "wishlist_items", ["tenant_id"])
    op.create_index("ix_wishlist_items_customer_id", "wishlist_items", ["customer_id"])
    op.create_index("ix_wishlist_items_product_id", "wishlist_items", ["product_id"])

    op.create_table(
        "product_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_reviews_id", "product_reviews", ["id"])
    op.create_index("ix_product_reviews_tenant_id", "product_reviews", ["tenant_id"])
    op.create_index("ix_product_reviews_product_id", "product_reviews", ["product_id"])
    op.create_index("ix_product_reviews_customer_id", "product_reviews", ["customer_id"])


def downgrade() -> None:
    op.drop_index("ix_product_reviews_customer_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_product_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_tenant_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_id", table_name="product_reviews")
    op.drop_table("product_reviews")

    op.drop_index("ix_wishlist_items_product_id", table_name="wishlist_items")
    op.drop_index("ix_wishlist_items_customer_id", table_name="wishlist_items")
    op.drop_index("ix_wishlist_items_tenant_id", table_name="wishlist_items")
    op.drop_index("ix_wishlist_items_id", table_name="wishlist_items")
    op.drop_table("wishlist_items")

    op.drop_index("ix_customer_loyalty_accounts_membership_plan_id", table_name="customer_loyalty_accounts")
    op.drop_index("ix_customer_loyalty_accounts_loyalty_program_id", table_name="customer_loyalty_accounts")
    op.drop_index("ix_customer_loyalty_accounts_customer_id", table_name="customer_loyalty_accounts")
    op.drop_index("ix_customer_loyalty_accounts_tenant_id", table_name="customer_loyalty_accounts")
    op.drop_index("ix_customer_loyalty_accounts_id", table_name="customer_loyalty_accounts")
    op.drop_table("customer_loyalty_accounts")

    op.drop_index("ix_coupons_code", table_name="coupons")
    op.drop_index("ix_coupons_tenant_id", table_name="coupons")
    op.drop_index("ix_coupons_id", table_name="coupons")
    op.drop_table("coupons")

    op.drop_index("ix_membership_plans_tenant_id", table_name="membership_plans")
    op.drop_index("ix_membership_plans_id", table_name="membership_plans")
    op.drop_table("membership_plans")

    op.drop_constraint("fk_loyalty_rules_loyalty_program_id", "loyalty_rules", type_="foreignkey")
    op.drop_index("ix_loyalty_programs_tenant_id", table_name="loyalty_programs")
    op.drop_index("ix_loyalty_programs_id", table_name="loyalty_programs")
    op.drop_table("loyalty_programs")

    op.drop_index("ix_loyalty_rules_loyalty_program_id", table_name="loyalty_rules")
    op.drop_column("loyalty_rules", "applies_to")
    op.drop_column("loyalty_rules", "discount_value")
    op.drop_column("loyalty_rules", "discount_type")
    op.drop_column("loyalty_rules", "min_points")
    op.drop_column("loyalty_rules", "loyalty_program_id")

    op.drop_column("banners", "ends_at")
    op.drop_column("banners", "starts_at")
    op.drop_column("banners", "priority")
    op.drop_column("banners", "target_value")
    op.drop_column("banners", "target_type")

    op.drop_column("orders", "loyalty_points_used")
    op.drop_column("orders", "coupon_code")
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "subtotal_amount")
