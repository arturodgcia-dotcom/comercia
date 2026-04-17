from sqlalchemy import text

from app.core.config import get_settings
from app.db.reset_demo import reset_demo_data
from app.db.seed_app_base import seed_app_base
from app.db.seed_demo import seed_demo_data
from app.db.session import SessionLocal, engine
from app.models.models import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_runtime_compat_schema()
    settings = get_settings()
    mode = (settings.data_mode or "demo").strip().lower()

    with SessionLocal() as db:
        if mode == "demo":
            seed_demo_data(db)
        elif mode == "app":
            reset_demo_data(db)
            seed_app_base(db)
        elif mode == "none":
            pass
        else:
            seed_demo_data(db)


def _ensure_runtime_compat_schema() -> None:
    """
    Mantiene compatibilidad de esquema para entornos locales donde la BD SQLite
    puede quedar atras respecto a modelos nuevos y evita que startup falle.
    """

    table_columns: dict[str, set[str]] = {}
    with engine.begin() as conn:
        for table in ("tenants", "pos_sales", "products"):
            rows = conn.execute(text(f"PRAGMA table_info('{table}')")).mappings().all()
            table_columns[table] = {str(row["name"]) for row in rows}

        if "plan_type" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN plan_type VARCHAR(20)"))
            conn.execute(text("UPDATE tenants SET plan_type = 'subscription' WHERE plan_type IS NULL"))
        if "commission_rules_json" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commission_rules_json TEXT"))
        if "subscription_plan_json" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN subscription_plan_json TEXT"))
        if "billing_model" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN billing_model VARCHAR(30)"))
            conn.execute(text("UPDATE tenants SET billing_model = 'fixed_subscription' WHERE billing_model IS NULL"))
        if "commission_percentage" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commission_percentage NUMERIC(6,2)"))
            conn.execute(text("UPDATE tenants SET commission_percentage = 0 WHERE commission_percentage IS NULL"))
        if "commission_enabled" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commission_enabled BOOLEAN"))
            conn.execute(text("UPDATE tenants SET commission_enabled = 0 WHERE commission_enabled IS NULL"))
        if "commission_scope" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commission_scope VARCHAR(60)"))
            conn.execute(text("UPDATE tenants SET commission_scope = 'ventas_online_pagadas' WHERE commission_scope IS NULL"))
        if "commission_notes" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commission_notes TEXT"))
        if "commercial_plan_key" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commercial_plan_key VARCHAR(60)"))
        if "commercial_plan_status" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commercial_plan_status VARCHAR(30)"))
            conn.execute(text("UPDATE tenants SET commercial_plan_status = 'not_purchased' WHERE commercial_plan_status IS NULL"))
        if "commercial_plan_source" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commercial_plan_source VARCHAR(40)"))
        if "commercial_checkout_session_id" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commercial_checkout_session_id VARCHAR(255)"))
        if "commercial_limits_json" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN commercial_limits_json TEXT"))
        if "ai_tokens_included" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_included INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_tokens_included = 0 WHERE ai_tokens_included IS NULL"))
        if "ai_tokens_balance" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_balance INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_tokens_balance = 0 WHERE ai_tokens_balance IS NULL"))
        if "ai_tokens_used" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_used INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_tokens_used = 0 WHERE ai_tokens_used IS NULL"))
        if "ai_tokens_locked" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_locked BOOLEAN"))
            conn.execute(text("UPDATE tenants SET ai_tokens_locked = 0 WHERE ai_tokens_locked IS NULL"))
        if "ai_tokens_lock_reason" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_lock_reason TEXT"))
        if "ai_tokens_last_reset_at" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_tokens_last_reset_at DATETIME"))
        if "available_ai_capabilities_json" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN available_ai_capabilities_json TEXT"))
            conn.execute(text("UPDATE tenants SET available_ai_capabilities_json = '[]' WHERE available_ai_capabilities_json IS NULL"))
        if "active_ai_capabilities_json" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN active_ai_capabilities_json TEXT"))
            conn.execute(text("UPDATE tenants SET active_ai_capabilities_json = '[]' WHERE active_ai_capabilities_json IS NULL"))
        if "ai_autonomy_level" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_autonomy_level INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_autonomy_level = 0 WHERE ai_autonomy_level IS NULL"))
        if "ai_token_budget_monthly" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_token_budget_monthly INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_token_budget_monthly = COALESCE(ai_tokens_included, 0) WHERE ai_token_budget_monthly IS NULL"))
        if "ai_token_budget_remaining" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_token_budget_remaining INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_token_budget_remaining = COALESCE(ai_tokens_balance, 0) WHERE ai_token_budget_remaining IS NULL"))
        if "ai_token_budget_reserved" not in table_columns["tenants"]:
            conn.execute(text("ALTER TABLE tenants ADD COLUMN ai_token_budget_reserved INTEGER"))
            conn.execute(text("UPDATE tenants SET ai_token_budget_reserved = 0 WHERE ai_token_budget_reserved IS NULL"))

        if "commission_amount" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN commission_amount NUMERIC(12,2)"))
            conn.execute(text("UPDATE pos_sales SET commission_amount = 0 WHERE commission_amount IS NULL"))
        if "net_amount" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN net_amount NUMERIC(12,2)"))
            conn.execute(text("UPDATE pos_sales SET net_amount = total_amount WHERE net_amount IS NULL"))
        if "payment_mode" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN payment_mode VARCHAR(20)"))
            conn.execute(text("UPDATE pos_sales SET payment_mode = 'subscription' WHERE payment_mode IS NULL"))

        if "sku" not in table_columns["products"]:
            conn.execute(text("ALTER TABLE products ADD COLUMN sku VARCHAR(120)"))
            conn.execute(text("UPDATE products SET sku = UPPER(COALESCE(slug, name, 'PROD')) WHERE sku IS NULL"))
        if "barcode" not in table_columns["products"]:
            conn.execute(text("ALTER TABLE products ADD COLUMN barcode VARCHAR(120)"))
            conn.execute(text("UPDATE products SET barcode = COALESCE(sku, UPPER(COALESCE(slug, name, 'PROD'))) WHERE barcode IS NULL"))
        if "barcode_type" not in table_columns["products"]:
            conn.execute(text("ALTER TABLE products ADD COLUMN barcode_type VARCHAR(20)"))
            conn.execute(text("UPDATE products SET barcode_type = 'code128' WHERE barcode_type IS NULL"))
        if "external_barcode" not in table_columns["products"]:
            conn.execute(text("ALTER TABLE products ADD COLUMN external_barcode BOOLEAN"))
            conn.execute(text("UPDATE products SET external_barcode = 0 WHERE external_barcode IS NULL"))
        if "auto_generated" not in table_columns["products"]:
            conn.execute(text("ALTER TABLE products ADD COLUMN auto_generated BOOLEAN"))
            conn.execute(text("UPDATE products SET auto_generated = 1 WHERE auto_generated IS NULL"))
