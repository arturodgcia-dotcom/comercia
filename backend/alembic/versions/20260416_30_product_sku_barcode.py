"""add sku and barcode fields to products

Revision ID: 20260416_30
Revises: 20260416_29
Create Date: 2026-04-16 12:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260416_30"
down_revision = "20260416_29"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("sku", sa.String(length=120), nullable=True))
    op.add_column("products", sa.Column("barcode", sa.String(length=120), nullable=True))
    op.add_column("products", sa.Column("barcode_type", sa.String(length=20), nullable=False, server_default="code128"))
    op.add_column("products", sa.Column("external_barcode", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("products", sa.Column("auto_generated", sa.Boolean(), nullable=False, server_default=sa.true()))

    op.execute("UPDATE products SET sku = UPPER(slug) WHERE sku IS NULL OR TRIM(sku) = ''")
    op.execute("UPDATE products SET barcode = UPPER(slug) || '-C128' WHERE barcode IS NULL OR TRIM(barcode) = ''")

    op.alter_column("products", "sku", existing_type=sa.String(length=120), nullable=False)
    op.alter_column("products", "barcode", existing_type=sa.String(length=120), nullable=False)

    op.create_index(op.f("ix_products_sku"), "products", ["sku"], unique=False)
    op.create_index(op.f("ix_products_barcode"), "products", ["barcode"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_barcode"), table_name="products")
    op.drop_index(op.f("ix_products_sku"), table_name="products")
    op.drop_column("products", "auto_generated")
    op.drop_column("products", "external_barcode")
    op.drop_column("products", "barcode_type")
    op.drop_column("products", "barcode")
    op.drop_column("products", "sku")
