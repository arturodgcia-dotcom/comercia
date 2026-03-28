"""Add sentinel security antifraud module

Revision ID: 20260329_08
Revises: 20260329_07
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260329_08"
down_revision = "20260329_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "security_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("source_ip", sa.String(length=80), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'low'")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'new'")),
        sa.Column("event_payload_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_events_id", "security_events", ["id"])
    op.create_index("ix_security_events_tenant_id", "security_events", ["tenant_id"])
    op.create_index("ix_security_events_user_id", "security_events", ["user_id"])
    op.create_index("ix_security_events_event_type", "security_events", ["event_type"])
    op.create_index("ix_security_events_severity", "security_events", ["severity"])
    op.create_index("ix_security_events_status", "security_events", ["status"])
    op.create_index("ix_security_events_created_at", "security_events", ["created_at"])

    op.create_table(
        "security_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=60), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rule_type", sa.String(length=50), nullable=False),
        sa.Column("threshold_count", sa.Integer(), nullable=True),
        sa.Column("threshold_window_minutes", sa.Integer(), nullable=True),
        sa.Column("action_type", sa.String(length=30), nullable=False, server_default=sa.text("'alert_only'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'medium'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_rules_id", "security_rules", ["id"])
    op.create_index("ix_security_rules_code", "security_rules", ["code"], unique=True)
    op.create_index("ix_security_rules_rule_type", "security_rules", ["rule_type"])

    op.create_table(
        "security_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("security_event_id", sa.Integer(), nullable=True),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False, server_default=sa.text("'medium'")),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("assigned_to", sa.String(length=180), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["security_event_id"], ["security_events.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_alerts_id", "security_alerts", ["id"])
    op.create_index("ix_security_alerts_tenant_id", "security_alerts", ["tenant_id"])
    op.create_index("ix_security_alerts_security_event_id", "security_alerts", ["security_event_id"])
    op.create_index("ix_security_alerts_alert_type", "security_alerts", ["alert_type"])
    op.create_index("ix_security_alerts_severity", "security_alerts", ["severity"])
    op.create_index("ix_security_alerts_is_read", "security_alerts", ["is_read"])
    op.create_index("ix_security_alerts_created_at", "security_alerts", ["created_at"])

    op.create_table(
        "risk_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("entity_type", sa.String(length=30), nullable=False),
        sa.Column("entity_key", sa.String(length=120), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("risk_level", sa.String(length=20), nullable=False, server_default=sa.text("'low'")),
        sa.Column("last_evaluated_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_risk_scores_id", "risk_scores", ["id"])
    op.create_index("ix_risk_scores_tenant_id", "risk_scores", ["tenant_id"])
    op.create_index("ix_risk_scores_user_id", "risk_scores", ["user_id"])
    op.create_index("ix_risk_scores_entity_type", "risk_scores", ["entity_type"])
    op.create_index("ix_risk_scores_entity_key", "risk_scores", ["entity_key"])
    op.create_index("ix_risk_scores_risk_level", "risk_scores", ["risk_level"])

    op.create_table(
        "blocked_entities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_type", sa.String(length=30), nullable=False),
        sa.Column("entity_key", sa.String(length=180), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("blocked_until", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_blocked_entities_id", "blocked_entities", ["id"])
    op.create_index("ix_blocked_entities_entity_type", "blocked_entities", ["entity_type"])
    op.create_index("ix_blocked_entities_entity_key", "blocked_entities", ["entity_key"])
    op.create_index("ix_blocked_entities_is_active", "blocked_entities", ["is_active"])
    op.create_index("ix_blocked_entities_created_at", "blocked_entities", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_blocked_entities_created_at", table_name="blocked_entities")
    op.drop_index("ix_blocked_entities_is_active", table_name="blocked_entities")
    op.drop_index("ix_blocked_entities_entity_key", table_name="blocked_entities")
    op.drop_index("ix_blocked_entities_entity_type", table_name="blocked_entities")
    op.drop_index("ix_blocked_entities_id", table_name="blocked_entities")
    op.drop_table("blocked_entities")

    op.drop_index("ix_risk_scores_risk_level", table_name="risk_scores")
    op.drop_index("ix_risk_scores_entity_key", table_name="risk_scores")
    op.drop_index("ix_risk_scores_entity_type", table_name="risk_scores")
    op.drop_index("ix_risk_scores_user_id", table_name="risk_scores")
    op.drop_index("ix_risk_scores_tenant_id", table_name="risk_scores")
    op.drop_index("ix_risk_scores_id", table_name="risk_scores")
    op.drop_table("risk_scores")

    op.drop_index("ix_security_alerts_created_at", table_name="security_alerts")
    op.drop_index("ix_security_alerts_is_read", table_name="security_alerts")
    op.drop_index("ix_security_alerts_severity", table_name="security_alerts")
    op.drop_index("ix_security_alerts_alert_type", table_name="security_alerts")
    op.drop_index("ix_security_alerts_security_event_id", table_name="security_alerts")
    op.drop_index("ix_security_alerts_tenant_id", table_name="security_alerts")
    op.drop_index("ix_security_alerts_id", table_name="security_alerts")
    op.drop_table("security_alerts")

    op.drop_index("ix_security_rules_rule_type", table_name="security_rules")
    op.drop_index("ix_security_rules_code", table_name="security_rules")
    op.drop_index("ix_security_rules_id", table_name="security_rules")
    op.drop_table("security_rules")

    op.drop_index("ix_security_events_created_at", table_name="security_events")
    op.drop_index("ix_security_events_status", table_name="security_events")
    op.drop_index("ix_security_events_severity", table_name="security_events")
    op.drop_index("ix_security_events_event_type", table_name="security_events")
    op.drop_index("ix_security_events_user_id", table_name="security_events")
    op.drop_index("ix_security_events_tenant_id", table_name="security_events")
    op.drop_index("ix_security_events_id", table_name="security_events")
    op.drop_table("security_events")

