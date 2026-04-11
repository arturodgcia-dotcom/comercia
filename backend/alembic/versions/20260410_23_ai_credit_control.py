"""ai credit control tables

Revision ID: 20260410_23
Revises: 20260409_22
Create Date: 2026-04-10 16:20:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision = "20260410_23"
down_revision = "20260409_22"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    bind = op.get_bind()

    if not _table_exists(bind, "ai_brand_credit_allocations"):
        op.create_table(
            "ai_brand_credit_allocations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("commercial_client_account_id", sa.Integer(), nullable=False),
            sa.Column("tenant_id", sa.Integer(), nullable=False),
            sa.Column("assigned_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("reserved_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("manual_assignment", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("override_active", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("override_reason", sa.Text(), nullable=True),
            sa.Column("override_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["commercial_client_account_id"], ["commercial_client_accounts.id"]),
            sa.ForeignKeyConstraint(["override_by_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("commercial_client_account_id", "tenant_id", name="uq_ai_brand_credit_allocation_account_tenant"),
        )
        op.create_index(op.f("ix_ai_brand_credit_allocations_id"), "ai_brand_credit_allocations", ["id"], unique=False)
        op.create_index(
            op.f("ix_ai_brand_credit_allocations_commercial_client_account_id"),
            "ai_brand_credit_allocations",
            ["commercial_client_account_id"],
            unique=False,
        )
        op.create_index(op.f("ix_ai_brand_credit_allocations_tenant_id"), "ai_brand_credit_allocations", ["tenant_id"], unique=False)
        op.create_index(
            op.f("ix_ai_brand_credit_allocations_override_by_user_id"),
            "ai_brand_credit_allocations",
            ["override_by_user_id"],
            unique=False,
        )

    if not _table_exists(bind, "ai_credit_movements"):
        op.create_table(
            "ai_credit_movements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tenant_id", sa.Integer(), nullable=False),
            sa.Column("commercial_client_account_id", sa.Integer(), nullable=True),
            sa.Column("source", sa.String(length=40), nullable=False, server_default="otras_acciones_ia"),
            sa.Column("action", sa.String(length=30), nullable=False, server_default="consume"),
            sa.Column("tokens_delta", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("balance_after", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["commercial_client_account_id"], ["commercial_client_accounts.id"]),
            sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_ai_credit_movements_id"), "ai_credit_movements", ["id"], unique=False)
        op.create_index(op.f("ix_ai_credit_movements_tenant_id"), "ai_credit_movements", ["tenant_id"], unique=False)
        op.create_index(
            op.f("ix_ai_credit_movements_commercial_client_account_id"),
            "ai_credit_movements",
            ["commercial_client_account_id"],
            unique=False,
        )
        op.create_index(op.f("ix_ai_credit_movements_source"), "ai_credit_movements", ["source"], unique=False)
        op.create_index(op.f("ix_ai_credit_movements_action"), "ai_credit_movements", ["action"], unique=False)
        op.create_index(
            op.f("ix_ai_credit_movements_created_by_user_id"),
            "ai_credit_movements",
            ["created_by_user_id"],
            unique=False,
        )
        op.create_index(op.f("ix_ai_credit_movements_created_at"), "ai_credit_movements", ["created_at"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if _table_exists(bind, "ai_credit_movements"):
        op.drop_index(op.f("ix_ai_credit_movements_created_at"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_created_by_user_id"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_action"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_source"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_commercial_client_account_id"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_tenant_id"), table_name="ai_credit_movements")
        op.drop_index(op.f("ix_ai_credit_movements_id"), table_name="ai_credit_movements")
        op.drop_table("ai_credit_movements")

    if _table_exists(bind, "ai_brand_credit_allocations"):
        op.drop_index(op.f("ix_ai_brand_credit_allocations_override_by_user_id"), table_name="ai_brand_credit_allocations")
        op.drop_index(op.f("ix_ai_brand_credit_allocations_tenant_id"), table_name="ai_brand_credit_allocations")
        op.drop_index(
            op.f("ix_ai_brand_credit_allocations_commercial_client_account_id"),
            table_name="ai_brand_credit_allocations",
        )
        op.drop_index(op.f("ix_ai_brand_credit_allocations_id"), table_name="ai_brand_credit_allocations")
        op.drop_table("ai_brand_credit_allocations")
