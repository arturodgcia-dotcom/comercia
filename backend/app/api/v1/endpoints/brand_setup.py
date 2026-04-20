import json
import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import CatalogImportJob, Category, MercadoPagoSettings, PosLocation, Product, ServiceOffering, StorefrontConfig, Tenant, TenantBranding, User
from app.schemas.brand_setup import (
    BrandChannelSettingsRead,
    BrandChannelSettingsUpdate,
    BrandChannelRoutesRead,
    BrandChannelRuntimeRead,
    BrandSetupAssetRead,
    BrandGenerateContentRequest,
    BrandGenerateLandingRequest,
    BrandGeneratedContent,
    EcommercePublicSummary,
    BrandEcommerceData,
    BrandIdentityData,
    BrandLandingDraft,
    BrandPlanAddonRead,
    BrandPlanMetricRead,
    BrandPlanSnapshotRead,
    BrandPosSetupData,
    BrandSetupStepState,
    BrandSetupWorkflowRead,
    BrandSetupWorkflowUpdate,
)
from app.services.brand_setup_generator import generate_brand_content, generate_landing_draft
from app.services.commercial_account_guard_service import build_account_usage_payload, get_tenant_commercial_account
from app.services.commercial_plan_service import COMMERCIAL_ADDONS, parse_limits
from app.services.product_identity_service import resolve_product_identity
from app.services.tenant_config_service import normalize_billing_config

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
    {"code": "landing_setup", "title": "Landing", "status": "pending", "approved": False},
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

OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS = {
    "landing_template": "retail_landing_impacto_v1",
    "public_store_template": "retail_public_store_impacto_v1",
    "distributor_store_template": "retail_distributor_store_impacto_v1",
    "webapp_template": "retail_webapp_impacto_v1",
}

