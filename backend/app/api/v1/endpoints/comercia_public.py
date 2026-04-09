from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import Depends

from app.db.session import get_db
from app.models.models import SalesCommissionAgent
from app.schemas.customer_contact import CustomerContactLeadCreate, CustomerContactLeadRead
from app.schemas.marketing_prospects import MarketingProspectCreate, MarketingProspectRead
from app.schemas.commission_agents import PlanPurchaseLeadCreate, PlanPurchaseLeadRead
from app.services.commission_agents_service import register_plan_purchase_lead
from app.services.customer_contact_service import create_customer_contact_lead
from app.services.marketing_prospects_service import create_marketing_prospect
from app.services.security_hooks import on_referral_validation_failed

router = APIRouter()


@router.get("/referral/{code}")
def validate_referral_code(code: str, request: Request, db: Session = Depends(get_db)):
    normalized = code.strip().upper()
    agent = db.scalar(
        select(SalesCommissionAgent).where(SalesCommissionAgent.code == normalized, SalesCommissionAgent.is_active.is_(True))
    )
    if not agent:
        source_ip = request.client.host if request.client else None
        on_referral_validation_failed(db, code=normalized, source_ip=source_ip)
        return {"valid": False, "code": normalized}
    return {"valid": True, "code": agent.code, "agent_name": agent.full_name}


@router.post("/plan-purchase-leads", response_model=PlanPurchaseLeadRead)
def create_plan_purchase_lead(payload: PlanPurchaseLeadCreate, db: Session = Depends(get_db)):
    return register_plan_purchase_lead(db, **payload.model_dump())


@router.post("/customer-contact-leads", response_model=CustomerContactLeadRead)
def create_customer_contact(payload: CustomerContactLeadCreate, db: Session = Depends(get_db)):
    return create_customer_contact_lead(db, **payload.model_dump())


@router.post("/marketing-prospects", response_model=MarketingProspectRead)
def create_public_marketing_prospect(payload: MarketingProspectCreate, db: Session = Depends(get_db)):
    return create_marketing_prospect(db, payload)
