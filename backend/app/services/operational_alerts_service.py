from __future__ import annotations

import json
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import (
    CommercialClientAccount,
    InternalAlert,
    MercadoPagoSettings,
    PosLocation,
    PosSale,
    Product,
    StorefrontConfig,
    Tenant,
    User,
)
from app.services.ai_credit_service import build_brand_credit_snapshot
from app.services.automation_service import log_automation_event
from app.services.commercial_account_guard_service import build_account_usage_payload, get_tenant_commercial_account
from app.services.commercial_plan_service import parse_limits
from app.services.currency_service import get_currency_settings


@dataclass
class _AlertCandidate:
    code: str
    title: str
    message: str
    severity: str


def _usage_severity(used: int, limit: int) -> str | None:
    if limit <= 0:
        return None
    ratio = used / max(limit, 1)
    if ratio >= 1:
        return "high"
    if ratio >= 0.9:
        return "warning"
    if ratio >= 0.8:
        return "info"
    return None


def _parse_storefront_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _upsert_tenant_operational_alert(db: Session, *, tenant_id: int, candidate: _AlertCandidate) -> None:
    row = db.scalar(
        select(InternalAlert).where(
            InternalAlert.tenant_id == tenant_id,
            InternalAlert.alert_type == "sentinel_operational",
            InternalAlert.related_entity_type == candidate.code,
            InternalAlert.is_read.is_(False),
        )
    )
    if row:
        row.title = candidate.title
        row.message = candidate.message
        row.severity = candidate.severity
        db.add(row)
        return
    db.add(
        InternalAlert(
            alert_type="sentinel_operational",
            related_entity_type=candidate.code,
            related_entity_id=tenant_id,
            tenant_id=tenant_id,
            title=candidate.title,
            message=candidate.message,
            severity=candidate.severity,
            is_read=False,
        )
    )


def _upsert_account_operational_alert(
    db: Session,
    *,
    account: CommercialClientAccount,
    tenant_id: int,
    candidate: _AlertCandidate,
) -> None:
    account_code = f"{candidate.code}_account_{account.id}"
    row = db.scalar(
        select(InternalAlert).where(
            InternalAlert.tenant_id.is_(None),
            InternalAlert.alert_type == "sentinel_operational_account",
            InternalAlert.related_entity_type == account_code,
            InternalAlert.is_read.is_(False),
        )
    )
    title = f"[Cliente principal] {candidate.title}"
    message = (
        f"Cliente principal: {account.legal_name}. Marca tenant_id={tenant_id}. "
        f"{candidate.message} Contacto: {account.contact_email or 'sin correo'}."
    )
    if row:
        row.title = title
        row.message = message
        row.severity = candidate.severity
        db.add(row)
        return
    db.add(
        InternalAlert(
            alert_type="sentinel_operational_account",
            related_entity_type=account_code,
            related_entity_id=account.id,
            tenant_id=None,
            title=title,
            message=message,
            severity=candidate.severity,
            is_read=False,
        )
    )


def _resolve_missing_candidates(db: Session, *, tenant_id: int, active_codes: set[str]) -> None:
    rows = db.scalars(
        select(InternalAlert).where(
            InternalAlert.tenant_id == tenant_id,
            InternalAlert.alert_type == "sentinel_operational",
            InternalAlert.is_read.is_(False),
        )
    ).all()
    for row in rows:
        code = str(row.related_entity_type or "")
        if code and code not in active_codes:
            row.is_read = True
            db.add(row)


def _capacity_status_text(*, used: int, limit: int) -> str:
    if limit <= 0:
        return "sin limite"
    if used >= limit:
        return "alerta critica (100% del limite)"
    if used >= int(limit * 0.9):
        return "alerta fuerte (90% del limite)"
    if used >= int(limit * 0.8):
        return "alerta preventiva (80% del limite)"
    return "dentro del limite"


def _capacity_alert_message(*, label: str, used: int, limit: int, escalation: str) -> str:
    if limit <= 0:
        return f"{label}: {used}/{limit}. {escalation}"
    base = f"Estas usando {used} de {limit} {label.lower()} disponibles en tu plan."
    if used >= limit:
        return f"{base} Se alcanzo el limite: se activa bloqueo controlado para nuevos registros. {escalation}"
    if used >= int(limit * 0.9):
        return f"{base} Alerta fuerte: estas al 90% o mas del limite. {escalation}"
    return f"{base} Alerta preventiva: estas al 80% o mas del limite. {escalation}"


