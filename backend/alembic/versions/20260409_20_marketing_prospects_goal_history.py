"""add main goal and status history to marketing prospects

Revision ID: 20260409_20
Revises: 20260409_19
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260409_20"
down_revision = "20260409_19"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "marketing_prospects",
        sa.Column("main_goal", sa.String(length=40), nullable=False, server_default="ventas"),
    )
    op.add_column(
        "marketing_prospects",
        sa.Column("status_history_json", sa.Text(), nullable=False, server_default="[]"),
    )
    op.create_index(op.f("ix_marketing_prospects_main_goal"), "marketing_prospects", ["main_goal"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketing_prospects_main_goal"), table_name="marketing_prospects")
    op.drop_column("marketing_prospects", "status_history_json")
    op.drop_column("marketing_prospects", "main_goal")
