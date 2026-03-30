"""add mercadopago settings and pos payment transactions

Revision ID: 20260330_10
Revises: 20260329_09
Create Date: 2026-03-30 10:30:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260330_10"
down_revision: str | None = "20260329_09"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("pos_sales") as batch_op:
        batch_op.alter_column("payment_method", existing_type=sa.String(length=20), type_=sa.String(length=40))

    op.create_table(
        "mercadopago_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("mercadopago_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("mercadopago_public_key", sa.String(length=255), nullable=True),
        sa.Column("mercadopago_access_token", sa.String(length=255), nullable=True),
        sa.Column("mercadopago_qr_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("mercadopago_payment_link_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("mercadopago_point_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("mercadopago_active_for_pos_only", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index(op.f("ix_mercadopago_settings_id"), "mercadopago_settings", ["id"], unique=False)
    op.create_index(op.f("ix_mercadopago_settings_tenant_id"), "mercadopago_settings", ["tenant_id"], unique=False)

    op.create_table(
        "pos_payment_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("pos_sale_id", sa.Integer(), nullable=True),
        sa.Column("pos_location_id", sa.Integer(), nullable=True),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("employee_id", sa.Integer(), nullable=True),
        sa.Column("payment_provider", sa.String(length=30), nullable=False),
        sa.Column("payment_method", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("external_reference", sa.String(length=120), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("payment_url", sa.String(length=500), nullable=True),
        sa.Column("qr_payload", sa.Text(), nullable=True),
        sa.Column("sale_payload_json", sa.Text(), nullable=True),
        sa.Column("provider_payload_json", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["pos_employees.id"]),
        sa.ForeignKeyConstraint(["pos_location_id"], ["pos_locations.id"]),
        sa.ForeignKeyConstraint(["pos_sale_id"], ["pos_sales.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_reference"),
    )
    op.create_index(op.f("ix_pos_payment_transactions_id"), "pos_payment_transactions", ["id"], unique=False)
    op.create_index(op.f("ix_pos_payment_transactions_tenant_id"), "pos_payment_transactions", ["tenant_id"], unique=False)
    op.create_index(
        op.f("ix_pos_payment_transactions_external_reference"),
        "pos_payment_transactions",
        ["external_reference"],
        unique=False,
    )


def downgrade() -> None:
    with op.batch_alter_table("pos_sales") as batch_op:
        batch_op.alter_column("payment_method", existing_type=sa.String(length=40), type_=sa.String(length=20))

    op.drop_index(op.f("ix_pos_payment_transactions_external_reference"), table_name="pos_payment_transactions")
    op.drop_index(op.f("ix_pos_payment_transactions_tenant_id"), table_name="pos_payment_transactions")
    op.drop_index(op.f("ix_pos_payment_transactions_id"), table_name="pos_payment_transactions")
    op.drop_table("pos_payment_transactions")

    op.drop_index(op.f("ix_mercadopago_settings_tenant_id"), table_name="mercadopago_settings")
    op.drop_index(op.f("ix_mercadopago_settings_id"), table_name="mercadopago_settings")
    op.drop_table("mercadopago_settings")