def _escalate_operational_alert(db: Session, *, tenant_id: int, candidate: _AlertCandidate) -> None:
    payload = json.dumps(
        {
            "channels_ready": ["email", "telegram", "bot_interno"],
            "severity": candidate.severity,
            "code": candidate.code,
            "title": candidate.title,
        },
        ensure_ascii=False,
    )
    log_automation_event(
        db,
        event_type="sentinel_operational_alert",
        tenant_id=tenant_id,
        related_entity_type="internal_alert",
        related_entity_id=tenant_id,
        payload_json=payload,
        auto_commit=False,
    )


def evaluate_tenant_operational_alerts(db: Session, tenant: Tenant) -> list[_AlertCandidate]:
    account = get_tenant_commercial_account(db, tenant.id)
    limits = parse_limits(tenant)
    candidates: list[_AlertCandidate] = []
    escalation = "Base de escalamiento lista: email, Telegram y bot interno."

    if account:
        usage = build_account_usage_payload(db, account)
        brands_used = int(usage.get("brands_used") or 0)
        brands_limit = int(usage.get("brands_limit") or 0)
        users_used = int(usage.get("users_used") or 0)
        users_limit = int(usage.get("users_limit") or 0)
        products_used = int(usage.get("products_used") or 0)
        products_limit = int(usage.get("products_limit") or 0)
        branches_used = int(usage.get("branches_used") or 0)
        branches_limit = int(usage.get("branches_limit") or 0)
    else:
        brands_used = 1
        brands_limit = int(limits.get("brands_max") or 1)
        users_used = int(
            db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant.id, User.is_active.is_(True))) or 0
        )
        users_limit = int(limits.get("users_max") or 0)
        products_used = int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id == tenant.id)) or 0)
        products_limit = int(limits.get("products_max") or 0)
        branches_used = int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id)) or 0)
        branches_limit = int(limits.get("branches_max") or 0)

    ai_agents_limit = int(limits.get("ai_agents_max") or 0)
    ai_agents_used = 0
    credit_snapshot = build_brand_credit_snapshot(db, tenant)

    metrics = [
        ("capacity_products", "Productos", products_used, products_limit),
        ("capacity_users", "Usuarios", users_used, users_limit),
        ("capacity_ai_agents", "Agentes IA", ai_agents_used, ai_agents_limit),
        ("capacity_branches", "Sucursales", branches_used, branches_limit),
        ("capacity_brands", "Marcas", brands_used, brands_limit),
    ]
    for code, label, used, limit in metrics:
        sev = _usage_severity(used, limit)
        if not sev:
            continue
        candidates.append(
            _AlertCandidate(
                code=code,
                title=f"Capacidad critica - {label}: {_capacity_status_text(used=used, limit=limit)}",
                message=_capacity_alert_message(label=label, used=used, limit=limit, escalation=escalation),
                severity=sev,
            )
        )

    credits_assigned = int(credit_snapshot.assigned_tokens or 0)
    credits_used = int(credit_snapshot.consumed_tokens or 0)
    credits_sev = _usage_severity(credits_used, credits_assigned)
    if credits_sev:
        candidates.append(
            _AlertCandidate(
                code="capacity_ai_credits",
                title=f"Capacidad critica - Creditos IA: {_capacity_status_text(used=credits_used, limit=credits_assigned)}",
                message=_capacity_alert_message(
                    label="Creditos IA",
                    used=credits_used,
                    limit=credits_assigned,
                    escalation=escalation,
                ),
                severity=credits_sev,
            )
        )

    if credit_snapshot.key_state == "bloqueada":
        candidates.append(
            _AlertCandidate(
                code="ia_locked",
                title="Llave IA bloqueada",
                message=f"La marca agoto creditos IA asignados ({credit_snapshot.consumed_tokens}/{credit_snapshot.assigned_tokens}). {escalation}",
                severity="high",
            )
        )
    elif credit_snapshot.key_state in {"advertencia", "override_admin"}:
        sev = "warning" if credit_snapshot.key_state == "advertencia" else "info"
        candidates.append(
            _AlertCandidate(
                code="ia_consumption",
                title="Consumo IA en riesgo",
                message=f"Consumo IA al {credit_snapshot.percentage_consumed:.2f}% con estado {credit_snapshot.key_state}. {escalation}",
                severity=sev,
            )
        )

    if bool(tenant.commission_enabled):
        pct = float(tenant.commission_percentage or 0)
        scope = str(tenant.commission_scope or "").strip()
        if pct <= 0 or not scope:
            candidates.append(
                _AlertCandidate(
                    code="commission_config",
                    title="Comision activa sin configuracion suficiente",
                    message="La comision esta activa pero falta porcentaje valido o scope operativo. Revisar configuracion comercial.",
                    severity="high",
                )
            )

    storefront = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant.id))
    storefront_payload = _parse_storefront_json(storefront.config_json if storefront else None)
    admin_settings = storefront_payload.get("admin_settings", {}) if isinstance(storefront_payload.get("admin_settings"), dict) else {}
    international = admin_settings.get("international", {}) if isinstance(admin_settings.get("international"), dict) else {}
    features = admin_settings.get("features", {}) if isinstance(admin_settings.get("features"), dict) else {}
    channel_settings = storefront_payload.get("channel_settings", {}) if isinstance(storefront_payload.get("channel_settings"), dict) else {}

    expansion_enabled = bool(international.get("expansion_enabled", False))
    country_code = str(international.get("country_code", "")).strip().upper()
    if expansion_enabled and not country_code:
        candidates.append(
            _AlertCandidate(
                code="international_country_missing",
                title="Expansion activa sin pais configurado",
                message="La marca tiene expansion habilitada sin pais activo definido.",
                severity="warning",
            )
        )

    if expansion_enabled:
        currency_settings = get_currency_settings(db, tenant.id)
        if not str(currency_settings.base_currency or "").strip():
            candidates.append(
                _AlertCandidate(
                    code="international_currency_missing",
                    title="Expansion activa sin moneda base",
                    message="La marca tiene expansion habilitada sin configuracion de moneda base operativa.",
                    severity="warning",
                )
            )

    feature_logistics = bool(features.get("logistics_enabled", False))
    feature_workday = bool(features.get("workday_enabled", False))
    feature_nfc = bool(features.get("nfc_operations_enabled", False))

    active_branches = int(
        db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id, PosLocation.is_active.is_(True))) or 0
    )
    if feature_logistics and active_branches <= 0:
        candidates.append(
            _AlertCandidate(
                code="module_logistics_not_configured",
                title="Logistica contratada sin configuracion",
                message="El modulo de logistica esta habilitado pero no hay sucursales activas para operar.",
                severity="warning",
            )
        )

    if feature_workday:
        active_users = int(
            db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant.id, User.is_active.is_(True))) or 0
        )
        if active_users <= 0:
            candidates.append(
                _AlertCandidate(
                    code="module_workday_not_configured",
                    title="Jornada laboral contratada sin configuracion",
                    message="El modulo de jornada laboral esta habilitado pero no hay usuarios activos para operarlo.",
                    severity="warning",
                )
            )

    if feature_nfc and not bool(channel_settings.get("nfc_enabled", False)):
        candidates.append(
            _AlertCandidate(
                code="module_nfc_not_configured",
                title="NFC contratado sin configuracion",
                message="El modulo NFC esta habilitado pero no esta activado en configuracion de canales.",
                severity="warning",
            )
        )

    if feature_nfc:
        mp_settings = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant.id))
        if not mp_settings or not bool(mp_settings.mercadopago_enabled):
            candidates.append(
                _AlertCandidate(
                    code="module_nfc_without_payments",
                    title="NFC activo sin pagos POS",
                    message="NFC esta habilitado sin integracion activa de pagos POS (Mercado Pago).",
                    severity="info",
                )
            )

    disabled_branch_sales = int(
        db.scalar(
            select(func.count(PosSale.id))
            .join(PosLocation, PosLocation.id == PosSale.pos_location_id)
            .where(PosSale.tenant_id == tenant.id, PosLocation.is_active.is_(False))
        )
        or 0
    )
    if disabled_branch_sales > 0:
        candidates.append(
            _AlertCandidate(
                code="disabled_branch_with_sales",
                title="Sucursales deshabilitadas con ventas",
                message=f"Se detectaron {disabled_branch_sales} ventas asociadas a sucursales deshabilitadas.",
                severity="high",
            )
        )

    active_codes: set[str] = set()
    for candidate in candidates:
        _upsert_tenant_operational_alert(db, tenant_id=tenant.id, candidate=candidate)
        if account and candidate.code.startswith("capacity_"):
            _upsert_account_operational_alert(db, account=account, tenant_id=tenant.id, candidate=candidate)
        _escalate_operational_alert(db, tenant_id=tenant.id, candidate=candidate)
        active_codes.add(candidate.code)
    _resolve_missing_candidates(db, tenant_id=tenant.id, active_codes=active_codes)
    return candidates


def sync_operational_alerts_for_tenant(db: Session, tenant_id: int) -> list[_AlertCandidate]:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        return []
    return evaluate_tenant_operational_alerts(db, tenant)


def sync_operational_alerts_for_all_tenants(db: Session) -> int:
    tenants = db.scalars(select(Tenant).where(Tenant.is_active.is_(True))).all()
    total = 0
    for tenant in tenants:
        total += len(evaluate_tenant_operational_alerts(db, tenant))
    return total
