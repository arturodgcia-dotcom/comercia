from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Order
from app.schemas.checkout import PaymentDashboardResponse

router = APIRouter()


@router.get("/dashboard", response_model=PaymentDashboardResponse)
def payments_dashboard(tenant_id: int | None = None, db: Session = Depends(get_db)) -> PaymentDashboardResponse:
    query = select(Order).order_by(Order.id.desc())
    if tenant_id is not None:
        query = query.where(Order.tenant_id == tenant_id)
    orders = db.scalars(query).all()
    total_sold = sum((Decimal(order.total_amount) for order in orders), Decimal("0"))
    total_commission = sum((Decimal(order.commission_amount) for order in orders), Decimal("0"))
    total_net = sum((Decimal(order.net_amount) for order in orders), Decimal("0"))
    return PaymentDashboardResponse(
        orders=orders,
        total_sold=total_sold,
        total_commission=total_commission,
        total_net=total_net,
    )
