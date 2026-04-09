"""marketing prospects with internal prequote workflow

Revision ID: 20260409_19
Revises: 20260408_18
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260409_19"
down_revision = "20260408_18"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "marketing_prospects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("contact_name", sa.String(length=180), nullable=False),
        sa.Column("contact_email", sa.String(length=180), nullable=False),
        sa.Column("contact_phone", sa.String(length=40), nullable=True),
        sa.Column("company_brand", sa.String(length=180), nullable=False),
        sa.Column("location", sa.String(length=180), nullable=True),
        sa.Column("industry", sa.String(length=120), nullable=True),
        sa.Column("sells", sa.String(length=30), nullable=False, server_default="productos"),
        sa.Column("desired_conversion_channel", sa.String(length=50), nullable=False, server_default="ecommerce"),
        sa.Column("active_social_networks", sa.String(length=255), nullable=True),
        sa.Column("products_to_promote", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("average_ticket_mxn", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("offer_clarity", sa.String(length=30), nullable=True),
        sa.Column("urgency", sa.String(length=30), nullable=False, server_default="media"),
        sa.Column("followup_level", sa.String(length=30), nullable=False, server_default="medio"),
        sa.Column("has_landing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("has_ecommerce", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("needs_extra_landing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("needs_extra_ecommerce", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("needs_commercial_tracking", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("wants_custom_proposal", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("client_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="nuevo"),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("contacted_at", sa.DateTime(), nullable=True),
        sa.Column("responsible_user_id", sa.Integer(), nullable=True),
        sa.Column("channel", sa.String(length=40), nullable=False, server_default="landing_marketing_form"),
        sa.Column("internal_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("internal_sections_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("suggested_price_min_mxn", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("suggested_price_max_mxn", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("suggested_price_mxn", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("recommended_services_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("risks_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["responsible_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketing_prospects_id"), "marketing_prospects", ["id"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_contact_email"), "marketing_prospects", ["contact_email"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_company_brand"), "marketing_prospects", ["company_brand"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_desired_conversion_channel"), "marketing_prospects", ["desired_conversion_channel"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_urgency"), "marketing_prospects", ["urgency"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_status"), "marketing_prospects", ["status"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_channel"), "marketing_prospects", ["channel"], unique=False)
    op.create_index(op.f("ix_marketing_prospects_responsible_user_id"), "marketing_prospects", ["responsible_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_marketing_prospects_responsible_user_id"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_channel"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_status"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_urgency"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_desired_conversion_channel"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_company_brand"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_contact_email"), table_name="marketing_prospects")
    op.drop_index(op.f("ix_marketing_prospects_id"), table_name="marketing_prospects")
    op.drop_table("marketing_prospects")

