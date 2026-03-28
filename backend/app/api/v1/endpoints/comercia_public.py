from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import Depends

from app.db.session import get_db
from app.models.models import SalesCommissionAgent
from app.schemas.commission_agents import PlanPurchaseLeadCreate, PlanPurchaseLeadRead
from app.services.commission_agents_service import register_plan_purchase_lead

router = APIRouter()


@router.get("/referral/{code}")
def validate_referral_code(code: str, db: Session = Depends(get_db)):
    normalized = code.strip().upper()
    agent = db.scalar(
        select(SalesCommissionAgent).where(SalesCommissionAgent.code == normalized, SalesCommissionAgent.is_active.is_(True))
    )
    if not agent:
        return {"valid": False, "code": normalized}
    return {"valid": True, "code": agent.code, "agent_name": agent.full_name}


@router.post("/plan-purchase-leads", response_model=PlanPurchaseLeadRead)
def create_plan_purchase_lead(payload: PlanPurchaseLeadCreate, db: Session = Depends(get_db)):
    return register_plan_purchase_lead(db, **payload.model_dump())

