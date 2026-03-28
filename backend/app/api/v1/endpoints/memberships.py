from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import MembershipPlan
from app.schemas.membership import MembershipPlanCreate, MembershipPlanRead, MembershipPlanUpdate

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[MembershipPlanRead])
def list_memberships(tenant_id: int, db: Session = Depends(get_db)) -> list[MembershipPlan]:
    return db.scalars(select(MembershipPlan).where(MembershipPlan.tenant_id == tenant_id).order_by(MembershipPlan.id.desc())).all()


@router.post("", response_model=MembershipPlanRead, status_code=status.HTTP_201_CREATED)
def create_membership(payload: MembershipPlanCreate, db: Session = Depends(get_db)) -> MembershipPlan:
    membership = MembershipPlan(**payload.model_dump())
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.put("/{membership_id}", response_model=MembershipPlanRead)
def update_membership(membership_id: int, payload: MembershipPlanUpdate, db: Session = Depends(get_db)) -> MembershipPlan:
    membership = db.get(MembershipPlan, membership_id)
    if not membership:
        raise HTTPException(status_code=404, detail="membership no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(membership, key, value)
    db.commit()
    db.refresh(membership)
    return membership
