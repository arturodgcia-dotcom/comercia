"""catalog import jobs

Revision ID: 20260401_15
Revises: 20260330_14
Create Date: 2026-04-01 02:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260401_15"
down_revision = "20260330_14"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_import_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False),
        sa.Column("total_rows", sa.Integer(), nullable=False),
        sa.Column("valid_rows", sa.Integer(), nullable=False),
        sa.Column("error_rows", sa.Integer(), nullable=False),
        sa.Column("categories_created", sa.Integer(), nullable=False),
        sa.Column("products_created", sa.Integer(), nullable=False),
        sa.Column("products_updated", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalog_import_jobs_id"), "catalog_import_jobs", ["id"], unique=False)
    op.create_index(op.f("ix_catalog_import_jobs_tenant_id"), "catalog_import_jobs", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_catalog_import_jobs_status"), "catalog_import_jobs", ["status"], unique=False)
    op.create_index(op.f("ix_catalog_import_jobs_created_at"), "catalog_import_jobs", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_catalog_import_jobs_created_at"), table_name="catalog_import_jobs")
    op.drop_index(op.f("ix_catalog_import_jobs_status"), table_name="catalog_import_jobs")
    op.drop_index(op.f("ix_catalog_import_jobs_tenant_id"), table_name="catalog_import_jobs")
    op.drop_index(op.f("ix_catalog_import_jobs_id"), table_name="catalog_import_jobs")
    op.drop_table("catalog_import_jobs")
