import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import MercadoPagoSettings, StorefrontConfig, Tenant, TenantBranding, User
from app.schemas.brand_setup import (
    BrandChannelSettingsRead,
    BrandChannelSettingsUpdate,
    BrandSetupAssetRead,
    BrandGenerateContentRequest,
    BrandGenerateLandingRequest,
    BrandGeneratedContent,
    BrandEcommerceData,
    BrandIdentityData,
    BrandLandingDraft,
    BrandPosSetupData,
    BrandSetupStepState,
    BrandSetupWorkflowRead,
    BrandSetupWorkflowUpdate,
)
from app.services.brand_setup_generator import generate_brand_content, generate_landing_draft

router = APIRouter()

DEFAULT_STEPS = [
    {"code": "brand_identity", "title": "Identidad de marca", "status": "pending", "approved": False},
    {"code": "base_content", "title": "Contenido base (prompt + IA)", "status": "pending", "approved": False},
    {"code": "landing_setup", "title": "Landing", "status": "pending", "approved": False},
    {"code": "ecommerce_setup", "title": "Ecommerce", "status": "pending", "approved": False},
    {"code": "pos_setup", "title": "POS / WebApp", "status": "pending", "approved": False},
    {"code": "final_review", "title": "Revision y publicacion", "status": "pending", "approved": False},
]

DEFAULT_CHANNEL_SETTINGS = {
    "nfc_enabled": False,
    "nfc_setup_fee": 500,
    "nfc_card_price_standard": 200,
    "nfc_card_price_bulk": 150,
    "nfc_bulk_threshold": 10,
    "mercadopago_enabled": False,
    "mercadopago_public_key": None,
    "mercadopago_access_token": None,
    "mercadopago_qr_enabled": True,
    "mercadopago_payment_link_enabled": True,
    "mercadopago_point_enabled": False,
    "mercadopago_active_for_pos_only": True,
    "mfa_totp_enabled": False,
    "mfa_required_for_admins": True,
    "mfa_required_for_staff": False,
    "mfa_required_for_distributors": False,
    "mfa_required_for_public": False,
}


