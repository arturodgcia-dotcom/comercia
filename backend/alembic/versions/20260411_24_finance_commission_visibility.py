"""finance commission visibility and settlements

Revision ID: 20260411_24
Revises: 20260410_23
Create Date: 2026-04-11 10:45:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260411_24"
down_revision = "20260410_23"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _column_exists(bind, table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    columns = inspector.get_columns(table_name)
    return any(col["name"] == column_name for col in columns)


def _index_exists(bind, table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    indexes = inspector.get_indexes(table_name)
    return any(idx["name"] == index_name for idx in indexes)


def upgrade() -> None:
    bind = op.get_bind()

    if _table_exists(bind, "sales_commission_agents"):
        if not _column_exists(bind, "sales_commission_agents", "agent_type"):
            op.add_column(
                "sales_commission_agents",
                sa.Column("agent_type", sa.String(length=20), nullable=False, server_default="externo"),
            )
        if not _column_exists(bind, "sales_commission_agents", "commercial_client_account_id"):
            op.add_column(
                "sales_commission_agents",
                sa.Column("commercial_client_account_id", sa.Integer(), nullable=True),
            )
        if not _column_exists(bind, "sales_commission_agents", "tenant_id"):
            op.add_column("sales_commission_agents", sa.Column("tenant_id", sa.Integer(), nullable=True))

        if not _index_exists(bind, "sales_commission_agents", "ix_sales_commission_agents_commercial_client_account_id"):
            op.create_index(
                "ix_sales_commission_agents_commercial_client_account_id",
                "sales_commission_agents",
                ["commercial_client_account_id"],
                unique=False,
            )
        if not _index_exists(bind, "sales_commission_agents", "ix_sales_commission_agents_tenant_id"):
            op.create_index("ix_sales_commission_agents_tenant_id", "sales_commission_agents", ["tenant_id"], unique=False)

        with op.batch_alter_table("sales_commission_agents") as batch_op:
            batch_op.create_foreign_key(
                "fk_sales_commission_agents_commercial_client_account_id",
                "commercial_client_accounts",
                ["commercial_client_account_id"],
                ["id"],
            )
            batch_op.create_foreign_key(
                "fk_sales_commission_agents_tenant_id",
                "tenants",
                ["tenant_id"],
                ["id"],
            )

    if not _table_exists(bind, "commission_agent_settlements"):
        op.create_table(
            "commission_agent_settlements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("commission_agent_id", sa.Integer(), nullable=False),
            sa.Column("commercial_client_account_id", sa.Integer(), nullable=True),
            sa.Column("tenant_id", sa.Integer(), nullable=True),
            sa.Column("period_from", sa.DateTime(), nullable=True),
            sa.Column("period_to", sa.DateTime(), nullable=True),
            sa.Column("amount_paid", sa.Numeric(12, 2), nullable=False, server_default="0"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("paid_at", sa.DateTime(), nullable=True),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["commission_agent_id"], ["sales_commission_agents.id"]),
            sa.ForeignKeyConstraint(["commercial_client_account_id"], ["commercial_client_accounts.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_commission_agent_settlements_id"), "commission_agent_settlements", ["id"], unique=False)
        op.create_index(
            op.f("ix_commission_agent_settlements_commission_agent_id"),
            "commission_agent_settlements",
            ["commission_agent_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_commission_agent_settlements_commercial_client_account_id"),
            "commission_agent_settlements",
            ["commercial_client_account_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_commission_agent_settlements_tenant_id"),
            "commission_agent_settlements",
            ["tenant_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_commission_agent_settlements_created_by_user_id"),
            "commission_agent_settlements",
            ["created_by_user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_commission_agent_settlements_paid_at"),
            "commission_agent_settlements",
            ["paid_at"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()

    if _table_exists(bind, "commission_agent_settlements"):
        op.drop_index(op.f("ix_commission_agent_settlements_paid_at"), table_name="commission_agent_settlements")
        op.drop_index(op.f("ix_commission_agent_settlements_created_by_user_id"), table_name="commission_agent_settlements")
        op.drop_index(op.f("ix_commission_agent_settlements_tenant_id"), table_name="commission_agent_settlements")
        op.drop_index(
            op.f("ix_commission_agent_settlements_commercial_client_account_id"),
            table_name="commission_agent_settlements",
        )
        op.drop_index(op.f("ix_commission_agent_settlements_commission_agent_id"), table_name="commission_agent_settlements")
        op.drop_index(op.f("ix_commission_agent_settlements_id"), table_name="commission_agent_settlements")
        op.drop_table("commission_agent_settlements")

    if _table_exists(bind, "sales_commission_agents"):
        with op.batch_alter_table("sales_commission_agents") as batch_op:
            batch_op.drop_constraint("fk_sales_commission_agents_tenant_id", type_="foreignkey")
            batch_op.drop_constraint("fk_sales_commission_agents_commercial_client_account_id", type_="foreignkey")

        if _index_exists(bind, "sales_commission_agents", "ix_sales_commission_agents_tenant_id"):
            op.drop_index("ix_sales_commission_agents_tenant_id", table_name="sales_commission_agents")
        if _index_exists(bind, "sales_commission_agents", "ix_sales_commission_agents_commercial_client_account_id"):
            op.drop_index("ix_sales_commission_agents_commercial_client_account_id", table_name="sales_commission_agents")
        if _column_exists(bind, "sales_commission_agents", "tenant_id"):
            op.drop_column("sales_commission_agents", "tenant_id")
        if _column_exists(bind, "sales_commission_agents", "commercial_client_account_id"):
            op.drop_column("sales_commission_agents", "commercial_client_account_id")
        if _column_exists(bind, "sales_commission_agents", "agent_type"):
            op.drop_column("sales_commission_agents", "agent_type")
