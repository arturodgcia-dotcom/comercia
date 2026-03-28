from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import ContractTemplate, SignedContract


def create_default_distributor_contract_template(db: Session, tenant_id: int | None = None) -> ContractTemplate:
    existing = db.scalar(
        select(ContractTemplate).where(
            ContractTemplate.tenant_id == tenant_id,
            ContractTemplate.contract_type == "distributor",
            ContractTemplate.is_active.is_(True),
        )
    )
    if existing:
        return existing
    template = ContractTemplate(
        tenant_id=tenant_id,
        contract_type="distributor",
        name="Contrato Base Distribuidor",
        content_markdown="## Contrato Distribuidor\n\nAcepto terminos comerciales y operativos.",
        is_active=True,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def get_active_template(db: Session, tenant_id: int, contract_type: str = "distributor") -> ContractTemplate | None:
    template = db.scalar(
        select(ContractTemplate).where(
            ContractTemplate.tenant_id == tenant_id,
            ContractTemplate.contract_type == contract_type,
            ContractTemplate.is_active.is_(True),
        )
    )
    if template:
        return template
    return db.scalar(
        select(ContractTemplate).where(
            ContractTemplate.tenant_id.is_(None),
            ContractTemplate.contract_type == contract_type,
            ContractTemplate.is_active.is_(True),
        )
    )


def sign_contract(db: Session, **values) -> SignedContract:
    signed = SignedContract(signed_at=datetime.utcnow(), status="signed", **values)
    db.add(signed)
    db.commit()
    db.refresh(signed)
    return signed
