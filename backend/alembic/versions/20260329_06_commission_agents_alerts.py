"""Add commission agents referrals plan leads and internal alerts

Revision ID: 20260329_06
Revises: 20260328_05
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260329_06"
down_revision = "20260328_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sales_commission_agents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("full_name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("commission_percentage", sa.Numeric(6, 2), nullable=False, server_default=sa.text("30")),
        sa.Column("valid_from", sa.DateTime(), nullable=True),
        sa.Column("valid_until", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_commission_agents_id", "sales_commission_agents", ["id"])
    op.create_index("ix_sales_commission_agents_code", "sales_commission_agents", ["code"], unique=True)
    op.create_index("ix_sales_commission_agents_email", "sales_commission_agents", ["email"])

    op.create_table(
        "sales_referrals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("commission_agent_id", sa.Integer(), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("lead_email", sa.String(length=180), nullable=True),
        sa.Column("lead_name", sa.String(length=180), nullable=True),
        sa.Column("lead_phone", sa.String(length=40), nullable=True),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("referral_code_entered", sa.String(length=80), nullable=True),
        sa.Column("plan_code", sa.String(length=40), nullable=True),
        sa.Column("needs_followup", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("needs_appointment", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("requested_contact", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'lead'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["commission_agent_id"], ["sales_commission_agents.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sales_referrals_id", "sales_referrals", ["id"])
    op.create_index("ix_sales_referrals_commission_agent_id", "sales_referrals", ["commission_agent_id"])
    op.create_index("ix_sales_referrals_tenant_id", "sales_referrals", ["tenant_id"])

    op.create_table(
        "plan_purchase_leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_name", sa.String(length=180), nullable=False),
        sa.Column("legal_type", sa.String(length=40), nullable=False),
        sa.Column("buyer_name", sa.String(length=180), nullable=False),
        sa.Column("buyer_email", sa.String(length=180), nullable=False),
        sa.Column("buyer_phone", sa.String(length=40), nullable=False),
        sa.Column("selected_plan_code", sa.String(length=40), nullable=False),
        sa.Column("commission_agent_id", sa.Integer(), nullable=True),
        sa.Column("referral_code", sa.String(length=80), nullable=True),
        sa.Column("is_commissioned_sale", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("needs_followup", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("needs_appointment", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("purchase_status", sa.String(length=30), nullable=False, server_default=sa.text("'initiated'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["commission_agent_id"], ["sales_commission_agents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_plan_purchase_leads_id", "plan_purchase_leads", ["id"])
    op.create_index("ix_plan_purchase_leads_buyer_email", "plan_purchase_leads", ["buyer_email"])
    op.create_index("ix_plan_purchase_leads_commission_agent_id", "plan_purchase_leads", ["commission_agent_id"])

    op.create_table(
        "internal_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alert_type", sa.String(length=40), nullable=False),
        sa.Column("related_entity_type", sa.String(length=40), nullable=True),
        sa.Column("related_entity_id", sa.Integer(), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("commission_agent_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'info'")),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["commission_agent_id"], ["sales_commission_agents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_internal_alerts_id", "internal_alerts", ["id"])
    op.create_index("ix_internal_alerts_tenant_id", "internal_alerts", ["tenant_id"])
    op.create_index("ix_internal_alerts_commission_agent_id", "internal_alerts", ["commission_agent_id"])


def downgrade() -> None:
    op.drop_index("ix_internal_alerts_commission_agent_id", table_name="internal_alerts")
    op.drop_index("ix_internal_alerts_tenant_id", table_name="internal_alerts")
    op.drop_index("ix_internal_alerts_id", table_name="internal_alerts")
    op.drop_table("internal_alerts")

    op.drop_index("ix_plan_purchase_leads_commission_agent_id", table_name="plan_purchase_leads")
    op.drop_index("ix_plan_purchase_leads_buyer_email", table_name="plan_purchase_leads")
    op.drop_index("ix_plan_purchase_leads_id", table_name="plan_purchase_leads")
    op.drop_table("plan_purchase_leads")

    op.drop_index("ix_sales_referrals_tenant_id", table_name="sales_referrals")
    op.drop_index("ix_sales_referrals_commission_agent_id", table_name="sales_referrals")
    op.drop_index("ix_sales_referrals_id", table_name="sales_referrals")
    op.drop_table("sales_referrals")

    op.drop_index("ix_sales_commission_agents_email", table_name="sales_commission_agents")
    op.drop_index("ix_sales_commission_agents_code", table_name="sales_commission_agents")
    op.drop_index("ix_sales_commission_agents_id", table_name="sales_commission_agents")
    op.drop_table("sales_commission_agents")

