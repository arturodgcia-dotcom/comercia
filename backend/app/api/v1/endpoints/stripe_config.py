from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import StripeConfig, Tenant, User
from app.schemas.stripe_config import StripeConfigCreate, StripeConfigRead

router = APIRouter()


@router.get("", response_model=list[StripeConfigRead])
def list_stripe_configs(db: Session = Depends(get_db)) -> list[StripeConfig]:
    return db.scalars(select(StripeConfig).order_by(StripeConfig.id.desc())).all()


@router.get("/{tenant_id}", response_model=StripeConfigRead)
def get_stripe_config_by_tenant(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> StripeConfig:
    config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == tenant_id))
    if not config:
        raise HTTPException(status_code=404, detail="configuracion Stripe no encontrada")
    return config


@router.post("", response_model=StripeConfigRead, status_code=status.HTTP_201_CREATED)
def upsert_stripe_config(
    payload: StripeConfigCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> StripeConfig:
    tenant = db.get(Tenant, payload.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    config = db.scalar(select(StripeConfig).where(StripeConfig.tenant_id == payload.tenant_id))
    if config:
        for key, value in payload.model_dump().items():
            setattr(config, key, value)
        db.commit()
        db.refresh(config)
        return config

    config = StripeConfig(**payload.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config
