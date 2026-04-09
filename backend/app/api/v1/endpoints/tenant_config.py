from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Plan, Tenant
from app.schemas.tenant_config import TenantConfigRead
from app.services.tenant_config_service import build_tenant_config_payload

router = APIRouter()


@router.get("/config", response_model=TenantConfigRead)
def get_tenant_config(
    tenant_id: int | None = None,
    tenant_slug: str | None = None,
    db: Session = Depends(get_db),
) -> TenantConfigRead:
    if tenant_id is None and not tenant_slug:
        raise HTTPException(status_code=400, detail="tenant_id o tenant_slug son requeridos")

    tenant = _resolve_tenant(db, tenant_id=tenant_id, tenant_slug=tenant_slug)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant no encontrado")

    plan = db.get(Plan, tenant.plan_id) if tenant.plan_id else None
    payload = build_tenant_config_payload(
        tenant_id=tenant.id,
        tenant_slug=tenant.slug,
        tenant_name=tenant.name,
        business_type=tenant.business_type,
        tenant_plan_type=tenant.plan_type,
        commission_rules_json=tenant.commission_rules_json,
        subscription_plan_json=tenant.subscription_plan_json,
        billing_model=tenant.billing_model,
        commission_percentage=tenant.commission_percentage,
        commission_enabled=tenant.commission_enabled,
        commission_scope=tenant.commission_scope,
        commission_notes=tenant.commission_notes,
        commercial_plan_key=tenant.commercial_plan_key,
        commercial_plan_status=tenant.commercial_plan_status,
        commercial_limits_json=tenant.commercial_limits_json,
        ai_tokens_balance=tenant.ai_tokens_balance,
        ai_tokens_locked=tenant.ai_tokens_locked,
        plan_commission_enabled=bool(plan and plan.commission_enabled),
    )
    return TenantConfigRead.model_validate(payload)


def _resolve_tenant(db: Session, tenant_id: int | None, tenant_slug: str | None) -> Tenant | None:
    if tenant_id is not None:
        return db.get(Tenant, tenant_id)
    normalized_slug = (tenant_slug or "").strip().lower()
    return db.scalar(select(Tenant).where(Tenant.slug == normalized_slug))
