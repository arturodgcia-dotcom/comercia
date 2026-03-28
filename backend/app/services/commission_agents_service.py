from __future__ import annotations

import re
from datetime import datetime
from decimal import Decimal
from random import randint

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.models import InternalAlert, Order, PlanPurchaseLead, SalesCommissionAgent, SalesReferral
from app.services.internal_alerts_service import (
    create_accountant_notice_alert,
    create_appointment_request_alert,
    create_commission_sale_alert,
    create_direct_sale_alert,
    create_followup_required_alert,
    create_plan_purchase_alert,
)


def generate_unique_commission_code(db: Session, agent_name: str) -> str:
    base = re.sub(r"[^A-Za-z0-9]", "", agent_name.upper())[:6] or "AGENT"
    while True:
        code = f"COD-{base}-{randint(1000, 9999)}"
        exists = db.scalar(select(SalesCommissionAgent).where(SalesCommissionAgent.code == code))
        if not exists:
            return code


def create_commission_agent(
    db: Session,
    full_name: str,
    email: str,
    phone: str | None = None,
    commission_percentage: Decimal = Decimal("30"),
    is_active: bool = True,
    valid_from: datetime | None = None,
    valid_until: datetime | None = None,
    notes: str | None = None,
) -> SalesCommissionAgent:
    code = generate_unique_commission_code(db, full_name)
    agent = SalesCommissionAgent(
        code=code,
        full_name=full_name,
        email=email,
        phone=phone,
        commission_percentage=commission_percentage,
        is_active=is_active,
        valid_from=valid_from,
        valid_until=valid_until,
        notes=notes,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def update_commission_agent(db: Session, agent: SalesCommissionAgent, **changes) -> SalesCommissionAgent:
    for key, value in changes.items():
        if value is not None:
            setattr(agent, key, value)
    db.commit()
    db.refresh(agent)
    return agent


def create_sales_referral(
    db: Session,
    source_type: str,
    commission_agent_id: int | None = None,
    tenant_id: int | None = None,
    lead_email: str | None = None,
    lead_name: str | None = None,
    lead_phone: str | None = None,
    referral_code_entered: str | None = None,
    plan_code: str | None = None,
    needs_followup: bool = False,
    needs_appointment: bool = False,
    requested_contact: bool = False,
    status: str = "lead",
) -> SalesReferral:
    referral = SalesReferral(
        source_type=source_type,
        commission_agent_id=commission_agent_id,
        tenant_id=tenant_id,
        lead_email=lead_email,
        lead_name=lead_name,
        lead_phone=lead_phone,
        referral_code_entered=referral_code_entered,
        plan_code=plan_code,
        needs_followup=needs_followup,
        needs_appointment=needs_appointment,
        requested_contact=requested_contact,
        status=status,
    )
    db.add(referral)
    db.flush()
    return referral


def assign_referral_to_agent(db: Session, referral: SalesReferral, agent: SalesCommissionAgent) -> SalesReferral:
    referral.commission_agent_id = agent.id
    referral.referral_code_entered = agent.code
    db.commit()
    db.refresh(referral)
    return referral


def register_plan_purchase_lead(
    db: Session,
    company_name: str,
    legal_type: str,
    buyer_name: str,
    buyer_email: str,
    buyer_phone: str,
    selected_plan_code: str,
    referral_code: str | None = None,
    needs_followup: bool = True,
    needs_appointment: bool = False,
    notes: str | None = None,
    purchase_status: str = "initiated",
) -> PlanPurchaseLead:
    agent: SalesCommissionAgent | None = None
    referral_code_clean = referral_code.strip().upper() if referral_code else None
    if referral_code_clean:
        agent = db.scalar(
            select(SalesCommissionAgent).where(
                SalesCommissionAgent.code == referral_code_clean,
                SalesCommissionAgent.is_active.is_(True),
            )
        )

    lead = PlanPurchaseLead(
        company_name=company_name,
        legal_type=legal_type,
        buyer_name=buyer_name,
        buyer_email=buyer_email,
        buyer_phone=buyer_phone,
        selected_plan_code=selected_plan_code,
        commission_agent_id=agent.id if agent else None,
        referral_code=referral_code_clean,
        is_commissioned_sale=agent is not None,
        needs_followup=needs_followup,
        needs_appointment=needs_appointment,
        purchase_status=purchase_status,
        notes=notes,
    )
    db.add(lead)
    db.flush()

    create_sales_referral(
        db=db,
        source_type="manual_code" if referral_code_clean else "direct",
        commission_agent_id=agent.id if agent else None,
        lead_email=buyer_email,
        lead_name=buyer_name,
        lead_phone=buyer_phone,
        referral_code_entered=referral_code_clean,
        plan_code=selected_plan_code,
        needs_followup=needs_followup,
        needs_appointment=needs_appointment,
        requested_contact=needs_followup,
        status="purchased" if purchase_status == "paid" else "lead",
    )

    if agent:
        create_commission_sale_alert(
            db=db,
            plan_code=selected_plan_code,
            referral_code=agent.code,
            commission_agent_id=agent.id,
            related_entity_type="plan_purchase_lead",
            related_entity_id=lead.id,
        )
    else:
        create_direct_sale_alert(
            db=db,
            plan_code=selected_plan_code,
            related_entity_type="plan_purchase_lead",
            related_entity_id=lead.id,
        )

    create_plan_purchase_alert(
        db=db,
        plan_code=selected_plan_code,
        related_entity_type="plan_purchase_lead",
        related_entity_id=lead.id,
    )
    create_accountant_notice_alert(
        db=db,
        plan_code=selected_plan_code,
        referral_code=agent.code if agent else None,
        commission_agent_id=agent.id if agent else None,
        related_entity_type="plan_purchase_lead",
        related_entity_id=lead.id,
    )
    if needs_followup:
        create_followup_required_alert(db, related_entity_type="plan_purchase_lead", related_entity_id=lead.id)
    if needs_appointment:
        create_appointment_request_alert(db, related_entity_type="plan_purchase_lead", related_entity_id=lead.id)

    db.commit()
    db.refresh(lead)
    return lead


def get_agent_sales_summary(
    db: Session, agent_id: int, date_from: datetime | None = None, date_to: datetime | None = None
) -> dict:
    filters = [PlanPurchaseLead.commission_agent_id == agent_id]
    if date_from:
        filters.append(PlanPurchaseLead.created_at >= date_from)
    if date_to:
        filters.append(PlanPurchaseLead.created_at <= date_to)
    total_leads = db.scalar(select(func.count(PlanPurchaseLead.id)).where(*filters)) or 0
    commissioned_sales = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*filters, PlanPurchaseLead.is_commissioned_sale.is_(True))
    ) or 0
    paid = db.scalar(select(func.count(PlanPurchaseLead.id)).where(*filters, PlanPurchaseLead.purchase_status == "paid")) or 0
    followup = db.scalar(select(func.count(PlanPurchaseLead.id)).where(*filters, PlanPurchaseLead.needs_followup.is_(True))) or 0
    return {
        "agent_id": agent_id,
        "total_leads": total_leads,
        "commissioned_sales": commissioned_sales,
        "paid_sales": paid,
        "needs_followup": followup,
    }


