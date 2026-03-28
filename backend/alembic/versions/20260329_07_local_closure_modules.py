"""Add onboarding currency pos automation base modules

Revision ID: 20260329_07
Revises: 20260329_06
Create Date: 2026-03-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260329_07"
down_revision = "20260329_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("preferred_language", sa.String(length=10), nullable=False, server_default=sa.text("'es'")),
    )

    op.create_table(
        "onboarding_guides",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=60), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("audience", sa.String(length=30), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_onboarding_guides_id", "onboarding_guides", ["id"])
    op.create_index("ix_onboarding_guides_code", "onboarding_guides", ["code"], unique=True)

    op.create_table(
        "onboarding_steps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("guide_id", sa.Integer(), nullable=False),
        sa.Column("step_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cta_label", sa.String(length=120), nullable=True),
        sa.Column("cta_path", sa.String(length=255), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["guide_id"], ["onboarding_guides.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_onboarding_steps_id", "onboarding_steps", ["id"])
    op.create_index("ix_onboarding_steps_guide_id", "onboarding_steps", ["guide_id"])

    op.create_table(
        "user_onboarding_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("guide_id", sa.Integer(), nullable=False),
        sa.Column("step_id", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["guide_id"], ["onboarding_guides.id"]),
        sa.ForeignKeyConstraint(["step_id"], ["onboarding_steps.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_onboarding_progress_id", "user_onboarding_progress", ["id"])
    op.create_index("ix_user_onboarding_progress_user_id", "user_onboarding_progress", ["user_id"])
    op.create_index("ix_user_onboarding_progress_guide_id", "user_onboarding_progress", ["guide_id"])
    op.create_index("ix_user_onboarding_progress_step_id", "user_onboarding_progress", ["step_id"])

    op.create_table(
        "currency_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("base_currency", sa.String(length=10), nullable=False, server_default=sa.text("'MXN'")),
        sa.Column("enabled_currencies_json", sa.Text(), nullable=False, server_default=sa.text("'[\"MXN\"]'")),
        sa.Column("display_mode", sa.String(length=30), nullable=False, server_default=sa.text("'base_only'")),
        sa.Column("exchange_mode", sa.String(length=20), nullable=False, server_default=sa.text("'manual'")),
        sa.Column("auto_update_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("rounding_mode", sa.String(length=20), nullable=False, server_default=sa.text("'none'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_currency_settings_id", "currency_settings", ["id"])
    op.create_index("ix_currency_settings_tenant_id", "currency_settings", ["tenant_id"], unique=True)

    op.create_table(
        "exchange_rates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("base_currency", sa.String(length=10), nullable=False),
        sa.Column("target_currency", sa.String(length=10), nullable=False),
        sa.Column("rate", sa.Numeric(16, 6), nullable=False),
        sa.Column("source_name", sa.String(length=60), nullable=False),
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("valid_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_exchange_rates_id", "exchange_rates", ["id"])
    op.create_index("ix_exchange_rates_base_currency", "exchange_rates", ["base_currency"])
    op.create_index("ix_exchange_rates_target_currency", "exchange_rates", ["target_currency"])

    op.create_table(
        "pos_locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("code", sa.String(length=60), nullable=False),
        sa.Column("location_type", sa.String(length=30), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_locations_id", "pos_locations", ["id"])
    op.create_index("ix_pos_locations_tenant_id", "pos_locations", ["tenant_id"])
    op.create_index("ix_pos_locations_code", "pos_locations", ["code"])

    op.create_table(
        "pos_employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("pos_location_id", sa.Integer(), nullable=False),
        sa.Column("distributor_profile_id", sa.Integer(), nullable=True),
        sa.Column("full_name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("role_name", sa.String(length=80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["pos_location_id"], ["pos_locations.id"]),
        sa.ForeignKeyConstraint(["distributor_profile_id"], ["distributor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_employees_id", "pos_employees", ["id"])
    op.create_index("ix_pos_employees_tenant_id", "pos_employees", ["tenant_id"])
    op.create_index("ix_pos_employees_pos_location_id", "pos_employees", ["pos_location_id"])
    op.create_index("ix_pos_employees_distributor_profile_id", "pos_employees", ["distributor_profile_id"])

    op.create_table(
        "pos_sales",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("pos_location_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("employee_id", sa.Integer(), nullable=True),
        sa.Column("subtotal_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False, server_default=sa.text("'MXN'")),
        sa.Column("payment_method", sa.String(length=20), nullable=False, server_default=sa.text("'cash'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["pos_location_id"], ["pos_locations.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["pos_employees.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_sales_id", "pos_sales", ["id"])
    op.create_index("ix_pos_sales_tenant_id", "pos_sales", ["tenant_id"])
    op.create_index("ix_pos_sales_pos_location_id", "pos_sales", ["pos_location_id"])
    op.create_index("ix_pos_sales_customer_id", "pos_sales", ["customer_id"])
    op.create_index("ix_pos_sales_employee_id", "pos_sales", ["employee_id"])

    op.create_table(
        "pos_sale_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pos_sale_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["pos_sale_id"], ["pos_sales.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_sale_items_id", "pos_sale_items", ["id"])
    op.create_index("ix_pos_sale_items_pos_sale_id", "pos_sale_items", ["pos_sale_id"])
    op.create_index("ix_pos_sale_items_product_id", "pos_sale_items", ["product_id"])

    op.create_table(
        "pos_membership_registrations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("pos_location_id", sa.Integer(), nullable=False),
        sa.Column("registration_source", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["pos_location_id"], ["pos_locations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pos_membership_registrations_id", "pos_membership_registrations", ["id"])
    op.create_index("ix_pos_membership_registrations_tenant_id", "pos_membership_registrations", ["tenant_id"])
    op.create_index("ix_pos_membership_registrations_customer_id", "pos_membership_registrations", ["customer_id"])
    op.create_index("ix_pos_membership_registrations_pos_location_id", "pos_membership_registrations", ["pos_location_id"])

    op.create_table(
        "bot_channel_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("channel", sa.String(length=30), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("provider_name", sa.String(length=80), nullable=True),
        sa.Column("config_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bot_channel_configs_id", "bot_channel_configs", ["id"])
    op.create_index("ix_bot_channel_configs_tenant_id", "bot_channel_configs", ["tenant_id"])

    op.create_table(
        "bot_message_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("channel", sa.String(length=30), nullable=False),
        sa.Column("template_text", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bot_message_templates_id", "bot_message_templates", ["id"])
    op.create_index("ix_bot_message_templates_tenant_id", "bot_message_templates", ["tenant_id"])
    op.create_index("ix_bot_message_templates_event_type", "bot_message_templates", ["event_type"])

    op.create_table(
        "automation_event_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=60), nullable=False),
        sa.Column("related_entity_type", sa.String(length=60), nullable=True),
        sa.Column("related_entity_id", sa.Integer(), nullable=True),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_event_logs_id", "automation_event_logs", ["id"])
    op.create_index("ix_automation_event_logs_tenant_id", "automation_event_logs", ["tenant_id"])
    op.create_index("ix_automation_event_logs_event_type", "automation_event_logs", ["event_type"])


def downgrade() -> None:
    op.drop_index("ix_automation_event_logs_event_type", table_name="automation_event_logs")
    op.drop_index("ix_automation_event_logs_tenant_id", table_name="automation_event_logs")
    op.drop_index("ix_automation_event_logs_id", table_name="automation_event_logs")
    op.drop_table("automation_event_logs")

    op.drop_index("ix_bot_message_templates_event_type", table_name="bot_message_templates")
    op.drop_index("ix_bot_message_templates_tenant_id", table_name="bot_message_templates")
    op.drop_index("ix_bot_message_templates_id", table_name="bot_message_templates")
    op.drop_table("bot_message_templates")

    op.drop_index("ix_bot_channel_configs_tenant_id", table_name="bot_channel_configs")
    op.drop_index("ix_bot_channel_configs_id", table_name="bot_channel_configs")
    op.drop_table("bot_channel_configs")

    op.drop_index("ix_pos_membership_registrations_pos_location_id", table_name="pos_membership_registrations")
    op.drop_index("ix_pos_membership_registrations_customer_id", table_name="pos_membership_registrations")
    op.drop_index("ix_pos_membership_registrations_tenant_id", table_name="pos_membership_registrations")
    op.drop_index("ix_pos_membership_registrations_id", table_name="pos_membership_registrations")
    op.drop_table("pos_membership_registrations")

    op.drop_index("ix_pos_sale_items_product_id", table_name="pos_sale_items")
    op.drop_index("ix_pos_sale_items_pos_sale_id", table_name="pos_sale_items")
    op.drop_index("ix_pos_sale_items_id", table_name="pos_sale_items")
    op.drop_table("pos_sale_items")

    op.drop_index("ix_pos_sales_employee_id", table_name="pos_sales")
    op.drop_index("ix_pos_sales_customer_id", table_name="pos_sales")
    op.drop_index("ix_pos_sales_pos_location_id", table_name="pos_sales")
    op.drop_index("ix_pos_sales_tenant_id", table_name="pos_sales")
    op.drop_index("ix_pos_sales_id", table_name="pos_sales")
    op.drop_table("pos_sales")

    op.drop_index("ix_pos_employees_distributor_profile_id", table_name="pos_employees")
    op.drop_index("ix_pos_employees_pos_location_id", table_name="pos_employees")
    op.drop_index("ix_pos_employees_tenant_id", table_name="pos_employees")
    op.drop_index("ix_pos_employees_id", table_name="pos_employees")
    op.drop_table("pos_employees")

    op.drop_index("ix_pos_locations_code", table_name="pos_locations")
    op.drop_index("ix_pos_locations_tenant_id", table_name="pos_locations")
    op.drop_index("ix_pos_locations_id", table_name="pos_locations")
    op.drop_table("pos_locations")

    op.drop_index("ix_exchange_rates_target_currency", table_name="exchange_rates")
    op.drop_index("ix_exchange_rates_base_currency", table_name="exchange_rates")
    op.drop_index("ix_exchange_rates_id", table_name="exchange_rates")
    op.drop_table("exchange_rates")

    op.drop_index("ix_currency_settings_tenant_id", table_name="currency_settings")
    op.drop_index("ix_currency_settings_id", table_name="currency_settings")
    op.drop_table("currency_settings")

    op.drop_index("ix_user_onboarding_progress_step_id", table_name="user_onboarding_progress")
    op.drop_index("ix_user_onboarding_progress_guide_id", table_name="user_onboarding_progress")
    op.drop_index("ix_user_onboarding_progress_user_id", table_name="user_onboarding_progress")
    op.drop_index("ix_user_onboarding_progress_id", table_name="user_onboarding_progress")
    op.drop_table("user_onboarding_progress")

    op.drop_index("ix_onboarding_steps_guide_id", table_name="onboarding_steps")
    op.drop_index("ix_onboarding_steps_id", table_name="onboarding_steps")
    op.drop_table("onboarding_steps")

    op.drop_index("ix_onboarding_guides_code", table_name="onboarding_guides")
    op.drop_index("ix_onboarding_guides_id", table_name="onboarding_guides")
    op.drop_table("onboarding_guides")

    op.drop_column("users", "preferred_language")
