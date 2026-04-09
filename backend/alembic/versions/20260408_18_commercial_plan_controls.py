"""commercial plan controls and ai token governance

Revision ID: 20260408_18
Revises: 20260408_17
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260408_18"
down_revision = "20260408_17"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("commercial_plan_key", sa.String(length=60), nullable=True))
    op.add_column("tenants", sa.Column("commercial_plan_status", sa.String(length=30), nullable=False, server_default="not_purchased"))
    op.add_column("tenants", sa.Column("commercial_plan_source", sa.String(length=40), nullable=True))
    op.add_column("tenants", sa.Column("commercial_checkout_session_id", sa.String(length=255), nullable=True))
    op.add_column("tenants", sa.Column("commercial_limits_json", sa.Text(), nullable=True))
    op.add_column("tenants", sa.Column("ai_tokens_included", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_tokens_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_tokens_used", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tenants", sa.Column("ai_tokens_locked", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("tenants", sa.Column("ai_tokens_lock_reason", sa.Text(), nullable=True))
    op.add_column("tenants", sa.Column("ai_tokens_last_reset_at", sa.DateTime(), nullable=True))
    op.create_index(op.f("ix_tenants_commercial_plan_key"), "tenants", ["commercial_plan_key"], unique=False)
    op.create_index(op.f("ix_tenants_commercial_plan_status"), "tenants", ["commercial_plan_status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tenants_commercial_plan_status"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_commercial_plan_key"), table_name="tenants")
    op.drop_column("tenants", "ai_tokens_last_reset_at")
    op.drop_column("tenants", "ai_tokens_lock_reason")
    op.drop_column("tenants", "ai_tokens_locked")
    op.drop_column("tenants", "ai_tokens_used")
    op.drop_column("tenants", "ai_tokens_balance")
    op.drop_column("tenants", "ai_tokens_included")
    op.drop_column("tenants", "commercial_limits_json")
    op.drop_column("tenants", "commercial_checkout_session_id")
    op.drop_column("tenants", "commercial_plan_source")
    op.drop_column("tenants", "commercial_plan_status")
    op.drop_column("tenants", "commercial_plan_key")
