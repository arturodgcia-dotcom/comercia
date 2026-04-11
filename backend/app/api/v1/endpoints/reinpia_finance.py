from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_finance_view_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import CommissionAgentSettlement, User
from app.models.models import CommercialClientAccount, SalesCommissionAgent
from app.schemas.commercial_accounts import CommercialClientAccountRead
from app.schemas.commission_agents import SalesCommissionAgentRead
from app.schemas.finance import (
    CommissionSettlementCreate,
    CommissionSettlementRead,
    FinanceDashboardResponse,
)
from app.services.analytics_service import get_tenants_summary
from app.services.commission_agents_service import get_agent_sales_summary
from app.services.finance_service import get_finance_dashboard


router = APIRouter(prefix="/reinpia-finance", tags=["reinpia-finance"])


@router.get("/dashboard", response_model=FinanceDashboardResponse, dependencies=[Depends(get_finance_view_user)])
def finance_dashboard(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    tenant_id: int | None = None,
    commercial_client_account_id: int | None = None,
    commission_agent_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_finance_dashboard(
        db,
        date_from=date_from,
        date_to=date_to,
        tenant_id=tenant_id,
        commercial_client_account_id=commercial_client_account_id,
        commission_agent_id=commission_agent_id,
    )


@router.post("/settlements", response_model=CommissionSettlementRead, dependencies=[Depends(get_reinpia_admin)])
def create_finance_settlement(
    payload: CommissionSettlementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_reinpia_admin),
):
    row = CommissionAgentSettlement(
        commission_agent_id=payload.commission_agent_id,
        amount_paid=payload.amount_paid,
        tenant_id=payload.tenant_id,
        commercial_client_account_id=payload.commercial_client_account_id,
        period_from=payload.period_from,
        period_to=payload.period_to,
        paid_at=payload.paid_at or datetime.utcnow(),
        notes=payload.notes,
        created_by_user_id=current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/tenants/summary", dependencies=[Depends(get_finance_view_user)])
def finance_tenants_summary(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    status: str | None = None,
    plan_id: int | None = None,
    business_type: str | None = None,
    db: Session = Depends(get_db),
):
    return get_tenants_summary(
        db,
        date_from=date_from,
        date_to=date_to,
        status=status,
        plan_id=plan_id,
        business_type=business_type,
    )


@router.get("/commercial-client-accounts", response_model=list[CommercialClientAccountRead], dependencies=[Depends(get_finance_view_user)])
def finance_commercial_accounts(db: Session = Depends(get_db)):
    return db.scalars(select(CommercialClientAccount).order_by(CommercialClientAccount.id.desc())).all()


@router.get("/commission-agents", response_model=list[SalesCommissionAgentRead], dependencies=[Depends(get_finance_view_user)])
def finance_commission_agents(db: Session = Depends(get_db)):
    return db.scalars(select(SalesCommissionAgent).order_by(SalesCommissionAgent.id.desc())).all()


@router.get("/commission-agents/{agent_id}/summary", dependencies=[Depends(get_finance_view_user)])
def finance_commission_agent_summary(
    agent_id: int,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
):
    return get_agent_sales_summary(db, agent_id=agent_id, date_from=date_from, date_to=date_to)
