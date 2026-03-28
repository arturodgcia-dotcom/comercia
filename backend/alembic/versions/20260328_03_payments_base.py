"""Add payments base models and stripe extensions

Revision ID: 20260328_03
Revises: 20260327_02
Create Date: 2026-03-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260328_03"
down_revision = "20260327_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("stripe_configs", sa.Column("stripe_account_id", sa.String(length=255), nullable=True))
    op.add_column("plans", sa.Column("commission_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("tenants", sa.Column("plan_id", sa.Integer(), nullable=True))
    op.create_index("ix_tenants_plan_id", "tenants", ["plan_id"])
    op.create_foreign_key("fk_tenants_plan_id", "tenants", "plans", ["plan_id"], ["id"])

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("commission_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("net_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default=sa.text("'mxn'")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("payment_mode", sa.String(length=20), nullable=False),
        sa.Column("stripe_session_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_id", "orders", ["id"])
    op.create_index("ix_orders_tenant_id", "orders", ["tenant_id"])
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_index("ix_orders_stripe_session_id", "orders", ["stripe_session_id"])
    op.create_index("ix_orders_stripe_payment_intent_id", "orders", ["stripe_payment_intent_id"])

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_id", "order_items", ["id"])
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"])

    op.create_table(
        "commission_details",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("rule_applied", sa.String(length=20), nullable=False),
        sa.Column("percentage", sa.Numeric(6, 4), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_commission_details_id", "commission_details", ["id"])
    op.create_index("ix_commission_details_order_id", "commission_details", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_commission_details_order_id", table_name="commission_details")
    op.drop_index("ix_commission_details_id", table_name="commission_details")
    op.drop_table("commission_details")

    op.drop_index("ix_order_items_product_id", table_name="order_items")
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_index("ix_order_items_id", table_name="order_items")
    op.drop_table("order_items")

    op.drop_index("ix_orders_stripe_payment_intent_id", table_name="orders")
    op.drop_index("ix_orders_stripe_session_id", table_name="orders")
    op.drop_index("ix_orders_customer_id", table_name="orders")
    op.drop_index("ix_orders_tenant_id", table_name="orders")
    op.drop_index("ix_orders_id", table_name="orders")
    op.drop_table("orders")

    op.drop_constraint("fk_tenants_plan_id", "tenants", type_="foreignkey")
    op.drop_index("ix_tenants_plan_id", table_name="tenants")
    op.drop_column("tenants", "plan_id")
    op.drop_column("plans", "commission_enabled")
    op.drop_column("stripe_configs", "stripe_account_id")
