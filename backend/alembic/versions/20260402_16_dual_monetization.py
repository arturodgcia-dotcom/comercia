"""dual monetization tenant config and pos totals

Revision ID: 20260402_16
Revises: 20260401_15
Create Date: 2026-04-02 09:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260402_16"
down_revision = "20260401_15"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("plan_type", sa.String(length=20), nullable=True))
    op.add_column("tenants", sa.Column("commission_rules_json", sa.Text(), nullable=True))
    op.add_column("tenants", sa.Column("subscription_plan_json", sa.Text(), nullable=True))

    op.execute("UPDATE tenants SET plan_type = 'subscription' WHERE plan_type IS NULL")
    op.alter_column("tenants", "plan_type", existing_type=sa.String(length=20), nullable=False)

    op.add_column("pos_sales", sa.Column("commission_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("pos_sales", sa.Column("net_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("pos_sales", sa.Column("payment_mode", sa.String(length=20), nullable=True))

    op.execute("UPDATE pos_sales SET commission_amount = 0 WHERE commission_amount IS NULL")
    op.execute("UPDATE pos_sales SET net_amount = total_amount WHERE net_amount IS NULL")
    op.execute("UPDATE pos_sales SET payment_mode = 'subscription' WHERE payment_mode IS NULL")

    op.alter_column("pos_sales", "commission_amount", existing_type=sa.Numeric(12, 2), nullable=False)
    op.alter_column("pos_sales", "net_amount", existing_type=sa.Numeric(12, 2), nullable=False)
    op.alter_column("pos_sales", "payment_mode", existing_type=sa.String(length=20), nullable=False)


def downgrade() -> None:
    op.drop_column("pos_sales", "payment_mode")
    op.drop_column("pos_sales", "net_amount")
    op.drop_column("pos_sales", "commission_amount")

    op.drop_column("tenants", "subscription_plan_json")
    op.drop_column("tenants", "commission_rules_json")
    op.drop_column("tenants", "plan_type")
