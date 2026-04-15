"""nervia activation switch and customer identifier

Revision ID: 20260414_27
Revises: 20260414_26
Create Date: 2026-04-14 19:40:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_27"
down_revision = "20260414_26"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _column_exists(bind, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def _index_exists(bind, table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(idx["name"] == index_name for idx in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "tenants"):
        return

    if not _column_exists(bind, "tenants", "nervia_sync_enabled"):
        op.add_column(
            "tenants",
            sa.Column("nervia_sync_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if not _column_exists(bind, "tenants", "nervia_customer_identifier"):
        op.add_column("tenants", sa.Column("nervia_customer_identifier", sa.String(length=120), nullable=True))
    if not _column_exists(bind, "tenants", "nervia_marketing_contract_active"):
        op.add_column(
            "tenants",
            sa.Column("nervia_marketing_contract_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if not _index_exists(bind, "tenants", "ix_tenants_nervia_customer_identifier"):
        op.create_index(
            "ix_tenants_nervia_customer_identifier",
            "tenants",
            ["nervia_customer_identifier"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "tenants"):
        return

    if _index_exists(bind, "tenants", "ix_tenants_nervia_customer_identifier"):
        op.drop_index("ix_tenants_nervia_customer_identifier", table_name="tenants")
    if _column_exists(bind, "tenants", "nervia_marketing_contract_active"):
        op.drop_column("tenants", "nervia_marketing_contract_active")
    if _column_exists(bind, "tenants", "nervia_customer_identifier"):
        op.drop_column("tenants", "nervia_customer_identifier")
    if _column_exists(bind, "tenants", "nervia_sync_enabled"):
        op.drop_column("tenants", "nervia_sync_enabled")
