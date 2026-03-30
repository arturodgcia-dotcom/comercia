"""add moderation_status to product reviews

Revision ID: 20260330_11
Revises: 20260330_10
Create Date: 2026-03-30 18:10:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260330_11"
down_revision: str | None = "20260330_10"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product_reviews",
        sa.Column("moderation_status", sa.String(length=20), nullable=False, server_default="pending"),
    )
    op.create_index(
        op.f("ix_product_reviews_moderation_status"), "product_reviews", ["moderation_status"], unique=False
    )
    op.execute("UPDATE product_reviews SET moderation_status = 'approved' WHERE is_approved = 1")
    op.execute("UPDATE product_reviews SET moderation_status = 'pending' WHERE moderation_status IS NULL")


def downgrade() -> None:
    op.drop_index(op.f("ix_product_reviews_moderation_status"), table_name="product_reviews")
    op.drop_column("product_reviews", "moderation_status")
