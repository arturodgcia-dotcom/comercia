from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Tenant, TenantBranding
from app.schemas.tenant_branding import TenantBrandingRead, TenantBrandingUpsert

router = APIRouter()


@router.get("/{tenant_id}", response_model=TenantBrandingRead)
def get_branding(tenant_id: int, db: Session = Depends(get_db)) -> TenantBranding:
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    if not branding:
        raise HTTPException(status_code=404, detail="branding no encontrado")
    return branding


@router.post("/{tenant_id}", response_model=TenantBrandingRead, status_code=status.HTTP_201_CREATED)
def create_branding(tenant_id: int, payload: TenantBrandingUpsert, db: Session = Depends(get_db)) -> TenantBranding:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    existing = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    if existing:
        raise HTTPException(status_code=409, detail="branding ya existe, usa PUT")

    branding = TenantBranding(tenant_id=tenant_id, **payload.model_dump())
    db.add(branding)
    db.commit()
    db.refresh(branding)
    return branding


@router.put("/{tenant_id}", response_model=TenantBrandingRead)
def update_branding(tenant_id: int, payload: TenantBrandingUpsert, db: Session = Depends(get_db)) -> TenantBranding:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant_id))
    if not branding:
        branding = TenantBranding(tenant_id=tenant_id)
        db.add(branding)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(branding, key, value)

    db.commit()
    db.refresh(branding)
    return branding
