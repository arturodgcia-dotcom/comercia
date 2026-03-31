"""add stripe sync fields to products

Revision ID: 20260330_13
Revises: 20260330_12
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


revision = "20260330_13"
down_revision = "20260330_12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("stripe_product_id", sa.String(length=120), nullable=True))
    op.add_column("products", sa.Column("stripe_price_id_public", sa.String(length=120), nullable=True))
    op.add_column("products", sa.Column("stripe_price_id_retail", sa.String(length=120), nullable=True))
    op.add_column("products", sa.Column("stripe_price_id_wholesale", sa.String(length=120), nullable=True))
    op.create_index("ix_products_stripe_product_id", "products", ["stripe_product_id"])
    op.create_index("ix_products_stripe_price_id_public", "products", ["stripe_price_id_public"])


def downgrade() -> None:
    op.drop_index("ix_products_stripe_price_id_public", table_name="products")
    op.drop_index("ix_products_stripe_product_id", table_name="products")
    op.drop_column("products", "stripe_price_id_wholesale")
    op.drop_column("products", "stripe_price_id_retail")
    op.drop_column("products", "stripe_price_id_public")
    op.drop_column("products", "stripe_product_id")

