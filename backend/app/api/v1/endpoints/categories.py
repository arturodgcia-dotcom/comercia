from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Category, Tenant
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db), tenant_id: int | None = None) -> list[Category]:
    query = select(Category).order_by(Category.id.desc())
    if tenant_id is not None:
        query = query.where(Category.tenant_id == tenant_id)
    return db.scalars(query).all()


@router.get("/by-tenant/{tenant_id}", response_model=list[CategoryRead])
def list_categories_by_tenant(tenant_id: int, db: Session = Depends(get_db)) -> list[Category]:
    _tenant_or_404(db, tenant_id)
    return db.scalars(select(Category).where(Category.tenant_id == tenant_id).order_by(Category.id.desc())).all()


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    _tenant_or_404(db, payload.tenant_id)
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="categoria no encontrada")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def _tenant_or_404(db: Session, tenant_id: int) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    return tenant
