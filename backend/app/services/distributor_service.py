from datetime import datetime

from sqlalchemy.orm import Session

from app.models.models import (
    DistributorApplication,
    DistributorEmployee,
    DistributorProfile,
)


def create_application(db: Session, **values) -> DistributorApplication:
    row = DistributorApplication(status="pending", **values)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def approve_application(db: Session, application: DistributorApplication, notes: str | None = None) -> DistributorProfile:
    application.status = "approved"
    if notes:
        application.notes = notes
    profile = DistributorProfile(
        tenant_id=application.tenant_id,
        distributor_application_id=application.id,
        business_name=application.company_name,
        contact_name=application.contact_name,
        email=application.email,
        phone=application.phone,
        is_authorized=True,
        authorization_date=datetime.utcnow(),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def reject_application(db: Session, application: DistributorApplication, notes: str | None = None) -> DistributorApplication:
    application.status = "rejected"
    application.notes = notes
    db.commit()
    db.refresh(application)
    return application


def create_distributor_profile(db: Session, **values) -> DistributorProfile:
    profile = DistributorProfile(**values)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def add_distributor_employee(db: Session, **values) -> DistributorEmployee:
    employee = DistributorEmployee(**values)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee
