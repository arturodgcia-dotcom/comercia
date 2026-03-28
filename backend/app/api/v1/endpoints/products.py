from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Category, Product, Tenant
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db), tenant_id: int | None = None) -> list[Product]:
    query = select(Product).order_by(Product.id.desc())
    if tenant_id is not None:
        query = query.where(Product.tenant_id == tenant_id)
    return db.scalars(query).all()


@router.get("/by-tenant/{tenant_id}", response_model=list[ProductRead])
def list_products_by_tenant(tenant_id: int, db: Session = Depends(get_db)) -> list[Product]:
    _tenant_or_404(db, tenant_id)
    return db.scalars(select(Product).where(Product.tenant_id == tenant_id).order_by(Product.id.desc())).all()


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    _tenant_or_404(db, payload.tenant_id)
    _validate_category_belongs_to_tenant(db, payload.tenant_id, payload.category_id)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="producto no encontrado")

    incoming = payload.model_dump(exclude_unset=True)
    if "category_id" in incoming:
        _validate_category_belongs_to_tenant(db, product.tenant_id, incoming["category_id"])

    for key, value in incoming.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def _tenant_or_404(db: Session, tenant_id: int) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    return tenant


def _validate_category_belongs_to_tenant(db: Session, tenant_id: int, category_id: int | None) -> None:
    if category_id is None:
        return
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="categoria no encontrada")
    if category.tenant_id != tenant_id:
        raise HTTPException(status_code=400, detail="categoria no pertenece al tenant indicado")
