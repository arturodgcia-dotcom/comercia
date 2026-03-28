from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ServiceOffering
from app.schemas.service_offering import ServiceOfferingCreate, ServiceOfferingRead, ServiceOfferingUpdate

router = APIRouter()


@router.get("/by-tenant/{tenant_id}", response_model=list[ServiceOfferingRead])
def list_services(tenant_id: int, db: Session = Depends(get_db)) -> list[ServiceOffering]:
    return db.scalars(
        select(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id).order_by(ServiceOffering.id.desc())
    ).all()


@router.post("", response_model=ServiceOfferingRead, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceOfferingCreate, db: Session = Depends(get_db)) -> ServiceOffering:
    row = ServiceOffering(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{service_id}", response_model=ServiceOfferingRead)
def update_service(service_id: int, payload: ServiceOfferingUpdate, db: Session = Depends(get_db)) -> ServiceOffering:
    row = db.get(ServiceOffering, service_id)
    if not row:
        raise HTTPException(status_code=404, detail="servicio no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row
