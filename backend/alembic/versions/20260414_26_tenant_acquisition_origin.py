"""tenant acquisition origin and referral traceability

Revision ID: 20260414_26
Revises: 20260414_25
Create Date: 2026-04-14 19:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_26"
down_revision = "20260414_25"
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

    if not _column_exists(bind, "tenants", "acquisition_origin"):
        op.add_column(
            "tenants",
            sa.Column("acquisition_origin", sa.String(length=40), nullable=False, server_default="reinpia_direct"),
        )
    if not _column_exists(bind, "tenants", "acquisition_commission_agent_id"):
        op.add_column("tenants", sa.Column("acquisition_commission_agent_id", sa.Integer(), nullable=True))
    if not _column_exists(bind, "tenants", "acquisition_referral_code"):
        op.add_column("tenants", sa.Column("acquisition_referral_code", sa.String(length=80), nullable=True))
    if not _column_exists(bind, "tenants", "acquisition_notes"):
        op.add_column("tenants", sa.Column("acquisition_notes", sa.Text(), nullable=True))

    if not _index_exists(bind, "tenants", "ix_tenants_acquisition_origin"):
        op.create_index("ix_tenants_acquisition_origin", "tenants", ["acquisition_origin"], unique=False)
    if not _index_exists(bind, "tenants", "ix_tenants_acquisition_commission_agent_id"):
        op.create_index(
            "ix_tenants_acquisition_commission_agent_id",
            "tenants",
            ["acquisition_commission_agent_id"],
            unique=False,
        )
    if not _index_exists(bind, "tenants", "ix_tenants_acquisition_referral_code"):
        op.create_index("ix_tenants_acquisition_referral_code", "tenants", ["acquisition_referral_code"], unique=False)

    with op.batch_alter_table("tenants") as batch_op:
        try:
            batch_op.create_foreign_key(
                "fk_tenants_acquisition_commission_agent_id",
                "sales_commission_agents",
                ["acquisition_commission_agent_id"],
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
            batch_op.drop_constraint("fk_tenants_acquisition_commission_agent_id", type_="foreignkey")
        except Exception:
            pass

    if _index_exists(bind, "tenants", "ix_tenants_acquisition_referral_code"):
        op.drop_index("ix_tenants_acquisition_referral_code", table_name="tenants")
    if _index_exists(bind, "tenants", "ix_tenants_acquisition_commission_agent_id"):
        op.drop_index("ix_tenants_acquisition_commission_agent_id", table_name="tenants")
    if _index_exists(bind, "tenants", "ix_tenants_acquisition_origin"):
        op.drop_index("ix_tenants_acquisition_origin", table_name="tenants")

    if _column_exists(bind, "tenants", "acquisition_notes"):
        op.drop_column("tenants", "acquisition_notes")
    if _column_exists(bind, "tenants", "acquisition_referral_code"):
        op.drop_column("tenants", "acquisition_referral_code")
    if _column_exists(bind, "tenants", "acquisition_commission_agent_id"):
        op.drop_column("tenants", "acquisition_commission_agent_id")
    if _column_exists(bind, "tenants", "acquisition_origin"):
        op.drop_column("tenants", "acquisition_origin")
