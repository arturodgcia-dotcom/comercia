from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Coupon
from app.schemas.coupon import CouponCreate, CouponRead, CouponUpdate, CouponValidateRequest
from app.services.coupon_service import apply_coupon

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[CouponRead])
def list_coupons(tenant_id: int, db: Session = Depends(get_db)) -> list[Coupon]:
    return db.scalars(select(Coupon).where(Coupon.tenant_id == tenant_id).order_by(Coupon.id.desc())).all()


@router.post("", response_model=CouponRead, status_code=status.HTTP_201_CREATED)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db)) -> Coupon:
    coupon = Coupon(**payload.model_dump())
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.put("/{coupon_id}", response_model=CouponRead)
def update_coupon(coupon_id: int, payload: CouponUpdate, db: Session = Depends(get_db)) -> Coupon:
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="cupon no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(coupon, key, value)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.post("/validate")
def validate_coupon(payload: CouponValidateRequest, db: Session = Depends(get_db)) -> dict:
    try:
        result = apply_coupon(
            db,
            code=payload.code,
            tenant_id=payload.tenant_id,
            order_total=Decimal(payload.order_total),
            applies_to=payload.applies_to,
        )
        coupon = result["coupon"]
        return {"valid": True, "coupon_id": coupon.id, "discount_amount": result["discount_amount"]}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