DEFAULT_BILLING_CONFIG = {
    "billing_model": "fixed_subscription",
    "commission_enabled": False,
    "commission_percentage": "0.00",
    "commission_scope": "ventas_online_pagadas",
    "commission_notes": None,
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
    channel_templates = _resolve_channel_templates(payload, workflow)
    identity_data = _parse_identity(payload)
    generated_content = _parse_generated_content(payload)
    landing_draft = _parse_landing_draft(payload)
    ecommerce_data = _parse_ecommerce_data(payload)
    pos_setup_data = _parse_pos_setup_data(payload)
    billing_config = _resolve_billing_config(payload, tenant)
    plan_snapshot, blocking_issues = _resolve_plan_snapshot(db, tenant)
    channel_runtime = _resolve_channel_runtime(payload, identity_data)
    channel_routes = _build_channel_routes(tenant.slug)
    wizard_status = _resolve_wizard_status(steps=steps, is_published=bool(workflow.get("is_published", False)), blocking_issues=blocking_issues)

    return BrandSetupWorkflowRead(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        tenant_slug=tenant.slug,
        current_step=current_step,
        is_published=bool(workflow.get("is_published", False)),
        prompt_master=workflow.get("prompt_master"),
        selected_template=channel_templates["landing_template"],
        landing_template=channel_templates["landing_template"],
        public_store_template=channel_templates["public_store_template"],
        distributor_store_template=channel_templates["distributor_store_template"],
        webapp_template=channel_templates["webapp_template"],
        billing_model=billing_config["billing_model"],
        commission_percentage=float(Decimal(str(billing_config["commission_percentage"]))),
        commission_enabled=bool(billing_config["commission_enabled"]),
        commission_scope=billing_config["commission_scope"],
        commission_notes=billing_config["commission_notes"],
        commercial_plan_key=tenant.commercial_plan_key,
        commercial_plan_status=tenant.commercial_plan_status,
        ai_tokens_balance=int(tenant.ai_tokens_balance or 0),
        ai_tokens_locked=bool(tenant.ai_tokens_locked),
        wizard_status=wizard_status,
        plan_snapshot=plan_snapshot,
        channel_runtime=channel_runtime,
        channel_routes=channel_routes,
        blocking_issues=blocking_issues,
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
    channel_templates = _resolve_channel_templates(raw_payload, workflow)
    billing_config = _resolve_billing_config(raw_payload, tenant)

    update_data = payload.model_dump(exclude_unset=True)
    for key in ("current_step", "is_published", "prompt_master"):
        if key in update_data:
            workflow[key] = update_data[key]
    force_plan_override = bool(update_data.get("force_plan_override"))
    billing_updates = {}
    for key in ("billing_model", "commission_percentage", "commission_enabled", "commission_scope", "commission_notes"):
        if key in update_data:
            billing_updates[key] = update_data[key]
    if billing_updates and force_plan_override:
        billing_config = normalize_billing_config(
            billing_model=billing_updates.get("billing_model", billing_config["billing_model"]),
            commission_percentage=billing_updates.get("commission_percentage", billing_config["commission_percentage"]),
            commission_enabled=billing_updates.get("commission_enabled", billing_config["commission_enabled"]),
            commission_scope=billing_updates.get("commission_scope", billing_config["commission_scope"]),
            commission_notes=billing_updates.get("commission_notes", billing_config["commission_notes"]),
            tenant_plan_type=tenant.plan_type,
            plan_commission_enabled=False,
        )
        _apply_billing_config(raw_payload, billing_config)
        _sync_tenant_billing(tenant, billing_config)
    elif billing_updates:
        # El wizard no puede alterar plan/comision sin override explicito de admin global.
        billing_updates = {}
    workflow["selected_template"] = OFFICIAL_CHANNEL_TEMPLATE_DEFAULTS["landing_template"]
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
        _set_channel_regeneration(raw_payload, "landing")
    if "ecommerce_data" in update_data and update_data["ecommerce_data"] is not None:
        ecommerce_data: BrandEcommerceData = (
            update_data["ecommerce_data"]
            if isinstance(update_data["ecommerce_data"], BrandEcommerceData)
            else BrandEcommerceData(**update_data["ecommerce_data"])
        )
        raw_payload["ecommerce_data"] = ecommerce_data.model_dump()
    if "public_store_template" in update_data:
        _set_channel_regeneration(raw_payload, "public")
    if "distributor_store_template" in update_data:
        _set_channel_regeneration(raw_payload, "distributors")
    if "webapp_template" in update_data:
        workflow["webapp_template"] = str(update_data["webapp_template"] or channel_templates["webapp_template"])
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
    channel_templates = _resolve_channel_templates(raw_payload, workflow)
    _apply_channel_templates(raw_payload, channel_templates)
    if not billing_updates:
        _apply_billing_config(raw_payload, billing_config)
        _sync_tenant_billing(tenant, billing_config)

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
    _set_channel_regeneration(raw_payload, "landing")
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


@router.post("/{tenant_id}/ecommerce-template/apply", response_model=BrandSetupWorkflowRead, dependencies=[Depends(get_reinpia_admin)])
def apply_ecommerce_template(
    tenant_id: int,
    db: Session = Depends(get_db),
) -> BrandSetupWorkflowRead:
    tenant = _get_tenant_or_404(db, tenant_id)
    plan_snapshot, _ = _resolve_plan_snapshot(db, tenant)
    products_limit = _metric_limit(plan_snapshot.metrics, "products_max")
    current_products = int(db.scalar(select(func.count()).select_from(Product).where(Product.tenant_id == tenant.id)) or 0)
    projected_products = current_products + 3
    if products_limit > 0 and projected_products > products_limit:
        raise HTTPException(
            status_code=400,
            detail=f"El plan activo permite {products_limit} productos y la regeneracion proyecta {projected_products}. Solicita add-on o upgrade.",
        )

    category_specs = [
        {"name": "Paquetes destacados", "description": "Ofertas base para venta publica y distribuidores."},
        {"name": "Catalogo general", "description": "Productos clave listos para operar."},
        {"name": "Mayoreo", "description": "Productos con enfoque de distribucion."},
    ]
    categories_by_slug: dict[str, Category] = {
        row.slug: row for row in db.scalars(select(Category).where(Category.tenant_id == tenant.id)).all()
    }
    created_categories = 0
    for spec in category_specs:
        base_slug = _slugify(spec["name"])
        category = categories_by_slug.get(base_slug)
        if category:
            continue
        category = Category(
            tenant_id=tenant.id,
            name=spec["name"],
            slug=_next_available_slug(
                db=db,
                tenant_id=tenant.id,
                model=Category,
                base_slug=base_slug,
            ),
            description=spec["description"],
            is_active=True,
        )
        db.add(category)
        db.flush()
        categories_by_slug[category.slug] = category
        created_categories += 1

    products_by_slug: dict[str, Product] = {
        row.slug: row for row in db.scalars(select(Product).where(Product.tenant_id == tenant.id)).all()
    }
    created_products = 0
    updated_products = 0
    product_specs = [
        {
            "name": "Kit Inicio Ecommerce",
            "category": "Paquetes destacados",
            "description": "Pack inicial para activar catalogo publico.",
            "price_public": Decimal("1299.00"),
            "price_retail": Decimal("1199.00"),
            "price_wholesale": Decimal("1099.00"),
        },
        {
            "name": "Producto Demostracion Publico",
            "category": "Catalogo general",
            "description": "Producto muestra para validar flujo storefront.",
            "price_public": Decimal("399.00"),
            "price_retail": Decimal("359.00"),
            "price_wholesale": Decimal("319.00"),
        },
        {
            "name": "Producto Demostracion Distribuidor",
            "category": "Mayoreo",
            "description": "Producto muestra para simulacion de mayoreo.",
            "price_public": Decimal("699.00"),
            "price_retail": Decimal("649.00"),
            "price_wholesale": Decimal("599.00"),
        },
    ]
    for spec in product_specs:
        base_slug = _slugify(spec["name"])
        category_slug = _slugify(spec["category"])
        category = categories_by_slug.get(category_slug)
        if not category:
            continue
        product = products_by_slug.get(base_slug)
        if product:
            product.category_id = category.id
            product.description = spec["description"]
            if not (product.sku or "").strip() or not (product.barcode or "").strip():
                identity = resolve_product_identity(
                    db,
                    tenant_id=tenant.id,
                    category_id=category.id,
                    incoming_sku=product.sku,
                    incoming_barcode=product.barcode,
                    incoming_barcode_type=product.barcode_type,
                    incoming_external_barcode=product.external_barcode,
                )
                product.sku = str(identity["sku"])
                product.barcode = str(identity["barcode"])
                product.barcode_type = str(identity["barcode_type"])
                product.external_barcode = bool(identity["external_barcode"])
                product.auto_generated = bool(identity["auto_generated"])
            product.price_public = spec["price_public"]
            product.price_retail = spec["price_retail"]
            product.price_wholesale = spec["price_wholesale"]
            product.is_active = True
            updated_products += 1
            continue
        product = Product(
            tenant_id=tenant.id,
            category_id=category.id,
            name=spec["name"],
            slug=_next_available_slug(
                db=db,
                tenant_id=tenant.id,
                model=Product,
                base_slug=base_slug,
            ),
            **resolve_product_identity(
                db,
                tenant_id=tenant.id,
                category_id=category.id,
                incoming_sku=None,
                incoming_barcode=None,
                incoming_barcode_type="code128",
                incoming_external_barcode=False,
            ),
            description=spec["description"],
            price_public=spec["price_public"],
            price_retail=spec["price_retail"],
            price_wholesale=spec["price_wholesale"],
            is_featured=True,
            is_active=True,
        )
        db.add(product)
        db.flush()
        products_by_slug[product.slug] = product
        created_products += 1

    services_by_slug: dict[str, ServiceOffering] = {
        row.slug: row for row in db.scalars(select(ServiceOffering).where(ServiceOffering.tenant_id == tenant.id)).all()
    }
    service_base_slug = _slugify("Servicio Demo Ecommerce")
    if service_base_slug not in services_by_slug:
        category = categories_by_slug.get(_slugify("Catalogo general"))
        service = ServiceOffering(
            tenant_id=tenant.id,
            category_id=category.id if category else None,
            name="Servicio Demo Ecommerce",
            slug=_next_available_slug(
                db=db,
                tenant_id=tenant.id,
                model=ServiceOffering,
                base_slug=service_base_slug,
            ),
            description="Servicio base para pruebas de agenda/checkout.",
            duration_minutes=60,
            price=Decimal("490.00"),
            is_active=True,
            is_featured=True,
            requires_schedule=True,
        )
        db.add(service)

    config, payload = _load_brand_payload(db, tenant_id)
    channel_templates = _resolve_channel_templates(payload, payload.get("workflow", {}))
    _apply_channel_templates(payload, channel_templates)
    ecommerce_data = _parse_ecommerce_data(payload) or BrandEcommerceData()
    ecommerce_data.catalog_mode = "bulk"
    ecommerce_data.categories_ready = True
    ecommerce_data.products_ready = True
    ecommerce_data.massive_upload_enabled = True
    ecommerce_data.distributor_catalog_ready = True
    ecommerce_data.volume_rules_ready = True
    payload["ecommerce_data"] = ecommerce_data.model_dump()
    _set_channel_regeneration(payload, "public")
    _set_channel_regeneration(payload, "distributors")

    workflow = payload.setdefault("workflow", {})
    flow_type = workflow.get("flow_type", "without_landing")
    steps = _normalize_steps([BrandSetupStepState(**step) for step in workflow.get("steps", _build_default_steps(flow_type))], flow_type=flow_type)
    _mark_step_in_progress(steps, "ecommerce_setup")
    workflow["steps"] = [step.model_dump() for step in steps]
    workflow["current_step"] = _next_step_code(steps)

    template_job = CatalogImportJob(
        tenant_id=tenant.id,
        source="wizard_template",
        total_rows=created_products + updated_products,
        valid_rows=created_products + updated_products,
        error_rows=0,
        categories_created=created_categories,
        products_created=created_products,
        products_updated=updated_products,
        status="completed",
        notes=f"Plantilla ecommerce aplicada desde wizard ({datetime.utcnow().isoformat()})",
    )
    db.add(template_job)

    config.config_json = json.dumps(jsonable_encoder(payload), ensure_ascii=False)
    db.add(config)
    db.commit()
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


def _resolve_channel_templates(payload: dict, workflow: dict | None = None) -> dict[str, str]:
    identity = payload.get("identity_data", {})
    if not isinstance(identity, dict):
        identity = {}
    sector_raw = str(identity.get("sector") or "").strip().lower()
    style_raw = str(identity.get("visual_style") or "").strip().lower()
    business_type = str(identity.get("business_type") or "").strip().lower()

    sector_map = {
        "alimentos": "alimentos",
        "restaurante": "alimentos",
        "comida": "alimentos",
        "ropa": "ropa",
        "moda": "ropa",
        "servicios": "servicios",
        "barberia": "servicios",
        "maquinaria": "maquinaria",
        "industrial": "maquinaria",
        "salud": "salud",
        "belleza": "belleza",
        "educacion": "educacion",
        "retail": "retail",
        "distribuidores": "distribuidores",
        "b2b": "distribuidores",
    }
    style_map = {"impacto": "impacto", "editorial": "editorial", "minimal": "minimal"}

    if sector_raw in sector_map:
        sector = sector_map[sector_raw]
    elif business_type == "services":
        sector = "servicios"
    elif business_type == "products":
        sector = "retail"
    else:
        sector = "distribuidores"
    style = style_map.get(style_raw, "impacto")

    def _template(channel: str) -> str:
        return f"{sector}_{channel}_{style}_v1"

    return {
        "landing_template": _template("landing"),
        "public_store_template": _template("public_store"),
        "distributor_store_template": _template("distributor_store"),
        "webapp_template": _template("webapp"),
    }


def _apply_channel_templates(payload: dict, templates: dict[str, str]) -> None:
    payload["landing_template"] = templates["landing_template"]
    payload["public_store_template"] = templates["public_store_template"]
    payload["distributor_store_template"] = templates["distributor_store_template"]
    payload["webapp_template"] = templates["webapp_template"]
    workflow = payload.setdefault("workflow", {})
    if isinstance(workflow, dict):
        workflow["selected_template"] = templates["landing_template"]
        workflow["webapp_template"] = templates["webapp_template"]
    payload["channel_templates"] = {
        "landing_template": templates["landing_template"],
        "public_store_template": templates["public_store_template"],
        "distributor_store_template": templates["distributor_store_template"],
        "webapp_template": templates["webapp_template"],
    }


def _resolve_billing_config(payload: dict, tenant: Tenant) -> dict[str, str | bool | None]:
    billing_payload = payload.get("billing_config", {})
    if not isinstance(billing_payload, dict):
        billing_payload = {}
    has_paid_plan = (tenant.commercial_plan_status or "").lower() == "paid" and bool((tenant.commercial_plan_key or "").strip())
    source_billing_model = tenant.billing_model if has_paid_plan else (payload.get("billing_model") or billing_payload.get("billing_model") or tenant.billing_model)
    source_commission_percentage = (
        tenant.commission_percentage
        if has_paid_plan
        else payload.get("commission_percentage") or billing_payload.get("commission_percentage") or tenant.commission_percentage
    )
    source_commission_enabled = tenant.commission_enabled if has_paid_plan else (
        payload.get("commission_enabled")
        if payload.get("commission_enabled") is not None
        else billing_payload.get("commission_enabled")
        if billing_payload.get("commission_enabled") is not None
        else tenant.commission_enabled
    )
    source_commission_scope = tenant.commission_scope if has_paid_plan else (
        payload.get("commission_scope") or billing_payload.get("commission_scope") or tenant.commission_scope
    )
    source_commission_notes = tenant.commission_notes if has_paid_plan else (
        payload.get("commission_notes") or billing_payload.get("commission_notes") or tenant.commission_notes
    )
    resolved = normalize_billing_config(
        billing_model=source_billing_model,
        commission_percentage=source_commission_percentage,
        commission_enabled=source_commission_enabled,
        commission_scope=source_commission_scope,
        commission_notes=source_commission_notes,
        tenant_plan_type=tenant.plan_type,
        plan_commission_enabled=bool(tenant.commission_enabled),
    )
    for key, fallback in DEFAULT_BILLING_CONFIG.items():
        if resolved.get(key) in (None, ""):
            resolved[key] = fallback
    return resolved


def _apply_billing_config(payload: dict, config: dict[str, str | bool | None]) -> None:
    payload["billing_model"] = config["billing_model"]
    payload["commission_percentage"] = config["commission_percentage"]
    payload["commission_enabled"] = bool(config["commission_enabled"])
    payload["commission_scope"] = config["commission_scope"]
    payload["commission_notes"] = config["commission_notes"]
    payload["billing_config"] = {
        "billing_model": config["billing_model"],
        "commission_percentage": config["commission_percentage"],
        "commission_enabled": bool(config["commission_enabled"]),
        "commission_scope": config["commission_scope"],
        "commission_notes": config["commission_notes"],
    }


def _sync_tenant_billing(tenant: Tenant, config: dict[str, str | bool | None]) -> None:
    tenant.billing_model = str(config["billing_model"])
    tenant.commission_enabled = bool(config["commission_enabled"])
    tenant.commission_percentage = Decimal(str(config["commission_percentage"]))
    tenant.commission_scope = str(config["commission_scope"])
    tenant.commission_notes = config["commission_notes"]
    tenant.plan_type = "commission" if tenant.billing_model == "commission_based" else "subscription"
    if tenant.commission_enabled:
        rate = (tenant.commission_percentage / Decimal("100")).quantize(Decimal("0.0001"))
        tenant.commission_rules_json = json.dumps(
            {
                "tiers": [{"up_to": None, "rate": str(rate), "label": "Comision general"}],
                "minimum_per_operation": None,
            }
        )
    else:
        tenant.commission_rules_json = json.dumps(
            {"tiers": [{"up_to": None, "rate": "0", "label": "Sin comision"}], "minimum_per_operation": None}
        )


def _parse_json_dict(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _resolve_plan_snapshot(db: Session, tenant: Tenant) -> tuple[BrandPlanSnapshotRead, list[str]]:
    account = get_tenant_commercial_account(db, tenant.id)
    limits = parse_limits(tenant)
    usage = {
        "brands_used": 1,
        "users_used": int(db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant.id)) or 0),
        "products_used": int(db.scalar(select(func.count(Product.id)).where(Product.tenant_id == tenant.id)) or 0),
        "branches_used": int(db.scalar(select(func.count(PosLocation.id)).where(PosLocation.tenant_id == tenant.id)) or 0),
        "ai_tokens_included": int(tenant.ai_tokens_included or 0),
        "ai_tokens_used": int(tenant.ai_tokens_used or 0),
        "ai_tokens_balance": int(tenant.ai_tokens_balance or 0),
    }
    addon_quantities: dict[str, int] = {}
    if account:
        usage = build_account_usage_payload(db, account)
        account_limits = _parse_json_dict(account.commercial_limits_json)
        if account_limits:
            limits = account_limits
        addon_quantities = _parse_json_dict(account.addons_json)
    else:
        addon_quantities = {}

    active_addons: list[BrandPlanAddonRead] = []
    addon_name_map = {str(row["id"]): str(row["name"]) for row in COMMERCIAL_ADDONS}
    for addon_id, qty in addon_quantities.items():
        try:
            quantity = int(qty)
        except Exception:
            quantity = 0
        if quantity <= 0:
            continue
        active_addons.append(BrandPlanAddonRead(id=str(addon_id), name=addon_name_map.get(str(addon_id), str(addon_id)), quantity=quantity))

    ai_agents_base = int(limits.get("ai_agents_max") or 0)
    ai_agents_limit = ai_agents_base + max(0, int(addon_quantities.get("extra_ai_agent", 0) or 0))
    ai_agents_used = 0

    metrics = [
        _build_metric("brands_max", "Marcas permitidas", int(usage.get("brands_limit") or limits.get("brands_max") or 0), int(usage.get("brands_used") or 0)),
        _build_metric("users_max", "Usuarios permitidos", int(usage.get("users_limit") or limits.get("users_max") or 0), int(usage.get("users_used") or 0)),
        _build_metric("ai_agents_max", "Agentes IA permitidos", ai_agents_limit, ai_agents_used),
        _build_metric("products_max", "Productos permitidos", int(usage.get("products_limit") or limits.get("products_max") or 0), int(usage.get("products_used") or 0)),
        _build_metric("branches_max", "Sucursales permitidas", int(usage.get("branches_limit") or limits.get("branches_max") or 0), int(usage.get("branches_used") or 0)),
        _build_metric(
            "ia_tokens_total",
            "Creditos IA incluidos",
            int(usage.get("ai_tokens_included") or limits.get("ia_tokens_total") or tenant.ai_tokens_included or 0),
            int(usage.get("ai_tokens_used") or tenant.ai_tokens_used or 0),
        ),
    ]

    blocking_issues: list[str] = []
    if (tenant.commercial_plan_status or "").lower() != "paid" or not tenant.commercial_plan_key:
        blocking_issues.append("La marca no tiene un plan pagado confirmado desde Stripe.")
    for metric in metrics:
        if metric.is_exceeded:
            blocking_issues.append(f"{metric.label}: limite excedido ({metric.used}/{metric.limit}).")
    if bool(tenant.ai_tokens_locked):
        blocking_issues.append("La llave de creditos IA esta bloqueada.")

    snapshot = BrandPlanSnapshotRead(
        commercial_plan_key=tenant.commercial_plan_key,
        commercial_plan_status=tenant.commercial_plan_status or "not_purchased",
        commercial_plan_source=tenant.commercial_plan_source,
        billing_model=tenant.billing_model or "fixed_subscription",
        commission_enabled=bool(tenant.commission_enabled),
        commission_percentage=float(Decimal(str(tenant.commission_percentage or 0))),
        limits=limits,
        metrics=metrics,
        addons=active_addons,
        ai_tokens_included=int(usage.get("ai_tokens_included") or tenant.ai_tokens_included or 0),
        ai_tokens_balance=int(usage.get("ai_tokens_balance") or tenant.ai_tokens_balance or 0),
        ai_tokens_used=int(usage.get("ai_tokens_used") or tenant.ai_tokens_used or 0),
        ai_tokens_locked=bool(tenant.ai_tokens_locked),
        is_paid_plan=(tenant.commercial_plan_status or "").lower() == "paid",
    )
    return snapshot, blocking_issues


def _build_metric(key: str, label: str, limit: int, used: int) -> BrandPlanMetricRead:
    safe_limit = max(0, int(limit))
    safe_used = max(0, int(used))
    remaining = safe_limit - safe_used
    return BrandPlanMetricRead(
        key=key,
        label=label,
        limit=safe_limit,
        used=safe_used,
        remaining=remaining,
        is_exceeded=safe_limit > 0 and safe_used > safe_limit,
    )


def _metric_limit(metrics: list[BrandPlanMetricRead], key: str) -> int:
    for metric in metrics:
        if metric.key == key:
            return int(metric.limit)
    return 0


def _build_channel_routes(tenant_slug: str) -> BrandChannelRoutesRead:
    safe_slug = tenant_slug or "sin-slug"
    landing = f"/store/{safe_slug}/landing"
    public = f"/store/{safe_slug}"
    distributors = f"/store/{safe_slug}/distribuidores"
    return BrandChannelRoutesRead(
        landing_url=landing,
        landing_preview_url=f"{landing}?preview=1",
        public_url=public,
        public_preview_url=f"{public}?preview=1",
        distributors_url=distributors,
        distributors_preview_url=f"{distributors}?preview=1",
        pos_preview_url=f"/store/{safe_slug}/webapp-preview",
    )


def _parse_iso_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        normalized = raw.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


def _resolve_channel_runtime(payload: dict, identity: BrandIdentityData | None) -> BrandChannelRuntimeRead:
    runtime = payload.get("channel_runtime", {})
    if not isinstance(runtime, dict):
        runtime = {}
    external_url = None
    external_registered = False
    if identity:
        external_url = (identity.existing_landing_url or "").strip() or None
        external_registered = bool(identity.has_existing_landing and external_url)
    return BrandChannelRuntimeRead(
        landing_external_registered=external_registered,
        landing_external_url=external_url,
        landing_preview_internal_available=True,
        landing_review_mode="externa_con_preview_interno" if external_registered else "interno",
        landing_last_regenerated_at=_parse_iso_datetime(runtime.get("landing_last_regenerated_at")),
        public_last_regenerated_at=_parse_iso_datetime(runtime.get("public_last_regenerated_at")),
        distributors_last_regenerated_at=_parse_iso_datetime(runtime.get("distributors_last_regenerated_at")),
    )


def _set_channel_regeneration(payload: dict, channel: str) -> None:
    runtime = payload.setdefault("channel_runtime", {})
    if not isinstance(runtime, dict):
        runtime = {}
        payload["channel_runtime"] = runtime
    now = datetime.utcnow().isoformat()
    if channel == "landing":
        runtime["landing_last_regenerated_at"] = now
    elif channel == "public":
        runtime["public_last_regenerated_at"] = now
    elif channel == "distributors":
        runtime["distributors_last_regenerated_at"] = now


def _resolve_wizard_status(*, steps: list[BrandSetupStepState], is_published: bool, blocking_issues: list[str]) -> str:
    if is_published:
        return "publicada"
    final_step = next((step for step in steps if step.code == "final_review"), None)
    non_final = [step for step in steps if step.code != "final_review"]
    if final_step and final_step.approved:
        return "lista para publicacion"
    if non_final and all(step.approved for step in non_final):
        if blocking_issues:
            return "lista para revision"
        return "lista para publicacion"
    if any(step.approved or step.status == "in_progress" for step in steps):
        return "en configuracion"
    return "borrador"


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


def _slugify(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")


def _next_available_slug(*, db: Session, tenant_id: int, model: type[Category | Product | ServiceOffering], base_slug: str) -> str:
    slug = base_slug
    suffix = 2
    while db.scalar(select(model).where(model.tenant_id == tenant_id, model.slug == slug)):
        slug = f"{base_slug}-{suffix}"
        suffix += 1
    return slug
