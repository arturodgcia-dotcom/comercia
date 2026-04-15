from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ContractTemplate, SignedContract
from app.schemas.contracts import (
    ContractTemplateCreate,
    ContractTemplateRead,
    ContractTemplateUpdate,
    SignedContractCreate,
    SignedContractRead,
)
from app.services.contract_service import create_default_distributor_contract_template, sign_contract
from app.services.notifications_service import send_email_notification

router = APIRouter()


@router.get("/templates/{tenant_id}", response_model=list[ContractTemplateRead])
def list_templates(tenant_id: int, db: Session = Depends(get_db)):
    templates = db.scalars(
        select(ContractTemplate)
        .where((ContractTemplate.tenant_id == tenant_id) | (ContractTemplate.tenant_id.is_(None)))
        .order_by(ContractTemplate.id.desc())
    ).all()
    if not templates:
        templates = [create_default_distributor_contract_template(db, tenant_id=tenant_id)]
    return templates


@router.post("/templates", response_model=ContractTemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(payload: ContractTemplateCreate, db: Session = Depends(get_db)):
    row = ContractTemplate(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/templates/{template_id}", response_model=ContractTemplateRead)
def update_template(template_id: int, payload: ContractTemplateUpdate, db: Session = Depends(get_db)):
    row = db.get(ContractTemplate, template_id)
    if not row:
        raise HTTPException(status_code=404, detail="template no encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.post("/sign", response_model=SignedContractRead, status_code=status.HTTP_201_CREATED)
def sign(payload: SignedContractCreate, db: Session = Depends(get_db)):
    if not payload.accept_terms:
        raise HTTPException(status_code=400, detail="debes aceptar el contrato")
    signed = sign_contract(db, **payload.model_dump(exclude={"accept_terms"}))
    send_email_notification(
        payload.signed_by_email,
        "Copia de contrato firmado",
        f"Tu contrato fue firmado y autorizado. Folio: {signed.id}. Fecha: {signed.signed_at.isoformat()}",
    )
    return signed


@router.get("/signed/by-tenant/{tenant_id}", response_model=list[SignedContractRead])
def list_signed(tenant_id: int, db: Session = Depends(get_db)):
    return db.scalars(select(SignedContract).where(SignedContract.tenant_id == tenant_id).order_by(SignedContract.id.desc())).all()
