from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import CustomerContactLead
from app.services.internal_alerts_service import create_followup_required_alert


def create_customer_contact_lead(
    db: Session,
    *,
    name: str,
    email: str,
    phone: str | None,
    company: str | None,
    contact_reason: str,
    message: str,
    channel: str = "customer_service_form",
    recommended_plan: str | None = None,
    status: str = "new",
) -> CustomerContactLead:
    lead = CustomerContactLead(
        name=name.strip(),
        email=email.strip().lower(),
        phone=phone.strip() if phone else None,
        company=company.strip() if company else None,
        contact_reason=contact_reason.strip().lower(),
        message=message.strip(),
        channel=channel.strip().lower() if channel else "customer_service_form",
        recommended_plan=recommended_plan.strip().upper() if recommended_plan else None,
        status=status.strip().lower() if status else "new",
    )
    db.add(lead)
    db.flush()
    create_followup_required_alert(
        db,
        related_entity_type="customer_contact_lead",
        related_entity_id=lead.id,
    )
    db.commit()
    db.refresh(lead)
    return lead


def list_customer_contact_leads(
    db: Session,
    *,
    status: str | None = None,
    channel: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[CustomerContactLead]:
    filters = []
    if status:
        filters.append(CustomerContactLead.status == status)
    if channel:
        filters.append(CustomerContactLead.channel == channel)
    if date_from:
        filters.append(CustomerContactLead.created_at >= date_from)
    if date_to:
        filters.append(CustomerContactLead.created_at <= date_to)
    return db.scalars(select(CustomerContactLead).where(*filters).order_by(CustomerContactLead.id.desc())).all()
