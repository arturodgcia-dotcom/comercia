"""add logistics additional services table

Revision ID: 20260330_12
Revises: 20260330_11
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


revision = "20260330_12"
down_revision = "20260330_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "logistics_additional_services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("service_type", sa.String(length=30), nullable=False),
        sa.Column("origin", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("kilometers", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("iva", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default="MXN"),
        sa.Column("observations", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="pendiente"),
        sa.Column("service_date", sa.DateTime(), nullable=False),
        sa.Column("billing_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_logistics_additional_services_tenant_id", "logistics_additional_services", ["tenant_id"])
    op.create_index("ix_logistics_additional_services_status", "logistics_additional_services", ["status"])
    op.create_index("ix_logistics_additional_services_service_type", "logistics_additional_services", ["service_type"])
    op.create_index("ix_logistics_additional_services_service_date", "logistics_additional_services", ["service_date"])


def downgrade() -> None:
    op.drop_index("ix_logistics_additional_services_service_date", table_name="logistics_additional_services")
    op.drop_index("ix_logistics_additional_services_service_type", table_name="logistics_additional_services")
    op.drop_index("ix_logistics_additional_services_status", table_name="logistics_additional_services")
    op.drop_index("ix_logistics_additional_services_tenant_id", table_name="logistics_additional_services")
    op.drop_table("logistics_additional_services")
