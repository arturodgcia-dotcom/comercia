"""tenant isolation and comercia connector access

Revision ID: 20260414_25
Revises: 20260411_24
Create Date: 2026-04-14 18:40:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_25"
down_revision = "20260411_24"
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

    if not _column_exists(bind, "tenants", "tenant_type"):
        op.add_column(
            "tenants",
            sa.Column("tenant_type", sa.String(length=40), nullable=False, server_default="direct_client_tenant"),
        )
    if not _column_exists(bind, "tenants", "owner_scope"):
        op.add_column(
            "tenants",
            sa.Column("owner_scope", sa.String(length=40), nullable=False, server_default="reinpia_internal"),
        )
    if not _column_exists(bind, "tenants", "owner_agency_tenant_id"):
        op.add_column("tenants", sa.Column("owner_agency_tenant_id", sa.Integer(), nullable=True))
    if not _column_exists(bind, "tenants", "comercia_connection_enabled"):
        op.add_column(
            "tenants",
            sa.Column("comercia_connection_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    if not _column_exists(bind, "tenants", "comercia_connection_source"):
        op.add_column("tenants", sa.Column("comercia_connection_source", sa.String(length=40), nullable=True))

    if not _index_exists(bind, "tenants", "ix_tenants_tenant_type"):
        op.create_index("ix_tenants_tenant_type", "tenants", ["tenant_type"], unique=False)
    if not _index_exists(bind, "tenants", "ix_tenants_owner_scope"):
        op.create_index("ix_tenants_owner_scope", "tenants", ["owner_scope"], unique=False)
    if not _index_exists(bind, "tenants", "ix_tenants_owner_agency_tenant_id"):
        op.create_index("ix_tenants_owner_agency_tenant_id", "tenants", ["owner_agency_tenant_id"], unique=False)

    with op.batch_alter_table("tenants") as batch_op:
        try:
            batch_op.create_foreign_key(
                "fk_tenants_owner_agency_tenant_id",
                "tenants",
                ["owner_agency_tenant_id"],
                ["id"],
            )
        except Exception:
            pass


def downgrade() -> None:
    bind = op.get_bind()
    if not _table_exists(bind, "tenants"):
        return

    with op.batch_alter_table("tenants") as batch_op:
        try:
            batch_op.drop_constraint("fk_tenants_owner_agency_tenant_id", type_="foreignkey")
        except Exception:
            pass

    if _index_exists(bind, "tenants", "ix_tenants_owner_agency_tenant_id"):
        op.drop_index("ix_tenants_owner_agency_tenant_id", table_name="tenants")
    if _index_exists(bind, "tenants", "ix_tenants_owner_scope"):
        op.drop_index("ix_tenants_owner_scope", table_name="tenants")
    if _index_exists(bind, "tenants", "ix_tenants_tenant_type"):
        op.drop_index("ix_tenants_tenant_type", table_name="tenants")

    if _column_exists(bind, "tenants", "comercia_connection_source"):
        op.drop_column("tenants", "comercia_connection_source")
    if _column_exists(bind, "tenants", "comercia_connection_enabled"):
        op.drop_column("tenants", "comercia_connection_enabled")
    if _column_exists(bind, "tenants", "owner_agency_tenant_id"):
        op.drop_column("tenants", "owner_agency_tenant_id")
    if _column_exists(bind, "tenants", "owner_scope"):
        op.drop_column("tenants", "owner_scope")
    if _column_exists(bind, "tenants", "tenant_type"):
        op.drop_column("tenants", "tenant_type")