@router.get("/{tenant_id}", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def get_brand_setup_workflow(tenant_id: int, db: Session = Depends(get_db)) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    config, payload = _load_brand_payload(db, tenant_id)
    workflow = payload.get("workflow", {})
    steps_raw = workflow.get("steps", DEFAULT_STEPS)
    assets_raw = payload.get("assets", [])

    steps = [BrandSetupStepState(**step) for step in steps_raw]
    steps = _normalize_steps(steps)
    assets = [BrandSetupAssetRead(**asset) for asset in assets_raw]
    current_step = workflow.get("current_step") or _next_step_code(steps)
    identity_data = _parse_identity(payload)
    generated_content = _parse_generated_content(payload)
    landing_draft = _parse_landing_draft(payload)
    ecommerce_data = _parse_ecommerce_data(payload)
    pos_setup_data = _parse_pos_setup_data(payload)

    return BrandSetupWorkflowRead(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        tenant_slug=tenant.slug,
        current_step=current_step,
        is_published=bool(workflow.get("is_published", False)),
        prompt_master=workflow.get("prompt_master"),
        selected_template=workflow.get("selected_template"),
        steps=steps,
        assets=assets,
        identity_data=identity_data,
        generated_content=generated_content,
        landing_draft=landing_draft,
        ecommerce_data=ecommerce_data,
        pos_setup_data=pos_setup_data,
    )


@router.put("/{tenant_id}", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def update_brand_setup_workflow(
    tenant_id: int,
    payload: BrandSetupWorkflowUpdate,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    config, raw_payload = _load_brand_payload(db, tenant_id)
    workflow = raw_payload.setdefault("workflow", {})

    update_data = payload.model_dump(exclude_unset=True)
    for key in ("current_step", "is_published", "prompt_master", "selected_template"):
        if key in update_data:
            workflow[key] = update_data[key]
    if "steps" in update_data and update_data["steps"] is not None:
        incoming_steps = [step.model_dump() if isinstance(step, BrandSetupStepState) else step for step in update_data["steps"]]
        workflow["steps"] = [step.model_dump() for step in _normalize_steps([BrandSetupStepState(**row) for row in incoming_steps])]
    if "identity_data" in update_data and update_data["identity_data"] is not None:
        payload_identity: BrandIdentityData = (
            update_data["identity_data"] if isinstance(update_data["identity_data"], BrandIdentityData) else BrandIdentityData(**update_data["identity_data"])
        )
        raw_payload["identity_data"] = payload_identity.model_dump()
        _sync_tenant_identity(db, tenant, payload_identity)
    if "generated_content" in update_data and update_data["generated_content"] is not None:
        generated_content: BrandGeneratedContent = (
            update_data["generated_content"]
            if isinstance(update_data["generated_content"], BrandGeneratedContent)
            else BrandGeneratedContent(**update_data["generated_content"])
        )
        raw_payload["generated_content"] = generated_content.model_dump()
    if "landing_draft" in update_data and update_data["landing_draft"] is not None:
        landing_draft: BrandLandingDraft = (
            update_data["landing_draft"]
            if isinstance(update_data["landing_draft"], BrandLandingDraft)
            else BrandLandingDraft(**update_data["landing_draft"])
        )
        raw_payload["landing_draft"] = landing_draft.model_dump()
    if "ecommerce_data" in update_data and update_data["ecommerce_data"] is not None:
        ecommerce_data: BrandEcommerceData = (
            update_data["ecommerce_data"]
            if isinstance(update_data["ecommerce_data"], BrandEcommerceData)
            else BrandEcommerceData(**update_data["ecommerce_data"])
        )
        raw_payload["ecommerce_data"] = ecommerce_data.model_dump()
    if "pos_setup_data" in update_data and update_data["pos_setup_data"] is not None:
        pos_setup_data: BrandPosSetupData = (
            update_data["pos_setup_data"]
            if isinstance(update_data["pos_setup_data"], BrandPosSetupData)
            else BrandPosSetupData(**update_data["pos_setup_data"])
        )
        raw_payload["pos_setup_data"] = pos_setup_data.model_dump()

    if "steps" not in update_data:
        existing_steps = [BrandSetupStepState(**step) for step in workflow.get("steps", DEFAULT_STEPS)]
        workflow["steps"] = [step.model_dump() for step in _normalize_steps(existing_steps)]
    workflow["current_step"] = _next_step_code([BrandSetupStepState(**step) for step in workflow["steps"]])

    _save_brand_payload(config, raw_payload, db)
    return get_brand_setup_workflow(tenant.id, db)


@router.post("/{tenant_id}/generate-content", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def generate_brand_setup_content(
    tenant_id: int,
    payload: BrandGenerateContentRequest,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    config, raw_payload = _load_brand_payload(db, tenant_id)
    identity = _parse_identity(raw_payload)
    if not identity:
        raise HTTPException(status_code=400, detail="Completa la identidad de marca antes de generar contenido.")
    generated = generate_brand_content(identity, payload.prompt_master)
    workflow = raw_payload.setdefault("workflow", {})
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", DEFAULT_STEPS)])
    _mark_step_in_progress(steps, "base_content")
    workflow["steps"] = [step.model_dump() for step in steps]
    workflow["prompt_master"] = payload.prompt_master
    workflow["current_step"] = "base_content"
    raw_payload["generated_content"] = generated.model_dump()
    _save_brand_payload(config, raw_payload, db)
    return get_brand_setup_workflow(tenant.id, db)


@router.post("/{tenant_id}/generate-landing", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def generate_brand_setup_landing(
    tenant_id: int,
    payload: BrandGenerateLandingRequest,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    config, raw_payload = _load_brand_payload(db, tenant_id)
    identity = _parse_identity(raw_payload)
    generated = _parse_generated_content(raw_payload)
    if not identity or not generated:
        raise HTTPException(status_code=400, detail="Primero genera y aprueba el contenido base.")
    if raw_payload.get("landing_draft") and not payload.regenerate:
        raise HTTPException(status_code=400, detail="Ya existe una landing generada. Usa regenerar para reemplazarla.")
    landing_draft = generate_landing_draft(identity, generated)
    workflow = raw_payload.setdefault("workflow", {})
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", DEFAULT_STEPS)])
    _mark_step_in_progress(steps, "landing_setup")
    workflow["steps"] = [step.model_dump() for step in steps]
    workflow["current_step"] = "landing_setup"
    raw_payload["landing_draft"] = landing_draft.model_dump()
    _save_brand_payload(config, raw_payload, db)
    return get_brand_setup_workflow(tenant.id, db)


@router.post("/{tenant_id}/steps/{step_code}/approve", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def approve_brand_setup_step(
    tenant_id: int,
    step_code: str,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    config, raw_payload = _load_brand_payload(db, tenant_id)
    workflow = raw_payload.setdefault("workflow", {})
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", DEFAULT_STEPS)])
    index = _step_index(step_code)
    if index < 0:
        raise HTTPException(status_code=404, detail="Paso no encontrado")
    for previous_step in steps[:index]:
        if not previous_step.approved:
            raise HTTPException(status_code=400, detail="No puedes aprobar este paso sin aprobar los anteriores.")
    target = steps[index]
    target.approved = True
    target.status = "approved"
    target.updated_at = datetime.utcnow()
    workflow["steps"] = [step.model_dump() for step in _normalize_steps(steps)]
    workflow["current_step"] = _next_step_code([BrandSetupStepState(**step) for step in workflow["steps"]])
    _save_brand_payload(config, raw_payload, db)
    return get_brand_setup_workflow(tenant.id, db)


@router.post("/{tenant_id}/assets", response_model=BrandSetupAssetRead, dependencies=[Depends(get_reinpia_admin)])
async def upload_brand_setup_asset(
    tenant_id: int,
    step_code: str = Form(...),
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> BrandSetupAssetRead:
    _get_tenant_or_404(db, tenant_id)
    config, payload = _load_brand_payload(db, tenant_id)

    media_root = Path(__file__).resolve().parents[4] / "media" / f"tenant_{tenant_id}" / step_code
    media_root.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "").suffix or ".bin"
    generated_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{extension}"
    destination = media_root / generated_name

    with destination.open("wb") as output:
        output.write(await file.read())

    asset = BrandSetupAssetRead(
        id=uuid.uuid4().hex,
        step_code=step_code,
        asset_type=asset_type,
        file_name=file.filename or generated_name,
        file_path=str(destination),
        uploaded_at=datetime.utcnow(),
    )
    assets = payload.setdefault("assets", [])
    assets.append(asset.model_dump())
    _save_brand_payload(config, payload, db)
    return asset


@router.get("/{tenant_id}/channel-settings", response_model=BrandChannelSettingsRead)
def get_brand_channel_settings(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandChannelSettingsRead:
    _ensure_tenant_access(current_user, tenant_id)
    _, payload = _load_brand_payload(db, tenant_id)
    settings = {**DEFAULT_CHANNEL_SETTINGS, **payload.get("channel_settings", {})}
    return BrandChannelSettingsRead(tenant_id=tenant_id, **settings)


@router.put("/{tenant_id}/channel-settings", response_model=BrandChannelSettingsRead)
def update_brand_channel_settings(
    tenant_id: int,
    updates: BrandChannelSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandChannelSettingsRead:
    _ensure_tenant_access(current_user, tenant_id)
    config, payload = _load_brand_payload(db, tenant_id)
    settings = {**DEFAULT_CHANNEL_SETTINGS, **payload.get("channel_settings", {})}
    settings.update(updates.model_dump(exclude_unset=True))
    payload["channel_settings"] = settings
    _sync_mercadopago_settings(db, tenant_id=tenant_id, settings=settings)
    _save_brand_payload(config, payload, db)
    return BrandChannelSettingsRead(tenant_id=tenant_id, **settings)


def _load_brand_payload(db: Session, tenant_id: int) -> tuple[StorefrontConfig, dict]:
    _get_tenant_or_404(db, tenant_id)
    config = db.scalar(select(StorefrontConfig).where(StorefrontConfig.tenant_id == tenant_id))
    if not config:
        config = StorefrontConfig(tenant_id=tenant_id, is_initialized=False, ecommerce_enabled=True, landing_enabled=True)
        db.add(config)
        db.flush()
    if not config.config_json:
        return config, {}
    try:
        return config, json.loads(config.config_json)
    except json.JSONDecodeError:
        return config, {}


def _save_brand_payload(config: StorefrontConfig, payload: dict, db: Session) -> None:
    config.config_json = json.dumps(payload, ensure_ascii=False)
    db.add(config)
    db.commit()
    db.refresh(config)


def _get_tenant_or_404(db: Session, tenant_id: int) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return tenant


def _ensure_tenant_access(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.role in {"tenant_admin", "tenant_staff"} and current_user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=403, detail="Sin permisos para esta marca")


def _sync_mercadopago_settings(db: Session, *, tenant_id: int, settings: dict) -> None:
    row = db.scalar(select(MercadoPagoSettings).where(MercadoPagoSettings.tenant_id == tenant_id))
    if not row:
        row = MercadoPagoSettings(tenant_id=tenant_id)
        db.add(row)
    row.mercadopago_enabled = bool(settings.get("mercadopago_enabled", False))
    row.mercadopago_public_key = settings.get("mercadopago_public_key")
    row.mercadopago_access_token = settings.get("mercadopago_access_token")
    row.mercadopago_qr_enabled = bool(settings.get("mercadopago_qr_enabled", True))
    row.mercadopago_payment_link_enabled = bool(settings.get("mercadopago_payment_link_enabled", True))
    row.mercadopago_point_enabled = bool(settings.get("mercadopago_point_enabled", False))
    row.mercadopago_active_for_pos_only = bool(settings.get("mercadopago_active_for_pos_only", True))
    db.add(row)


def _parse_identity(payload: dict) -> BrandIdentityData | None:
    raw = payload.get("identity_data")
    if not raw:
        return None
    try:
        return BrandIdentityData(**raw)
    except Exception:
        return None


def _parse_generated_content(payload: dict) -> BrandGeneratedContent | None:
    raw = payload.get("generated_content")
    if not raw:
        return None
    try:
        return BrandGeneratedContent(**raw)
    except Exception:
        return None


def _parse_landing_draft(payload: dict) -> BrandLandingDraft | None:
    raw = payload.get("landing_draft")
    if not raw:
        return None


def _parse_ecommerce_data(payload: dict) -> BrandEcommerceData | None:
    raw = payload.get("ecommerce_data")
    if not raw:
        return None
    try:
        return BrandEcommerceData(**raw)
    except Exception:
        return None


def _parse_pos_setup_data(payload: dict) -> BrandPosSetupData | None:
    raw = payload.get("pos_setup_data")
    if not raw:
        return None
    try:
        return BrandPosSetupData(**raw)
    except Exception:
        return None
    try:
        return BrandLandingDraft(**raw)
    except Exception:
        return None


def _step_index(step_code: str) -> int:
    for idx, row in enumerate(DEFAULT_STEPS):
        if row["code"] == step_code:
            return idx
    return -1


def _normalize_steps(steps: list[BrandSetupStepState]) -> list[BrandSetupStepState]:
    by_code = {step.code: step for step in steps}
    normalized: list[BrandSetupStepState] = []
    previous_approved = True
    for default in DEFAULT_STEPS:
        step = by_code.get(default["code"]) or BrandSetupStepState(**default)
        if not previous_approved and step.approved:
            step.approved = False
            step.status = "pending"
        if step.approved:
            step.status = "approved"
        elif step.status == "approved":
            step.status = "pending"
        if not step.approved and step.status not in {"pending", "in_progress"}:
            step.status = "pending"
        previous_approved = step.approved
        normalized.append(step)
    # Marca el primer pendiente como in_progress si ninguno lo está.
    if not any(step.status == "in_progress" for step in normalized):
        for step in normalized:
            if not step.approved:
                step.status = "in_progress"
                break
    return normalized


def _next_step_code(steps: list[BrandSetupStepState]) -> str:
    for step in steps:
        if not step.approved:
            return step.code
    return "final_review"


def _mark_step_in_progress(steps: list[BrandSetupStepState], step_code: str) -> None:
    for step in steps:
        if step.code == step_code and not step.approved:
            step.status = "in_progress"
        elif step.status == "in_progress" and not step.approved:
            step.status = "pending"


def _sync_tenant_identity(db: Session, tenant: Tenant, identity: BrandIdentityData) -> None:
    tenant.name = identity.brand_name
    tenant.business_type = identity.business_type
    db.add(tenant)
    branding = db.scalar(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    if not branding:
        branding = TenantBranding(tenant_id=tenant.id)
    branding.primary_color = identity.primary_color
    branding.secondary_color = identity.secondary_color
    db.add(branding)
