from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import DistributorApplication, DistributorEmployee, DistributorProfile, PosEmployee, PosSale, User
from app.schemas.distributor_ops import (
    DistributorApplicationCreate,
    DistributorApplicationRead,
    DistributorApplicationStatus,
    DistributorEmployeeCreate,
    DistributorEmployeeRead,
    DistributorProfileAuthorize,
    DistributorProfileCreate,
    DistributorProfileRead,
    DistributorProfileSummaryRead,
)
from app.services.distributor_service import (
    add_distributor_employee,
    approve_application,
    create_application,
    create_distributor_profile,
    reject_application,
)

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


@router.post("/profiles", response_model=DistributorProfileRead)
def create_profile(payload: DistributorProfileCreate, db: Session = Depends(get_db)):
    values = payload.model_dump()
    if values.get("is_authorized"):
        values["authorization_date"] = datetime.utcnow()
    return create_distributor_profile(db, **values)


@router.put("/profiles/{profile_id}/authorize", response_model=DistributorProfileRead)
def authorize_profile(profile_id: int, _: DistributorProfileAuthorize, db: Session = Depends(get_db)):
    profile = db.get(DistributorProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="distribuidor no encontrado")
    profile.is_authorized = True
    profile.authorization_date = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/summary/by-tenant/{tenant_id}", response_model=list[DistributorProfileSummaryRead])
def distributor_summary_by_tenant(tenant_id: int, db: Session = Depends(get_db)):
    profiles = db.scalars(
        select(DistributorProfile).where(DistributorProfile.tenant_id == tenant_id).order_by(DistributorProfile.id.desc())
    ).all()
    if not profiles:
        return []

    profile_ids = [row.id for row in profiles]
    employees_rows = db.execute(
        select(DistributorEmployee.distributor_profile_id, func.count(DistributorEmployee.id))
        .where(DistributorEmployee.distributor_profile_id.in_(profile_ids))
        .group_by(DistributorEmployee.distributor_profile_id)
    ).all()
    employees_map = {int(profile_id): int(count) for profile_id, count in employees_rows}

    sales_rows = db.execute(
        select(
            PosEmployee.distributor_profile_id,
            func.count(PosSale.id),
            func.coalesce(func.sum(PosSale.total_amount), 0),
        )
        .join(PosSale, PosSale.employee_id == PosEmployee.id)
        .where(
            PosEmployee.tenant_id == tenant_id,
            PosEmployee.distributor_profile_id.is_not(None),
            PosEmployee.distributor_profile_id.in_(profile_ids),
        )
        .group_by(PosEmployee.distributor_profile_id)
    ).all()
    sales_map = {
        int(profile_id): {"count": int(count), "total": float(total or 0)}
        for profile_id, count, total in sales_rows
    }

    tenant_distributor_users = db.scalars(
        select(User).where(User.tenant_id == tenant_id, User.role == "distributor_user")
    ).all()
    users_by_email = {str(user.email).strip().lower() for user in tenant_distributor_users}
    employees_by_profile = db.scalars(
        select(DistributorEmployee).where(DistributorEmployee.distributor_profile_id.in_(profile_ids))
    ).all()
    employee_email_map: dict[int, set[str]] = {}
    for row in employees_by_profile:
        employee_email_map.setdefault(int(row.distributor_profile_id), set()).add(str(row.email).strip().lower())

    response: list[DistributorProfileSummaryRead] = []
    for profile in profiles:
        profile_user_emails = set(employee_email_map.get(profile.id, set()))
        profile_user_emails.add(str(profile.email).strip().lower())
        distributor_users_count = len(profile_user_emails.intersection(users_by_email))
        sales_data = sales_map.get(profile.id, {"count": 0, "total": 0.0})
        response.append(
            DistributorProfileSummaryRead(
                distributor_profile_id=profile.id,
                tenant_id=profile.tenant_id,
                business_name=profile.business_name,
                contact_name=profile.contact_name,
                email=profile.email,
                is_authorized=profile.is_authorized,
                employees_count=employees_map.get(profile.id, 0),
                distributor_users_count=distributor_users_count,
                pos_sales_count=int(sales_data["count"]),
                pos_sales_total_mxn=float(sales_data["total"]),
            )
        )
    return response


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
