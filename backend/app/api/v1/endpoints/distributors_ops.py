from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import DistributorApplication, DistributorEmployee, DistributorProfile
from app.schemas.distributor_ops import (
    DistributorApplicationCreate,
    DistributorApplicationRead,
    DistributorApplicationStatus,
    DistributorEmployeeCreate,
    DistributorEmployeeRead,
    DistributorProfileRead,
)
from app.services.distributor_service import add_distributor_employee, approve_application, create_application, reject_application

router = APIRouter()


@router.post("/applications", response_model=DistributorApplicationRead)
def create_distributor_application(payload: DistributorApplicationCreate, db: Session = Depends(get_db)):
    return create_application(db, **payload.model_dump())


@router.get("/applications/by-tenant/{tenant_id}", response_model=list[DistributorApplicationRead])
def list_distributor_applications(tenant_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(DistributorApplication).where(DistributorApplication.tenant_id == tenant_id).order_by(DistributorApplication.id.desc())
    ).all()


@router.put("/applications/{application_id}/approve", response_model=DistributorProfileRead)
def approve_distributor_application(application_id: int, payload: DistributorApplicationStatus, db: Session = Depends(get_db)):
    application = db.get(DistributorApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="solicitud no encontrada")
    return approve_application(db, application, notes=payload.notes)


@router.put("/applications/{application_id}/reject", response_model=DistributorApplicationRead)
def reject_distributor_application(application_id: int, payload: DistributorApplicationStatus, db: Session = Depends(get_db)):
    application = db.get(DistributorApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="solicitud no encontrada")
    return reject_application(db, application, notes=payload.notes)


@router.get("/by-tenant/{tenant_id}", response_model=list[DistributorProfileRead])
def list_distributors_by_tenant(tenant_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(DistributorProfile).where(DistributorProfile.tenant_id == tenant_id).order_by(DistributorProfile.id.desc())
    ).all()


@router.post("/employees", response_model=DistributorEmployeeRead)
def create_distributor_employee(payload: DistributorEmployeeCreate, db: Session = Depends(get_db)):
    return add_distributor_employee(db, **payload.model_dump())


@router.get("/employees/{distributor_profile_id}", response_model=list[DistributorEmployeeRead])
def list_distributor_employees(distributor_profile_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(DistributorEmployee)
        .where(DistributorEmployee.distributor_profile_id == distributor_profile_id)
        .order_by(DistributorEmployee.id.desc())
    ).all()
