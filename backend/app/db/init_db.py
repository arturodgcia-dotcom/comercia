from app.core.config import get_settings
from app.db.reset_demo import reset_demo_data
from app.db.seed_app_base import seed_app_base
from app.db.seed_demo import seed_demo_data
from app.db.session import SessionLocal, engine
from app.models.models import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
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
