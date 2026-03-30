from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ProductReview
from app.schemas.review import ProductReviewCreate, ProductReviewRead

router = APIRouter()


@router.get("/product/{product_id}", response_model=list[ProductReviewRead])
def list_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    include_unapproved: bool = False,
    moderation_status: str | None = None,
):
    query = select(ProductReview).where(ProductReview.product_id == product_id)
    if moderation_status:
        query = query.where(ProductReview.moderation_status == moderation_status)
    if not include_unapproved:
        query = query.where(ProductReview.moderation_status == "approved")
    return db.scalars(query.order_by(ProductReview.id.desc())).all()


@router.post("", response_model=ProductReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(payload: ProductReviewCreate, db: Session = Depends(get_db)):
    row = ProductReview(**payload.model_dump(), moderation_status="pending", is_approved=False)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{review_id}/approve", response_model=ProductReviewRead)
def approve_review(review_id: int, db: Session = Depends(get_db)):
    row = db.get(ProductReview, review_id)
    if not row:
        raise HTTPException(status_code=404, detail="review no encontrada")
    row.moderation_status = "approved"
    row.is_approved = True
    db.commit()
    db.refresh(row)
    return row


@router.put("/{review_id}/reject", response_model=ProductReviewRead)
def reject_review(review_id: int, db: Session = Depends(get_db)):
    row = db.get(ProductReview, review_id)
    if not row:
        raise HTTPException(status_code=404, detail="review no encontrada")
    row.moderation_status = "rejected"
    row.is_approved = False
    db.commit()
    db.refresh(row)
    return row
