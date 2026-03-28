"""Add auth and storefront tables

Revision ID: 20260327_02
Revises: 20260327_01
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260327_02"
down_revision = "20260327_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("full_name", sa.String(length=180), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("tenant_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    op.add_column("tenant_branding", sa.Column("hero_title", sa.String(length=255), nullable=True))
    op.add_column("tenant_branding", sa.Column("hero_subtitle", sa.String(length=500), nullable=True))
    op.add_column("tenant_branding", sa.Column("contact_whatsapp", sa.String(length=30), nullable=True))
    op.add_column("tenant_branding", sa.Column("contact_email", sa.String(length=180), nullable=True))

    op.create_table(
        "storefront_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("is_initialized", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("hero_banner_url", sa.String(length=255), nullable=True),
        sa.Column("promotion_text", sa.String(length=255), nullable=True),
        sa.Column("ecommerce_enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("landing_enabled", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("config_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id"),
    )
    op.create_index("ix_storefront_configs_id", "storefront_configs", ["id"])
    op.create_index("ix_storefront_configs_tenant_id", "storefront_configs", ["tenant_id"])

    op.create_table(
        "banners",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("storefront_config_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("subtitle", sa.String(length=255), nullable=True),
        sa.Column("image_url", sa.String(length=255), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["storefront_config_id"], ["storefront_configs.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_banners_id", "banners", ["id"])
    op.create_index("ix_banners_tenant_id", "banners", ["tenant_id"])
    op.create_index("ix_banners_storefront_config_id", "banners", ["storefront_config_id"])


def downgrade() -> None:
    op.drop_index("ix_banners_storefront_config_id", table_name="banners")
    op.drop_index("ix_banners_tenant_id", table_name="banners")
    op.drop_index("ix_banners_id", table_name="banners")
    op.drop_table("banners")

    op.drop_index("ix_storefront_configs_tenant_id", table_name="storefront_configs")
    op.drop_index("ix_storefront_configs_id", table_name="storefront_configs")
    op.drop_table("storefront_configs")

    op.drop_column("tenant_branding", "contact_email")
    op.drop_column("tenant_branding", "contact_whatsapp")
    op.drop_column("tenant_branding", "hero_subtitle")
    op.drop_column("tenant_branding", "hero_title")

    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
