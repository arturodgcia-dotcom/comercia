"""billing model per tenant

Revision ID: 20260408_17
Revises: 20260402_16
Create Date: 2026-04-08 12:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260408_17"
down_revision = "20260402_16"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("billing_model", sa.String(length=30), nullable=True))
    op.add_column("tenants", sa.Column("commission_percentage", sa.Numeric(6, 2), nullable=True))
    op.add_column("tenants", sa.Column("commission_enabled", sa.Boolean(), nullable=True))
    op.add_column("tenants", sa.Column("commission_scope", sa.String(length=60), nullable=True))
    op.add_column("tenants", sa.Column("commission_notes", sa.Text(), nullable=True))

    op.execute("UPDATE tenants SET billing_model = 'fixed_subscription' WHERE billing_model IS NULL")
    op.execute("UPDATE tenants SET commission_percentage = 0 WHERE commission_percentage IS NULL")
    op.execute("UPDATE tenants SET commission_enabled = 0 WHERE commission_enabled IS NULL")
    op.execute("UPDATE tenants SET commission_scope = 'ventas_online_pagadas' WHERE commission_scope IS NULL")

    op.alter_column("tenants", "billing_model", existing_type=sa.String(length=30), nullable=False)
    op.alter_column("tenants", "commission_percentage", existing_type=sa.Numeric(6, 2), nullable=False)
    op.alter_column("tenants", "commission_enabled", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("tenants", "commission_scope", existing_type=sa.String(length=60), nullable=False)


def downgrade() -> None:
    op.drop_column("tenants", "commission_notes")
    op.drop_column("tenants", "commission_scope")
    op.drop_column("tenants", "commission_enabled")
    op.drop_column("tenants", "commission_percentage")
    op.drop_column("tenants", "billing_model")

