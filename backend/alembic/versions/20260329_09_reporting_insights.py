"""Add reporting request and insights models

Revision ID: 20260329_09
Revises: 20260329_08
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260329_09"
down_revision = "20260329_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "report_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
        sa.Column("report_type", sa.String(length=80), nullable=False),
        sa.Column("date_from", sa.DateTime(), nullable=True),
        sa.Column("date_to", sa.DateTime(), nullable=True),
        sa.Column("filters_json", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("output_format", sa.String(length=20), nullable=False, server_default=sa.text("'json'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_requests_id", "report_requests", ["id"])
    op.create_index("ix_report_requests_tenant_id", "report_requests", ["tenant_id"])
    op.create_index("ix_report_requests_requested_by_user_id", "report_requests", ["requested_by_user_id"])
    op.create_index("ix_report_requests_report_type", "report_requests", ["report_type"])
    op.create_index("ix_report_requests_status", "report_requests", ["status"])

    op.create_table(
        "report_insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("report_type", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'info'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_insights_id", "report_insights", ["id"])
    op.create_index("ix_report_insights_tenant_id", "report_insights", ["tenant_id"])
    op.create_index("ix_report_insights_report_type", "report_insights", ["report_type"])
    op.create_index("ix_report_insights_severity", "report_insights", ["severity"])
    op.create_index("ix_report_insights_created_at", "report_insights", ["created_at"])

    op.create_table(
        "marketing_insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("insight_type", sa.String(length=60), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("period_label", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_marketing_insights_id", "marketing_insights", ["id"])
    op.create_index("ix_marketing_insights_tenant_id", "marketing_insights", ["tenant_id"])
    op.create_index("ix_marketing_insights_insight_type", "marketing_insights", ["insight_type"])
    op.create_index("ix_marketing_insights_product_id", "marketing_insights", ["product_id"])
    op.create_index("ix_marketing_insights_created_at", "marketing_insights", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_marketing_insights_created_at", table_name="marketing_insights")
    op.drop_index("ix_marketing_insights_product_id", table_name="marketing_insights")
    op.drop_index("ix_marketing_insights_insight_type", table_name="marketing_insights")
    op.drop_index("ix_marketing_insights_tenant_id", table_name="marketing_insights")
    op.drop_index("ix_marketing_insights_id", table_name="marketing_insights")
    op.drop_table("marketing_insights")

    op.drop_index("ix_report_insights_created_at", table_name="report_insights")
    op.drop_index("ix_report_insights_severity", table_name="report_insights")
    op.drop_index("ix_report_insights_report_type", table_name="report_insights")
    op.drop_index("ix_report_insights_tenant_id", table_name="report_insights")
    op.drop_index("ix_report_insights_id", table_name="report_insights")
    op.drop_table("report_insights")

    op.drop_index("ix_report_requests_status", table_name="report_requests")
    op.drop_index("ix_report_requests_report_type", table_name="report_requests")
    op.drop_index("ix_report_requests_requested_by_user_id", table_name="report_requests")
    op.drop_index("ix_report_requests_tenant_id", table_name="report_requests")
    op.drop_index("ix_report_requests_id", table_name="report_requests")
    op.drop_table("report_requests")

