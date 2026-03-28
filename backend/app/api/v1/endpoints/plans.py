from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Plan
from app.schemas.plan import PlanRead

router = APIRouter()


@router.get("", response_model=list[PlanRead])
def list_plans(db: Session = Depends(get_db)) -> list[Plan]:
    return db.scalars(select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.id.asc())).all()
