"""add ai orchestrator central execution model and tenant entitlements

Revision ID: 20260416_29
Revises: 20260415_28
Create Date: 2026-04-16 10:20:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision = "20260416_29"
down_revision = "20260415_28"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("available_ai_capabilities_json", sa.Text(), nullable=False, server_default="[]"))
    op.add_column("tenants", sa.Column("active_ai_capabilities_json", sa.Text(), nullable=False, server_default="[]"))
    op.add_column("tenants", sa.Column("ai_autonomy_level", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_token_budget_monthly", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_token_budget_remaining", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_token_budget_reserved", sa.Integer(), nullable=False, server_default="0"))

    op.create_table(
        "ai_orchestrator_executions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("brand_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("event_channel", sa.String(length=40), nullable=True),
        sa.Column("triggered_agent", sa.String(length=80), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("executed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("skipped", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("skip_reason", sa.Text(), nullable=True),
        sa.Column("execution_priority", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("execution_cost_estimate", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_saved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_estimate_mxn", sa.Numeric(12, 4), nullable=False, server_default="0"),
        sa.Column("outcome_summary", sa.Text(), nullable=True),
        sa.Column("context_json", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["brand_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_orchestrator_executions_id"), "ai_orchestrator_executions", ["id"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_tenant_id"), "ai_orchestrator_executions", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_brand_id"), "ai_orchestrator_executions", ["brand_id"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_event_type"), "ai_orchestrator_executions", ["event_type"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_event_channel"), "ai_orchestrator_executions", ["event_channel"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_triggered_agent"), "ai_orchestrator_executions", ["triggered_agent"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_started_at"), "ai_orchestrator_executions", ["started_at"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_execution_priority"), "ai_orchestrator_executions", ["execution_priority"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_executed"), "ai_orchestrator_executions", ["executed"], unique=False)
    op.create_index(op.f("ix_ai_orchestrator_executions_skipped"), "ai_orchestrator_executions", ["skipped"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_orchestrator_executions_skipped"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_executed"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_execution_priority"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_started_at"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_triggered_agent"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_event_channel"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_event_type"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_brand_id"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_tenant_id"), table_name="ai_orchestrator_executions")
    op.drop_index(op.f("ix_ai_orchestrator_executions_id"), table_name="ai_orchestrator_executions")
    op.drop_table("ai_orchestrator_executions")

    op.drop_column("tenants", "ai_token_budget_reserved")
    op.drop_column("tenants", "ai_token_budget_remaining")
    op.drop_column("tenants", "ai_token_budget_monthly")
    op.drop_column("tenants", "ai_autonomy_level")
    op.drop_column("tenants", "active_ai_capabilities_json")
    op.drop_column("tenants", "available_ai_capabilities_json")
