import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import CatalogImportJob, Category, MercadoPagoSettings, Product, ServiceOffering, StorefrontConfig, Tenant, TenantBranding, User
from app.schemas.brand_setup import (
    BrandChannelSettingsRead,
    BrandChannelSettingsUpdate,
    BrandSetupAssetRead,
    BrandGenerateContentRequest,
    BrandGenerateLandingRequest,
    BrandGeneratedContent,
    EcommercePublicSummary,
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
ALLOWED_ASSET_TYPES = {"logo", "base_image"}

DEFAULT_STEPS_WITHOUT_LANDING = [
    {"code": "brand_identity", "title": "Identidad de marca", "status": "pending", "approved": False},
    {"code": "landing_setup", "title": "Landing", "status": "pending", "approved": False},
    {"code": "ecommerce_setup", "title": "Ecommerce publico", "status": "pending", "approved": False},
    {"code": "distributors_setup", "title": "Ecommerce distribuidores", "status": "pending", "approved": False},
    {"code": "pos_setup", "title": "POS / WebApp", "status": "pending", "approved": False},
    {"code": "final_review", "title": "Revision y publicacion", "status": "pending", "approved": False},
]

DEFAULT_STEPS_WITH_EXISTING_LANDING = [
    {"code": "brand_identity", "title": "Identidad de marca", "status": "pending", "approved": False},
    {"code": "ecommerce_setup", "title": "Ecommerce publico", "status": "pending", "approved": False},
    {"code": "distributors_setup", "title": "Ecommerce distribuidores", "status": "pending", "approved": False},
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
    flow_type = workflow.get("flow_type", "without_landing")
    steps_raw = workflow.get("steps", _build_default_steps(flow_type))
    assets_raw = payload.get("assets", [])

    steps = [BrandSetupStepState(**step) for step in steps_raw]
    steps = _normalize_steps(steps, flow_type=flow_type)
    ecommerce_summary = _build_ecommerce_public_summary(db, tenant_id)
    steps = _apply_ecommerce_step_status(steps, ecommerce_summary)
    assets = _normalize_assets(assets_raw)
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
        flow_type=flow_type,
        steps=steps,
        assets=assets,
        identity_data=identity_data,
        generated_content=generated_content,
        landing_draft=landing_draft,
        ecommerce_data=ecommerce_data,
        ecommerce_public_summary=ecommerce_summary,
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
    if "flow_type" in update_data and update_data["flow_type"] is not None:
        workflow["flow_type"] = update_data["flow_type"]
        workflow["steps"] = _build_default_steps(update_data["flow_type"])
    if "steps" in update_data and update_data["steps"] is not None:
        incoming_steps = [step.model_dump() if isinstance(step, BrandSetupStepState) else step for step in update_data["steps"]]
        workflow["steps"] = [step.model_dump() for step in _normalize_steps([BrandSetupStepState(**row) for row in incoming_steps], flow_type=workflow.get("flow_type", "without_landing"))]
    if "identity_data" in update_data and update_data["identity_data"] is not None:
        payload_identity: BrandIdentityData = (
            update_data["identity_data"] if isinstance(update_data["identity_data"], BrandIdentityData) else BrandIdentityData(**update_data["identity_data"])
        )
        raw_payload["identity_data"] = payload_identity.model_dump()
        _sync_tenant_identity(db, tenant, payload_identity)
        flow_type = "with_existing_landing" if payload_identity.has_existing_landing else "without_landing"
        workflow["flow_type"] = flow_type
        workflow["steps"] = _merge_steps_with_flow(
            existing_steps=[BrandSetupStepState(**row) for row in workflow.get("steps", _build_default_steps(flow_type))],
            flow_type=flow_type,
        )
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
        flow_type = workflow.get("flow_type", "without_landing")
        existing_steps = [BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))]
        workflow["steps"] = [step.model_dump() for step in _normalize_steps(existing_steps, flow_type=flow_type)]
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
    flow_type = workflow.get("flow_type", "without_landing")
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))], flow_type=flow_type)
    _mark_step_in_progress(steps, "landing_setup" if flow_type == "without_landing" else "ecommerce_setup")
    workflow["steps"] = [step.model_dump() for step in steps]
    workflow["prompt_master"] = payload.prompt_master
    workflow["current_step"] = _next_step_code(steps)
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
    if not identity:
        raise HTTPException(status_code=400, detail="Primero completa la identidad de marca.")
    workflow = raw_payload.setdefault("workflow", {})
    flow_type = workflow.get("flow_type", "without_landing")
    if flow_type == "with_existing_landing":
        raise HTTPException(status_code=400, detail="La marca ya indico landing existente. Este paso no aplica.")
    prompt_master = (workflow.get("prompt_master") or "").strip()
    if not prompt_master and not generated:
        raise HTTPException(status_code=400, detail="Define el prompt maestro para generar la landing.")
    if not generated:
        generated = generate_brand_content(identity, prompt_master)
        raw_payload["generated_content"] = generated.model_dump()
    if raw_payload.get("landing_draft") and not payload.regenerate:
        raise HTTPException(status_code=400, detail="Ya existe una landing generada. Usa regenerar para reemplazarla.")
    landing_draft = generate_landing_draft(identity, generated)
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))], flow_type=flow_type)
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
    flow_type = workflow.get("flow_type", "without_landing")
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))], flow_type=flow_type)
    index = _step_index(step_code, flow_type=flow_type)
    if index < 0:
        raise HTTPException(status_code=404, detail="Paso no encontrado")
    for previous_step in steps[:index]:
        if not previous_step.approved:
            raise HTTPException(status_code=400, detail="No puedes aprobar este paso sin aprobar los anteriores.")
    target = steps[index]
    target.approved = True
    target.status = "approved"
    target.updated_at = datetime.utcnow()
    workflow["steps"] = [step.model_dump() for step in _normalize_steps(steps, flow_type=flow_type)]
    workflow["current_step"] = _next_step_code([BrandSetupStepState(**step) for step in workflow["steps"]])
    _save_brand_payload(config, raw_payload, db)
    return get_brand_setup_workflow(tenant.id, db)


