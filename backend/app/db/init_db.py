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
        for table in ("tenants", "pos_sales"):
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

        if "commission_amount" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN commission_amount NUMERIC(12,2)"))
            conn.execute(text("UPDATE pos_sales SET commission_amount = 0 WHERE commission_amount IS NULL"))
        if "net_amount" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN net_amount NUMERIC(12,2)"))
            conn.execute(text("UPDATE pos_sales SET net_amount = total_amount WHERE net_amount IS NULL"))
        if "payment_mode" not in table_columns["pos_sales"]:
            conn.execute(text("ALTER TABLE pos_sales ADD COLUMN payment_mode VARCHAR(20)"))
            conn.execute(text("UPDATE pos_sales SET payment_mode = 'subscription' WHERE payment_mode IS NULL"))
