from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import TimestampSchema


class ProductCreate(BaseModel):
    tenant_id: int
    category_id: int | None = None
    name: str
    slug: str
    description: str | None = None
    price_public: Decimal
    price_wholesale: Decimal | None = None
    price_retail: Decimal | None = None
    stripe_product_id: str | None = None
    stripe_price_id_public: str | None = None
    stripe_price_id_retail: str | None = None
    stripe_price_id_wholesale: str | None = None
    is_featured: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    price_public: Decimal | None = None
    price_wholesale: Decimal | None = None
    price_retail: Decimal | None = None
    stripe_product_id: str | None = None
    stripe_price_id_public: str | None = None
    stripe_price_id_retail: str | None = None
    stripe_price_id_wholesale: str | None = None
    is_featured: bool | None = None
    is_active: bool | None = None


class ProductRead(TimestampSchema):
    id: int
    tenant_id: int
    category_id: int | None
    name: str
    slug: str
    description: str | None
    price_public: Decimal
    price_wholesale: Decimal | None
    price_retail: Decimal | None
    stripe_product_id: str | None
    stripe_price_id_public: str | None
    stripe_price_id_retail: str | None
    stripe_price_id_wholesale: str | None
    is_featured: bool
    is_active: bool


class CatalogImportRow(BaseModel):
    nombre: str
    descripcion: str | None = None
    categoria: str
    sku: str
    precio_publico: Decimal
    precio_menudeo: Decimal | None = None
    precio_mayoreo: Decimal | None = None
    stock_general: int | None = None
    visible_publico: str = "si"
    visible_distribuidor: str = "si"
    disponible_en_linea: str = "si"
    disponible_fisico: str = "si"
    minimo_menudeo: int | None = None
    minimo_mayoreo: int | None = None
    stripe_product_id: str | None = None
    stripe_price_id_publico: str | None = None
    stripe_price_id_menudeo: str | None = None
    stripe_price_id_mayoreo: str | None = None


class CatalogBulkImportRequest(BaseModel):
    tenant_id: int
    rows: list[CatalogImportRow]


class CatalogImportErrorRow(BaseModel):
    index: int
    reason: str


class CatalogImportJobRead(BaseModel):
    id: int
    tenant_id: int
    source: str
    total_rows: int
    valid_rows: int
    error_rows: int
    categories_created: int
    products_created: int
    products_updated: int
    status: str
    notes: str | None = None
    created_at: str


class CatalogBulkImportResult(BaseModel):
    tenant_id: int
    job: CatalogImportJobRead
    errors: list[CatalogImportErrorRow]
