from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import LoyaltyProgram
from app.schemas.loyalty import (
    LoyaltyAccountRead,
    LoyaltyApplyPointsRequest,
    LoyaltyPointsResult,
    LoyaltyProgramRead,
    LoyaltyProgramUpsert,
)
from app.services.loyalty_service import compute_discount_from_points, get_or_create_loyalty_account

router = APIRouter()


@router.get("/program/{tenant_id}", response_model=LoyaltyProgramRead)
def get_program(tenant_id: int, db: Session = Depends(get_db)) -> LoyaltyProgram:
    program = db.scalar(select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id))
    if not program:
        raise HTTPException(status_code=404, detail="programa no encontrado")
    return program


@router.post("/program/{tenant_id}", response_model=LoyaltyProgramRead, status_code=status.HTTP_201_CREATED)
def create_program(tenant_id: int, payload: LoyaltyProgramUpsert, db: Session = Depends(get_db)) -> LoyaltyProgram:
    exists = db.scalar(select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id))
    if exists:
        raise HTTPException(status_code=409, detail="programa ya existe")
    program = LoyaltyProgram(tenant_id=tenant_id, **payload.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/program/{tenant_id}", response_model=LoyaltyProgramRead)
def update_program(tenant_id: int, payload: LoyaltyProgramUpsert, db: Session = Depends(get_db)) -> LoyaltyProgram:
    program = db.scalar(select(LoyaltyProgram).where(LoyaltyProgram.tenant_id == tenant_id))
    if not program:
        program = LoyaltyProgram(tenant_id=tenant_id)
        db.add(program)
    for key, value in payload.model_dump().items():
        setattr(program, key, value)
    db.commit()
    db.refresh(program)
    return program


@router.get("/account/{tenant_id}/{customer_id}", response_model=LoyaltyAccountRead)
def get_account(tenant_id: int, customer_id: int, db: Session = Depends(get_db)):
    return get_or_create_loyalty_account(db, customer_id=customer_id, tenant_id=tenant_id)


@router.post("/account/{tenant_id}/{customer_id}/apply-points", response_model=LoyaltyPointsResult)
def apply_points_preview(
    tenant_id: int,
    customer_id: int,
    payload: LoyaltyApplyPointsRequest,
    db: Session = Depends(get_db),
) -> LoyaltyPointsResult:
    result = compute_discount_from_points(
        db,
        customer_id=customer_id,
        tenant_id=tenant_id,
        order_total=Decimal(payload.order_total),
    )
    return LoyaltyPointsResult(**result)
