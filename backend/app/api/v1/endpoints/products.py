import json
import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import CatalogImportJob, Category, Product, StorefrontConfig, Tenant, User
from app.schemas.product import (
    CatalogBulkImportRequest,
    CatalogBulkImportResult,
    CatalogImportErrorRow,
    CatalogImportJobRead,
    ProductCreate,
    ProductRead,
    ProductUpdate,
)
from app.services.commercial_account_guard_service import enforce_product_limit_for_tenant

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


@router.get("/bulk-import/tenant/{tenant_id}/latest", response_model=CatalogImportJobRead | None)
def get_latest_catalog_import_job(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CatalogImportJobRead | None:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_access(current_user, tenant_id)
    latest = db.scalar(
        select(CatalogImportJob)
        .where(CatalogImportJob.tenant_id == tenant_id)
        .order_by(CatalogImportJob.created_at.desc(), CatalogImportJob.id.desc())
    )
    if not latest:
        return None
    return _to_catalog_job_read(latest)


@router.post("/bulk-import", response_model=CatalogBulkImportResult, status_code=status.HTTP_201_CREATED)
def bulk_import_catalog(
    payload: CatalogBulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CatalogBulkImportResult:
    tenant = _tenant_or_404(db, payload.tenant_id)
    _ensure_tenant_access(current_user, tenant.id)

    category_by_slug: dict[str, Category] = {
        row.slug: row
        for row in db.scalars(select(Category).where(Category.tenant_id == tenant.id)).all()
    }
    product_by_slug: dict[str, Product] = {
        row.slug: row
        for row in db.scalars(select(Product).where(Product.tenant_id == tenant.id)).all()
    }

    errors: list[CatalogImportErrorRow] = []
    valid_rows = 0
    categories_created = 0
    products_created = 0
    products_updated = 0

    for index, row in enumerate(payload.rows, start=1):
        if not row.nombre.strip():
            errors.append(CatalogImportErrorRow(index=index, reason="Falta nombre"))
            continue
        if not row.sku.strip():
            errors.append(CatalogImportErrorRow(index=index, reason="Falta SKU"))
            continue
        if row.precio_publico is None:
            errors.append(CatalogImportErrorRow(index=index, reason="precio_publico invalido"))
            continue

        category_slug = _slugify(row.categoria)
        if not category_slug:
            errors.append(CatalogImportErrorRow(index=index, reason="Categoria invalida"))
            continue

        category = category_by_slug.get(category_slug)
        if not category:
            category = Category(
                tenant_id=tenant.id,
                name=row.categoria.strip(),
                slug=category_slug,
                is_active=True,
            )
            db.add(category)
            db.flush()
            category_by_slug[category_slug] = category
            categories_created += 1

        product_slug = _slugify(row.sku) or _slugify(row.nombre)
        if not product_slug:
            errors.append(CatalogImportErrorRow(index=index, reason="No se pudo generar slug del producto"))
            continue
        product = product_by_slug.get(product_slug)
        is_active = _parse_yes_no(row.visible_publico) or _parse_yes_no(row.visible_distribuidor)

        if product:
            product.category_id = category.id
            product.name = row.nombre.strip()
            product.description = row.descripcion
            product.price_public = row.precio_publico
            product.price_retail = row.precio_menudeo
            product.price_wholesale = row.precio_mayoreo
            product.stripe_product_id = row.stripe_product_id
            product.stripe_price_id_public = row.stripe_price_id_publico
            product.stripe_price_id_retail = row.stripe_price_id_menudeo
            product.stripe_price_id_wholesale = row.stripe_price_id_mayoreo
            product.is_active = is_active
            products_updated += 1
        else:
            product = Product(
                tenant_id=tenant.id,
                category_id=category.id,
                name=row.nombre.strip(),
                slug=product_slug,
                description=row.descripcion,
                price_public=row.precio_publico,
                price_retail=row.precio_menudeo,
                price_wholesale=row.precio_mayoreo,
                stripe_product_id=row.stripe_product_id,
                stripe_price_id_public=row.stripe_price_id_publico,
                stripe_price_id_retail=row.stripe_price_id_menudeo,
                stripe_price_id_wholesale=row.stripe_price_id_mayoreo,
                is_active=is_active,
                is_featured=False,
            )
            db.add(product)
            db.flush()
            product_by_slug[product.slug] = product
            products_created += 1

        valid_rows += 1

    total_rows = len(payload.rows)
    error_rows = len(errors)
    status_value = "completed" if error_rows == 0 else "partial"
    job = CatalogImportJob(
        tenant_id=tenant.id,
        source="csv_manual",
        total_rows=total_rows,
        valid_rows=valid_rows,
        error_rows=error_rows,
        categories_created=categories_created,
        products_created=products_created,
        products_updated=products_updated,
        status=status_value,
        notes=f"Importacion ejecutada {datetime.utcnow().isoformat()}",
    )
    db.add(job)

    _sync_brand_setup_ecommerce_state(
        db=db,
        tenant_id=tenant.id,
        categories_count=len(category_by_slug),
        catalog_items_count=len(product_by_slug),
    )

    db.commit()
    db.refresh(job)

    return CatalogBulkImportResult(
        tenant_id=tenant.id,
        job=_to_catalog_job_read(job),
        errors=errors,
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    _tenant_or_404(db, payload.tenant_id)
    _validate_category_belongs_to_tenant(db, payload.tenant_id, payload.category_id)
    try:
        enforce_product_limit_for_tenant(db, payload.tenant_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
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


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned


def _parse_yes_no(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"si", "sí", "true", "1", "yes", "y"}


def _ensure_tenant_access(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.role in {"tenant_admin", "tenant_staff"} and current_user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=403, detail="Sin permisos para esta marca")


def _to_catalog_job_read(job: CatalogImportJob) -> CatalogImportJobRead:
    return CatalogImportJobRead(
        id=job.id,
        tenant_id=job.tenant_id,
        source=job.source,
        total_rows=job.total_rows,
        valid_rows=job.valid_rows,
        error_rows=job.error_rows,
        categories_created=job.categories_created,
        products_created=job.products_created,
        products_updated=job.products_updated,
        status=job.status,
        notes=job.notes,
        created_at=job.created_at.isoformat(),
    )


def _sync_brand_setup_ecommerce_state(
    *,
    db: Session,
    tenant_id: int,
    categories_count: int,
    catalog_items_count: int,
) -> None:
    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    if not config:
        return
    payload: dict = {}
    if config.config_json:
        try:
            payload = json.loads(config.config_json)
        except json.JSONDecodeError:
            payload = {}
    ecommerce_data = dict(payload.get("ecommerce_data", {}))
    ecommerce_data["categories_ready"] = categories_count > 0
    ecommerce_data["products_ready"] = catalog_items_count > 0
    ecommerce_data["massive_upload_enabled"] = True
    payload["ecommerce_data"] = ecommerce_data

    workflow = payload.get("workflow")
    if isinstance(workflow, dict):
        steps = workflow.get("steps")
        if isinstance(steps, list):
            for step in steps:
                if not isinstance(step, dict) or step.get("code") != "ecommerce_setup":
                    continue
                if step.get("approved"):
                    break
                step["status"] = "in_progress" if categories_count > 0 or catalog_items_count > 0 else "pending"
                break
    config.config_json = json.dumps(payload, ensure_ascii=False)
    db.add(config)
