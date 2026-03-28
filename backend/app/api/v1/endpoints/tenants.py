from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Tenant
from app.schemas.tenant import TenantCreate, TenantRead

router = APIRouter()


@router.get("", response_model=list[TenantRead])
def list_tenants(db: Session = Depends(get_db)) -> list[Tenant]:
    return db.scalars(select(Tenant).order_by(Tenant.id.desc())).all()


@router.post("", response_model=TenantRead, status_code=status.HTTP_201_CREATED)
def create_tenant(payload: TenantCreate, db: Session = Depends(get_db)) -> Tenant:
    exists = db.scalar(
        select(Tenant).where((Tenant.slug == payload.slug) | (Tenant.subdomain == payload.subdomain))
    )
    if exists:
        raise HTTPException(status_code=400, detail="slug o subdomain ya existen")

    tenant = Tenant(**payload.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant
