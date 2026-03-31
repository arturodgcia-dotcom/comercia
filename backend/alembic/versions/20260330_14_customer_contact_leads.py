"""add customer contact leads

Revision ID: 20260330_14
Revises: 20260330_13
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa


revision = "20260330_14"
down_revision = "20260330_13"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customer_contact_leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("company", sa.String(length=180), nullable=True),
        sa.Column("contact_reason", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("recommended_plan", sa.String(length=40), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customer_contact_leads_id", "customer_contact_leads", ["id"])
    op.create_index("ix_customer_contact_leads_email", "customer_contact_leads", ["email"])
    op.create_index("ix_customer_contact_leads_contact_reason", "customer_contact_leads", ["contact_reason"])
    op.create_index("ix_customer_contact_leads_channel", "customer_contact_leads", ["channel"])
    op.create_index("ix_customer_contact_leads_status", "customer_contact_leads", ["status"])


def downgrade() -> None:
    op.drop_index("ix_customer_contact_leads_status", table_name="customer_contact_leads")
    op.drop_index("ix_customer_contact_leads_channel", table_name="customer_contact_leads")
    op.drop_index("ix_customer_contact_leads_contact_reason", table_name="customer_contact_leads")
    op.drop_index("ix_customer_contact_leads_email", table_name="customer_contact_leads")
    op.drop_index("ix_customer_contact_leads_id", table_name="customer_contact_leads")
    op.drop_table("customer_contact_leads")
