import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import MercadoPagoSettings, StorefrontConfig, Tenant, User
from app.schemas.brand_setup import (
    BrandChannelSettingsRead,
    BrandChannelSettingsUpdate,
    BrandSetupAssetRead,
    BrandSetupStepState,
    BrandSetupWorkflowRead,
    BrandSetupWorkflowUpdate,
)

router = APIRouter()

DEFAULT_STEPS = [
    {"code": "brand_identity", "title": "Identidad de marca", "status": "pending", "approved": False},
    {"code": "landing_setup", "title": "Landing de marca", "status": "pending", "approved": False},
    {"code": "public_storefront", "title": "Ecommerce publico", "status": "pending", "approved": False},
    {"code": "distributor_storefront", "title": "Ecommerce distribuidores", "status": "pending", "approved": False},
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
    assets = [BrandSetupAssetRead(**asset) for asset in assets_raw]
    current_step = workflow.get("current_step") or (steps[0].code if steps else "brand_identity")

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
        workflow["steps"] = [step.model_dump() if isinstance(step, BrandSetupStepState) else step for step in update_data["steps"]]

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
