from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Product
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db), tenant_id: int | None = None) -> list[Product]:
    query = select(Product).order_by(Product.id.desc())
    if tenant_id is not None:
        query = query.where(Product.tenant_id == tenant_id)
    return db.scalars(query).all()


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
