"""Add operations commercial domain

Revision ID: 20260328_05
Revises: 20260328_04
Create Date: 2026-03-28
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260328_05"
down_revision = "20260328_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "service_offerings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default=sa.text("60")),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("requires_schedule", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_service_offerings_id", "service_offerings", ["id"])
    op.create_index("ix_service_offerings_tenant_id", "service_offerings", ["tenant_id"])
    op.create_index("ix_service_offerings_category_id", "service_offerings", ["category_id"])

    op.add_column("appointments", sa.Column("service_offering_id", sa.Integer(), nullable=True))
    op.add_column("appointments", sa.Column("scheduled_for", sa.DateTime(), nullable=True))
    op.add_column("appointments", sa.Column("is_gift", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("appointments", sa.Column("gift_sender_name", sa.String(length=180), nullable=True))
    op.add_column("appointments", sa.Column("gift_sender_email", sa.String(length=180), nullable=True))
    op.add_column("appointments", sa.Column("gift_is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("appointments", sa.Column("gift_message", sa.Text(), nullable=True))
    op.add_column("appointments", sa.Column("gift_recipient_name", sa.String(length=180), nullable=True))
    op.add_column("appointments", sa.Column("gift_recipient_email", sa.String(length=180), nullable=True))
    op.add_column("appointments", sa.Column("gift_recipient_phone", sa.String(length=40), nullable=True))
    op.add_column("appointments", sa.Column("instructions_sent_at", sa.DateTime(), nullable=True))
    op.add_column("appointments", sa.Column("confirmation_received_at", sa.DateTime(), nullable=True))
    op.add_column("appointments", sa.Column("notes", sa.Text(), nullable=True))
    op.create_index("ix_appointments_service_offering_id", "appointments", ["service_offering_id"])
    with op.batch_alter_table("appointments") as batch_op:
        batch_op.create_foreign_key(
            "fk_appointments_service_offering_id", "service_offerings", ["service_offering_id"], ["id"]
        )

    op.create_table(
        "distributor_applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("contact_name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_distributor_applications_id", "distributor_applications", ["id"])
    op.create_index("ix_distributor_applications_tenant_id", "distributor_applications", ["tenant_id"])
    op.create_index("ix_distributor_applications_requested_by_user_id", "distributor_applications", ["requested_by_user_id"])

    op.create_table(
        "distributor_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("distributor_application_id", sa.Integer(), nullable=True),
        sa.Column("business_name", sa.String(length=200), nullable=False),
        sa.Column("contact_name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("is_authorized", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("authorization_date", sa.DateTime(), nullable=True),
        sa.Column("can_purchase_wholesale", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("can_sell_as_franchise", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("warehouse_address", sa.Text(), nullable=True),
        sa.Column("delivery_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["distributor_application_id"], ["distributor_applications.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_distributor_profiles_id", "distributor_profiles", ["id"])
    op.create_index("ix_distributor_profiles_tenant_id", "distributor_profiles", ["tenant_id"])
    op.create_index("ix_distributor_profiles_customer_id", "distributor_profiles", ["customer_id"])
    op.create_index("ix_distributor_profiles_distributor_application_id", "distributor_profiles", ["distributor_application_id"])

    op.create_table(
        "distributor_employees",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("distributor_profile_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=180), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("role_name", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["distributor_profile_id"], ["distributor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_distributor_employees_id", "distributor_employees", ["id"])
    op.create_index("ix_distributor_employees_tenant_id", "distributor_employees", ["tenant_id"])
    op.create_index("ix_distributor_employees_distributor_profile_id", "distributor_employees", ["distributor_profile_id"])

    op.create_table(
        "contract_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("contract_type", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("content_markdown", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_contract_templates_id", "contract_templates", ["id"])
    op.create_index("ix_contract_templates_tenant_id", "contract_templates", ["tenant_id"])

    op.create_table(
        "signed_contracts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("contract_template_id", sa.Integer(), nullable=False),
        sa.Column("distributor_profile_id", sa.Integer(), nullable=True),
        sa.Column("signed_by_name", sa.String(length=180), nullable=False),
        sa.Column("signed_by_email", sa.String(length=180), nullable=False),
        sa.Column("signed_at", sa.DateTime(), nullable=False),
        sa.Column("signature_text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'signed'")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["contract_template_id"], ["contract_templates.id"]),
        sa.ForeignKeyConstraint(["distributor_profile_id"], ["distributor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_signed_contracts_id", "signed_contracts", ["id"])
    op.create_index("ix_signed_contracts_tenant_id", "signed_contracts", ["tenant_id"])
    op.create_index("ix_signed_contracts_contract_template_id", "signed_contracts", ["contract_template_id"])
    op.create_index("ix_signed_contracts_distributor_profile_id", "signed_contracts", ["distributor_profile_id"])

    op.create_table(
        "recurring_order_schedules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("distributor_profile_id", sa.Integer(), nullable=True),
        sa.Column("frequency", sa.String(length=20), nullable=False),
        sa.Column("next_run_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["distributor_profile_id"], ["distributor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recurring_order_schedules_id", "recurring_order_schedules", ["id"])
    op.create_index("ix_recurring_order_schedules_tenant_id", "recurring_order_schedules", ["tenant_id"])
    op.create_index("ix_recurring_order_schedules_customer_id", "recurring_order_schedules", ["customer_id"])
    op.create_index("ix_recurring_order_schedules_distributor_profile_id", "recurring_order_schedules", ["distributor_profile_id"])

    op.create_table(
        "recurring_order_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recurring_order_schedule_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price_snapshot", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recurring_order_schedule_id"], ["recurring_order_schedules.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recurring_order_items_id", "recurring_order_items", ["id"])
    op.create_index("ix_recurring_order_items_recurring_order_schedule_id", "recurring_order_items", ["recurring_order_schedule_id"])
    op.create_index("ix_recurring_order_items_product_id", "recurring_order_items", ["product_id"])

    op.create_table(
        "logistics_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("recurring_order_schedule_id", sa.Integer(), nullable=True),
        sa.Column("customer_id", sa.Integer(), nullable=True),
        sa.Column("distributor_profile_id", sa.Integer(), nullable=True),
        sa.Column("delivery_type", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("warehouse_address", sa.Text(), nullable=True),
        sa.Column("delivery_address", sa.Text(), nullable=False),
        sa.Column("scheduled_delivery_at", sa.DateTime(), nullable=True),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.Column("tracking_reference", sa.String(length=120), nullable=True),
        sa.Column("courier_name", sa.String(length=120), nullable=True),
        sa.Column("delivery_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["recurring_order_schedule_id"], ["recurring_order_schedules.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["distributor_profile_id"], ["distributor_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logistics_orders_id", "logistics_orders", ["id"])
    op.create_index("ix_logistics_orders_tenant_id", "logistics_orders", ["tenant_id"])
    op.create_index("ix_logistics_orders_order_id", "logistics_orders", ["order_id"])
    op.create_index("ix_logistics_orders_recurring_order_schedule_id", "logistics_orders", ["recurring_order_schedule_id"])
    op.create_index("ix_logistics_orders_customer_id", "logistics_orders", ["customer_id"])
    op.create_index("ix_logistics_orders_distributor_profile_id", "logistics_orders", ["distributor_profile_id"])

    op.create_table(
        "logistics_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("logistics_order_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=30), nullable=False),
        sa.Column("event_at", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["logistics_order_id"], ["logistics_orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logistics_events_id", "logistics_events", ["id"])
    op.create_index("ix_logistics_events_logistics_order_id", "logistics_events", ["logistics_order_id"])

    op.add_column("orders", sa.Column("has_service_items", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("orders", sa.Column("service_payload_json", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("is_gift", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("orders", sa.Column("gift_sender_name", sa.String(length=180), nullable=True))
    op.add_column("orders", sa.Column("gift_sender_email", sa.String(length=180), nullable=True))
    op.add_column("orders", sa.Column("gift_is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("orders", sa.Column("gift_message", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("gift_recipient_name", sa.String(length=180), nullable=True))
    op.add_column("orders", sa.Column("gift_recipient_email", sa.String(length=180), nullable=True))
    op.add_column("orders", sa.Column("gift_recipient_phone", sa.String(length=40), nullable=True))
    op.add_column("orders", sa.Column("appointment_scheduled_for", sa.DateTime(), nullable=True))

    with op.batch_alter_table("order_items") as batch_op:
        batch_op.alter_column("product_id", existing_type=sa.Integer(), nullable=True)
        batch_op.add_column(sa.Column("service_offering_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_order_items_service_offering_id", "service_offerings", ["service_offering_id"], ["id"]
        )
        batch_op.create_index("ix_order_items_service_offering_id", ["service_offering_id"])


def downgrade() -> None:
    with op.batch_alter_table("order_items") as batch_op:
        batch_op.drop_index("ix_order_items_service_offering_id")
        batch_op.drop_constraint("fk_order_items_service_offering_id", type_="foreignkey")
        batch_op.drop_column("service_offering_id")
        batch_op.alter_column("product_id", existing_type=sa.Integer(), nullable=False)

    op.drop_column("orders", "appointment_scheduled_for")
    op.drop_column("orders", "gift_recipient_phone")
    op.drop_column("orders", "gift_recipient_email")
    op.drop_column("orders", "gift_recipient_name")
    op.drop_column("orders", "gift_message")
    op.drop_column("orders", "gift_is_anonymous")
    op.drop_column("orders", "gift_sender_email")
    op.drop_column("orders", "gift_sender_name")
    op.drop_column("orders", "is_gift")
    op.drop_column("orders", "service_payload_json")
    op.drop_column("orders", "has_service_items")

    op.drop_index("ix_logistics_events_logistics_order_id", table_name="logistics_events")
    op.drop_index("ix_logistics_events_id", table_name="logistics_events")
    op.drop_table("logistics_events")
    op.drop_index("ix_logistics_orders_distributor_profile_id", table_name="logistics_orders")
    op.drop_index("ix_logistics_orders_customer_id", table_name="logistics_orders")
    op.drop_index("ix_logistics_orders_recurring_order_schedule_id", table_name="logistics_orders")
    op.drop_index("ix_logistics_orders_order_id", table_name="logistics_orders")
    op.drop_index("ix_logistics_orders_tenant_id", table_name="logistics_orders")
    op.drop_index("ix_logistics_orders_id", table_name="logistics_orders")
    op.drop_table("logistics_orders")
    op.drop_index("ix_recurring_order_items_product_id", table_name="recurring_order_items")
    op.drop_index("ix_recurring_order_items_recurring_order_schedule_id", table_name="recurring_order_items")
    op.drop_index("ix_recurring_order_items_id", table_name="recurring_order_items")
    op.drop_table("recurring_order_items")
    op.drop_index("ix_recurring_order_schedules_distributor_profile_id", table_name="recurring_order_schedules")
    op.drop_index("ix_recurring_order_schedules_customer_id", table_name="recurring_order_schedules")
    op.drop_index("ix_recurring_order_schedules_tenant_id", table_name="recurring_order_schedules")
    op.drop_index("ix_recurring_order_schedules_id", table_name="recurring_order_schedules")
    op.drop_table("recurring_order_schedules")
    op.drop_index("ix_signed_contracts_distributor_profile_id", table_name="signed_contracts")
    op.drop_index("ix_signed_contracts_contract_template_id", table_name="signed_contracts")
    op.drop_index("ix_signed_contracts_tenant_id", table_name="signed_contracts")
    op.drop_index("ix_signed_contracts_id", table_name="signed_contracts")
    op.drop_table("signed_contracts")
    op.drop_index("ix_contract_templates_tenant_id", table_name="contract_templates")
    op.drop_index("ix_contract_templates_id", table_name="contract_templates")
    op.drop_table("contract_templates")
    op.drop_index("ix_distributor_employees_distributor_profile_id", table_name="distributor_employees")
    op.drop_index("ix_distributor_employees_tenant_id", table_name="distributor_employees")
    op.drop_index("ix_distributor_employees_id", table_name="distributor_employees")
    op.drop_table("distributor_employees")
    op.drop_index("ix_distributor_profiles_distributor_application_id", table_name="distributor_profiles")
    op.drop_index("ix_distributor_profiles_customer_id", table_name="distributor_profiles")
    op.drop_index("ix_distributor_profiles_tenant_id", table_name="distributor_profiles")
    op.drop_index("ix_distributor_profiles_id", table_name="distributor_profiles")
    op.drop_table("distributor_profiles")
    op.drop_index("ix_distributor_applications_requested_by_user_id", table_name="distributor_applications")
    op.drop_index("ix_distributor_applications_tenant_id", table_name="distributor_applications")
    op.drop_index("ix_distributor_applications_id", table_name="distributor_applications")
    op.drop_table("distributor_applications")
    with op.batch_alter_table("appointments") as batch_op:
        batch_op.drop_constraint("fk_appointments_service_offering_id", type_="foreignkey")
    op.drop_index("ix_appointments_service_offering_id", table_name="appointments")
    op.drop_column("appointments", "notes")
    op.drop_column("appointments", "confirmation_received_at")
    op.drop_column("appointments", "instructions_sent_at")
    op.drop_column("appointments", "gift_recipient_phone")
    op.drop_column("appointments", "gift_recipient_email")
    op.drop_column("appointments", "gift_recipient_name")
    op.drop_column("appointments", "gift_message")
    op.drop_column("appointments", "gift_is_anonymous")
    op.drop_column("appointments", "gift_sender_email")
    op.drop_column("appointments", "gift_sender_name")
    op.drop_column("appointments", "is_gift")
    op.drop_column("appointments", "scheduled_for")
    op.drop_column("appointments", "service_offering_id")
    op.drop_index("ix_service_offerings_category_id", table_name="service_offerings")
    op.drop_index("ix_service_offerings_tenant_id", table_name="service_offerings")
    op.drop_index("ix_service_offerings_id", table_name="service_offerings")
    op.drop_table("service_offerings")
