from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Category
from app.schemas.category import CategoryCreate, CategoryRead

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db), tenant_id: int | None = None) -> list[Category]:
    query = select(Category).order_by(Category.id.desc())
    if tenant_id is not None:
        query = query.where(Category.tenant_id == tenant_id)
    return db.scalars(query).all()


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