def get_commission_sales_kpis(db: Session, date_from: datetime | None = None, date_to: datetime | None = None) -> dict:
    base = []
    if date_from:
        base.append(PlanPurchaseLead.created_at >= date_from)
    if date_to:
        base.append(PlanPurchaseLead.created_at <= date_to)
    total_agents = db.scalar(select(func.count(SalesCommissionAgent.id))) or 0
    total_commission_sales = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*base, PlanPurchaseLead.is_commissioned_sale.is_(True))
    ) or 0
    total_direct_sales = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*base, PlanPurchaseLead.is_commissioned_sale.is_(False))
    ) or 0
    total_plan_purchase_leads = db.scalar(select(func.count(PlanPurchaseLead.id)).where(*base)) or 0
    total_leads_followup = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*base, PlanPurchaseLead.needs_followup.is_(True))
    ) or 0
    total_leads_appointment = db.scalar(
        select(func.count(PlanPurchaseLead.id)).where(*base, PlanPurchaseLead.needs_appointment.is_(True))
    ) or 0
    accountant_notices_pending = db.scalar(
        select(func.count(InternalAlert.id)).where(
            InternalAlert.alert_type == "accountant_notice",
            InternalAlert.is_read.is_(False),
        )
    ) or 0
    return {
        "total_commission_agents": total_agents,
        "total_commission_sales": total_commission_sales,
        "total_direct_sales": total_direct_sales,
        "total_plan_purchase_leads": total_plan_purchase_leads,
        "total_leads_requiring_followup": total_leads_followup,
        "total_leads_requesting_appointment": total_leads_appointment,
        "total_accountant_notices_pending": accountant_notices_pending,
    }


def get_pending_internal_alerts(
    db: Session, alert_type: str | None = None, severity: str | None = None, is_read: bool | None = None
) -> list[InternalAlert]:
    filters = []
    if alert_type:
        filters.append(InternalAlert.alert_type == alert_type)
    if severity:
        filters.append(InternalAlert.severity == severity)
    if is_read is not None:
        filters.append(InternalAlert.is_read.is_(is_read))
    return db.scalars(select(InternalAlert).where(*filters).order_by(InternalAlert.id.desc())).all()


def mark_alert_as_read(db: Session, alert_id: int) -> InternalAlert | None:
    alert = db.get(InternalAlert, alert_id)
    if not alert:
        return None
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

