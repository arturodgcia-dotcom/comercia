"""commercial client accounts and plan limit guards

Revision ID: 20260409_22
Revises: 2d99bb30e566
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260409_22"
down_revision = "2d99bb30e566"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "commercial_client_accounts" not in tables:
        op.create_table(
            "commercial_client_accounts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("legal_name", sa.String(length=220), nullable=False),
            sa.Column("contact_name", sa.String(length=180), nullable=True),
            sa.Column("contact_email", sa.String(length=180), nullable=True),
            sa.Column("contact_phone", sa.String(length=40), nullable=True),
            sa.Column("billing_model", sa.String(length=30), nullable=False, server_default="fixed_subscription"),
            sa.Column("commercial_plan_key", sa.String(length=60), nullable=True),
            sa.Column("commercial_limits_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("addons_json", sa.Text(), nullable=False, server_default="{}"),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="active"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    account_indexes = {idx["name"] for idx in inspector.get_indexes("commercial_client_accounts")}
    if op.f("ix_commercial_client_accounts_id") not in account_indexes:
        op.create_index(op.f("ix_commercial_client_accounts_id"), "commercial_client_accounts", ["id"], unique=False)
    if op.f("ix_commercial_client_accounts_contact_email") not in account_indexes:
        op.create_index(op.f("ix_commercial_client_accounts_contact_email"), "commercial_client_accounts", ["contact_email"], unique=False)
    if op.f("ix_commercial_client_accounts_commercial_plan_key") not in account_indexes:
        op.create_index(op.f("ix_commercial_client_accounts_commercial_plan_key"), "commercial_client_accounts", ["commercial_plan_key"], unique=False)
    if op.f("ix_commercial_client_accounts_status") not in account_indexes:
        op.create_index(op.f("ix_commercial_client_accounts_status"), "commercial_client_accounts", ["status"], unique=False)

    tenant_columns = {col["name"] for col in inspector.get_columns("tenants")}
    if "commercial_client_account_id" not in tenant_columns:
        op.add_column("tenants", sa.Column("commercial_client_account_id", sa.Integer(), nullable=True))
    if "is_parent_brand" not in tenant_columns:
        op.add_column("tenants", sa.Column("is_parent_brand", sa.Boolean(), nullable=False, server_default=sa.false()))
    tenant_indexes = {idx["name"] for idx in inspector.get_indexes("tenants")}
    if op.f("ix_tenants_commercial_client_account_id") not in tenant_indexes:
        op.create_index(op.f("ix_tenants_commercial_client_account_id"), "tenants", ["commercial_client_account_id"], unique=False)

    if bind.dialect.name != "sqlite":
        fk_names = {fk["name"] for fk in inspector.get_foreign_keys("tenants") if fk.get("name")}
        if "fk_tenants_commercial_client_account_id" not in fk_names:
            op.create_foreign_key(
                "fk_tenants_commercial_client_account_id",
                "tenants",
                "commercial_client_accounts",
                ["commercial_client_account_id"],
                ["id"],
            )

    if "commercial_plan_requests" not in tables:
        op.create_table(
            "commercial_plan_requests",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("tenant_id", sa.Integer(), nullable=False),
            sa.Column("commercial_client_account_id", sa.Integer(), nullable=True),
            sa.Column("request_type", sa.String(length=30), nullable=False),
            sa.Column("addon_id", sa.String(length=60), nullable=True),
            sa.Column("target_plan_key", sa.String(length=60), nullable=True),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="nuevo"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("requested_by_user_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["commercial_client_account_id"], ["commercial_client_accounts.id"]),
            sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    req_indexes = {idx["name"] for idx in inspector.get_indexes("commercial_plan_requests")}
    if op.f("ix_commercial_plan_requests_id") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_id"), "commercial_plan_requests", ["id"], unique=False)
    if op.f("ix_commercial_plan_requests_tenant_id") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_tenant_id"), "commercial_plan_requests", ["tenant_id"], unique=False)
    if op.f("ix_commercial_plan_requests_commercial_client_account_id") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_commercial_client_account_id"), "commercial_plan_requests", ["commercial_client_account_id"], unique=False)
    if op.f("ix_commercial_plan_requests_request_type") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_request_type"), "commercial_plan_requests", ["request_type"], unique=False)
    if op.f("ix_commercial_plan_requests_status") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_status"), "commercial_plan_requests", ["status"], unique=False)
    if op.f("ix_commercial_plan_requests_requested_by_user_id") not in req_indexes:
        op.create_index(op.f("ix_commercial_plan_requests_requested_by_user_id"), "commercial_plan_requests", ["requested_by_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_commercial_plan_requests_requested_by_user_id"), table_name="commercial_plan_requests")
    op.drop_index(op.f("ix_commercial_plan_requests_status"), table_name="commercial_plan_requests")
    op.drop_index(op.f("ix_commercial_plan_requests_request_type"), table_name="commercial_plan_requests")
    op.drop_index(op.f("ix_commercial_plan_requests_commercial_client_account_id"), table_name="commercial_plan_requests")
    op.drop_index(op.f("ix_commercial_plan_requests_tenant_id"), table_name="commercial_plan_requests")
    op.drop_index(op.f("ix_commercial_plan_requests_id"), table_name="commercial_plan_requests")
    op.drop_table("commercial_plan_requests")

    op.drop_constraint("fk_tenants_commercial_client_account_id", "tenants", type_="foreignkey")
    op.drop_index(op.f("ix_tenants_commercial_client_account_id"), table_name="tenants")
    op.drop_column("tenants", "is_parent_brand")
    op.drop_column("tenants", "commercial_client_account_id")

    op.drop_index(op.f("ix_commercial_client_accounts_status"), table_name="commercial_client_accounts")
    op.drop_index(op.f("ix_commercial_client_accounts_commercial_plan_key"), table_name="commercial_client_accounts")
    op.drop_index(op.f("ix_commercial_client_accounts_contact_email"), table_name="commercial_client_accounts")
    op.drop_index(op.f("ix_commercial_client_accounts_id"), table_name="commercial_client_accounts")
    op.drop_table("commercial_client_accounts")
