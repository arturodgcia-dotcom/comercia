from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import WishlistItem
from app.schemas.wishlist import WishlistCreate, WishlistRead

router = APIRouter()


@router.get("/{tenant_id}/{customer_id}", response_model=list[WishlistRead])
def list_wishlist(tenant_id: int, customer_id: int, db: Session = Depends(get_db)) -> list[WishlistItem]:
    return db.scalars(
        select(WishlistItem)
        .where(WishlistItem.tenant_id == tenant_id, WishlistItem.customer_id == customer_id)
        .order_by(WishlistItem.id.desc())
    ).all()


@router.post("", response_model=WishlistRead, status_code=status.HTTP_201_CREATED)
def create_wishlist_item(payload: WishlistCreate, db: Session = Depends(get_db)) -> WishlistItem:
    existing = db.scalar(
        select(WishlistItem).where(
            WishlistItem.tenant_id == payload.tenant_id,
            WishlistItem.customer_id == payload.customer_id,
            WishlistItem.product_id == payload.product_id,
        )
    )
    if existing:
        return existing
    row = WishlistItem(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{wishlist_id}")
def delete_wishlist_item(wishlist_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.get(WishlistItem, wishlist_id)
    if not row:
        raise HTTPException(status_code=404, detail="wishlist item no encontrado")
    db.delete(row)
    db.commit()
    return {"deleted": True}