@router.post("/{tenant_id}/ecommerce-public/activate", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def activate_brand_setup_ecommerce_public(
    tenant_id: int,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    summary = _build_ecommerce_public_summary(db, tenant_id)
    if not summary.ready_for_approval:
        raise HTTPException(
            status_code=400,
            detail="Aun no hay categorias y catalogo suficientes para aprobar el ecommerce publico.",
        )

    config, raw_payload = _load_brand_payload(db, tenant_id)
    workflow = raw_payload.setdefault("workflow", {})
    flow_type = workflow.get("flow_type", "without_landing")
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))], flow_type=flow_type)
    index = _step_index("ecommerce_setup", flow_type=flow_type)
    if index < 0:
        raise HTTPException(status_code=404, detail="Paso ecommerce publico no encontrado")
    for previous_step in steps[:index]:
        if not previous_step.approved:
            raise HTTPException(
                status_code=400,
                detail="Debes aprobar los pasos anteriores antes de activar ecommerce publico.",
            )

    target = steps[index]
    target.approved = True
    target.status = "approved"
    target.updated_at = datetime.utcnow()

    ecommerce_data = _parse_ecommerce_data(raw_payload) or BrandEcommerceData()
    ecommerce_data.categories_ready = summary.categories_count > 0
    ecommerce_data.products_ready = (summary.products_count + summary.services_count) > 0
    ecommerce_data.massive_upload_enabled = summary.last_import_valid_rows > 0
    raw_payload["ecommerce_data"] = ecommerce_data.model_dump()

    config.ecommerce_enabled = True
    config.is_initialized = True
    workflow["steps"] = [step.model_dump() for step in _normalize_steps(steps, flow_type=flow_type)]
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
    if asset_type not in ALLOWED_ASSET_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de archivo invalido para el wizard.")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Debes seleccionar un archivo valido.")
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imagenes para logo y base visual.")

    config, payload = _load_brand_payload(db, tenant_id)

    media_root = Path(__file__).resolve().parents[4] / "media" / f"tenant_{tenant_id}" / step_code
    media_root.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "").suffix or ".bin"
    generated_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{extension}"
    destination = media_root / generated_name
    relative_file = Path(f"tenant_{tenant_id}") / step_code / generated_name

    with destination.open("wb") as output:
        output.write(await file.read())

    asset = BrandSetupAssetRead(
        id=uuid.uuid4().hex,
        step_code=step_code,
        asset_type=asset_type,
        file_name=file.filename or generated_name,
        file_path=str(relative_file.as_posix()),
        file_url=f"/media/{relative_file.as_posix()}",
        uploaded_at=datetime.utcnow(),
    )
    assets = payload.setdefault("assets", [])
    assets.append(asset.model_dump(mode="json"))
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
    config.config_json = json.dumps(jsonable_encoder(payload), ensure_ascii=False)
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
    try:
        return BrandLandingDraft(**raw)
    except Exception:
        return None


def _parse_ecommerce_data(payload: dict) -> BrandEcommerceData | None:
    raw = payload.get("ecommerce_data")
    if not raw:
        return None
    try:
        return BrandEcommerceData(**raw)
    except Exception:
        return None


