from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import MercadoPagoSettings, Tenant, User
from app.schemas.mercadopago_settings import MercadoPagoSettingsRead, MercadoPagoSettingsUpsert

router = APIRouter()


@router.get("/{tenant_id}", response_model=MercadoPagoSettingsRead)
def get_mercadopago_settings(tenant_id: int, db: Session = Depends(get_db)):
    settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if settings:
        return settings
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    settings = MercadoPagoSettings(tenant_id=tenant_id, mercadopago_enabled=False)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/{tenant_id}", response_model=MercadoPagoSettingsRead, status_code=status.HTTP_201_CREATED)
def create_mercadopago_settings(
    tenant_id: int,
    payload: MercadoPagoSettingsUpsert,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")
    settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if settings:
        for key, value in payload.model_dump().items():
            setattr(settings, key, value)
        db.commit()
        db.refresh(settings)
        return settings
    settings = MercadoPagoSettings(tenant_id=tenant_id, **payload.model_dump())
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


@router.put("/{tenant_id}", response_model=MercadoPagoSettingsRead)
def update_mercadopago_settings(
    tenant_id: int,
    payload: MercadoPagoSettingsUpsert,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if not settings:
        raise HTTPException(status_code=404, detail="configuracion de Mercado Pago no encontrada")
    for key, value in payload.model_dump().items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