def _build_ecommerce_public_summary(db: Session, tenant_id: int) -> EcommercePublicSummary:
    categories_count = db.scalar(select(func.count()).select_from(Category).where(Category.tenant_id == tenant_id)) or 0
    products_count = db.scalar(select(func.count()).select_from(Product).where(Product.tenant_id == tenant_id)) or 0
    services_count = db.scalar(select(func.count()).select_from(ServiceOffering).where(ServiceOffering.tenant_id == tenant_id)) or 0
    stripe_products_synced = (
        db.scalar(
            select(func.count()).select_from(Product).where(
                Product.tenant_id == tenant_id,
                Product.stripe_product_id.is_not(None),
                Product.stripe_price_id_public.is_not(None),
            )
        )
        or 0
    )
    stripe_products_total = products_count
    if stripe_products_total == 0:
        stripe_sync_status = "pendiente"
    elif stripe_products_synced == stripe_products_total:
        stripe_sync_status = "si"
    elif stripe_products_synced == 0:
        stripe_sync_status = "no"
    else:
        stripe_sync_status = "pendiente"

    latest_import = db.scalar(
        select(CatalogImportJob)
        .where(CatalogImportJob.tenant_id == tenant_id)
        .order_by(CatalogImportJob.created_at.desc(), CatalogImportJob.id.desc())
    )

    has_catalog = categories_count > 0 and (products_count + services_count) > 0
    has_partial_data = bool(categories_count or products_count or services_count)
    if latest_import and latest_import.valid_rows > 0:
        has_partial_data = True

    step_status = "pending"
    if has_catalog:
        step_status = "ready"
    elif has_partial_data:
        step_status = "in_progress"

    return EcommercePublicSummary(
        categories_count=categories_count,
        products_count=products_count,
        services_count=services_count,
        stripe_products_synced=stripe_products_synced,
        stripe_products_total=stripe_products_total,
        stripe_sync_status=stripe_sync_status,
        last_import_at=latest_import.created_at if latest_import else None,
        last_import_total_rows=latest_import.total_rows if latest_import else 0,
        last_import_valid_rows=latest_import.valid_rows if latest_import else 0,
        last_import_error_rows=latest_import.error_rows if latest_import else 0,
        last_import_categories_created=latest_import.categories_created if latest_import else 0,
        last_import_products_created=latest_import.products_created if latest_import else 0,
        last_import_products_updated=latest_import.products_updated if latest_import else 0,
        import_completed=bool(latest_import and latest_import.valid_rows > 0 and latest_import.error_rows == 0),
        ready_for_approval=has_catalog,
        step_status=step_status,
    )


def _apply_ecommerce_step_status(steps: list[BrandSetupStepState], summary: EcommercePublicSummary) -> list[BrandSetupStepState]:
    for step in steps:
        if step.code != "ecommerce_setup":
            continue
        if step.approved:
            summary.step_status = "approved"
            step.status = "approved"
            return steps
        step.status = summary.step_status
        return steps
    return steps


def _parse_pos_setup_data(payload: dict) -> BrandPosSetupData | None:
    raw = payload.get("pos_setup_data")
    if not raw:
        return None
    try:
        return BrandPosSetupData(**raw)
    except Exception:
        return None


def _normalize_assets(rows: list[dict]) -> list[BrandSetupAssetRead]:
    assets: list[BrandSetupAssetRead] = []
    for row in rows:
        asset = dict(row)
        if not asset.get("file_url"):
            file_path = str(asset.get("file_path", "")).replace("\\", "/")
            if "/media/" in file_path:
                asset["file_url"] = file_path[file_path.index("/media/") :]
            elif file_path:
                cleaned = file_path.lstrip("./")
                if "tenant_" in cleaned:
                    tenant_index = cleaned.index("tenant_")
                    asset["file_url"] = f"/media/{cleaned[tenant_index:]}"
                else:
                    asset["file_url"] = f"/media/{cleaned}"
            else:
                asset["file_url"] = None
        assets.append(BrandSetupAssetRead(**asset))
    return assets


def _step_index(step_code: str, flow_type: str = "without_landing") -> int:
    for idx, row in enumerate(_build_default_steps(flow_type)):
        if row["code"] == step_code:
            return idx
    return -1


def _normalize_steps(steps: list[BrandSetupStepState], flow_type: str = "without_landing") -> list[BrandSetupStepState]:
    defaults = _build_default_steps(flow_type)
    by_code = {step.code: step for step in steps}
    normalized: list[BrandSetupStepState] = []
    previous_approved = True
    for default in defaults:
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


def _build_default_steps(flow_type: str) -> list[dict]:
    if flow_type == "with_existing_landing":
        return [row.copy() for row in DEFAULT_STEPS_WITH_EXISTING_LANDING]
    return [row.copy() for row in DEFAULT_STEPS_WITHOUT_LANDING]


def _merge_steps_with_flow(existing_steps: list[BrandSetupStepState], flow_type: str) -> list[dict]:
    incoming_by_code = {step.code: step for step in existing_steps}
    merged: list[BrandSetupStepState] = []
    for default in _build_default_steps(flow_type):
        code = default["code"]
        existing = incoming_by_code.get(code)
        if existing:
            merged.append(existing)
        else:
            merged.append(BrandSetupStepState(**default))
    normalized = _normalize_steps(merged, flow_type=flow_type)
    return [step.model_dump() for step in normalized]
