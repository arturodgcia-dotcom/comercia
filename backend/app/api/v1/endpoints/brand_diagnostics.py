import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_reinpia_admin
from app.db.session import get_db
from app.models.models import BrandDiagnostic, Tenant, User
from app.schemas.brand_diagnostics import (
    BrandDiagnosticExternalUrlRequest,
    BrandDiagnosticImprovementPlanRequest,
    BrandDiagnosticRead,
    BrandDiagnosticSummaryRead,
)
from app.services.brand_diagnostics_service import (
    collect_diagnostic_context,
    collect_external_url_context,
    parse_diagnostic_row,
    persist_diagnostic_result,
    run_diagnostic,
)

router = APIRouter()


def _ensure_tenant_scope(current_user: User, tenant_id: int) -> None:
    if current_user.role == "reinpia_admin":
        return
    if current_user.role in {"tenant_admin", "tenant_staff"} and current_user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin acceso a esta marca.")


def _tenant_or_404(db: Session, tenant_id: int) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Marca no encontrada.")
    return tenant


def _as_read_payload(row: BrandDiagnostic) -> BrandDiagnosticRead:
    payload = parse_diagnostic_row(row)
    payload["scores"] = {
        "seo": payload["scores"]["seo"],
        "aeo": payload["scores"]["aeo"],
        "branding": payload["scores"]["branding"],
        "global": payload["scores"]["global"],
    }
    return BrandDiagnosticRead(**payload)


@router.post("/brand-diagnostics/{tenant_id}/analyze", response_model=BrandDiagnosticRead)
def analyze_brand(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandDiagnosticRead:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    context = collect_diagnostic_context(db, tenant_id)
    result = run_diagnostic(context)
    row = persist_diagnostic_result(db, result)
    return _as_read_payload(row)


@router.post("/brand-diagnostics/analyze-external-url", response_model=BrandDiagnosticRead)
def analyze_external_url(
    body: BrandDiagnosticExternalUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandDiagnosticRead:
    requested_tenant_id = body.tenant_id
    if current_user.role in {"tenant_admin", "tenant_staff"}:
        tenant_id = current_user.tenant_id
    else:
        tenant_id = requested_tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes indicar tenant_id para analizar URL externa en contexto global.",
        )
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    try:
        context = collect_external_url_context(db, tenant_id, str(body.url))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    result = run_diagnostic(context)
    row = persist_diagnostic_result(db, result)
    return _as_read_payload(row)


@router.get("/brand-diagnostics/{tenant_id}/latest", response_model=BrandDiagnosticRead)
def get_latest_brand_diagnostic(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandDiagnosticRead:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    rows = db.scalars(
        select(BrandDiagnostic)
        .where(BrandDiagnostic.tenant_id == tenant_id)
        .order_by(BrandDiagnostic.analyzed_at.desc(), BrandDiagnostic.id.desc())
        .limit(50)
    ).all()
    row = None
    for candidate in rows:
        parsed = parse_diagnostic_row(candidate)
        if parsed.get("analysis_type") == "internal_brand":
            row = candidate
            break
    if row is None and rows:
        row = rows[0]
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aun no hay diagnosticos para esta marca.")
    return _as_read_payload(row)


@router.get("/brand-diagnostics/{tenant_id}/latest-external", response_model=BrandDiagnosticRead)
def get_latest_external_brand_diagnostic(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandDiagnosticRead:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    rows = db.scalars(
        select(BrandDiagnostic)
        .where(BrandDiagnostic.tenant_id == tenant_id)
        .order_by(BrandDiagnostic.analyzed_at.desc(), BrandDiagnostic.id.desc())
        .limit(50)
    ).all()
    row = None
    for candidate in rows:
        parsed = parse_diagnostic_row(candidate)
        if parsed.get("analysis_type") == "external_url":
            row = candidate
            break
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aun no hay diagnostico externo para esta marca.")
    return _as_read_payload(row)


@router.get("/brand-diagnostics/{tenant_id}", response_model=list[BrandDiagnosticSummaryRead])
def list_brand_diagnostics(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BrandDiagnosticSummaryRead]:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    rows = db.scalars(
        select(BrandDiagnostic)
        .where(BrandDiagnostic.tenant_id == tenant_id)
        .order_by(BrandDiagnostic.analyzed_at.desc(), BrandDiagnostic.id.desc())
        .limit(30)
    ).all()
    payload: list[BrandDiagnosticSummaryRead] = []
    for row in rows:
        parsed = parse_diagnostic_row(row)
        payload.append(
            BrandDiagnosticSummaryRead(
                id=row.id,
                tenant_id=row.tenant_id,
                brand_name=parsed["brand_name"],
                analysis_type=str(parsed.get("analysis_type") or "internal_brand"),
                source_url=parsed.get("source_url"),
                analyzed_at=row.analyzed_at,
                status=row.status,
                global_score=row.global_score,
            )
        )
    return payload


@router.post("/brand-diagnostics/{tenant_id}/improvement-plan", response_model=BrandDiagnosticRead)
def save_brand_diagnostic_improvement_plan(
    tenant_id: int,
    body: BrandDiagnosticImprovementPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandDiagnosticRead:
    _tenant_or_404(db, tenant_id)
    _ensure_tenant_scope(current_user, tenant_id)
    rows = db.scalars(
        select(BrandDiagnostic)
        .where(BrandDiagnostic.tenant_id == tenant_id)
        .order_by(BrandDiagnostic.analyzed_at.desc(), BrandDiagnostic.id.desc())
        .limit(50)
    ).all()
    row = None
    for candidate in rows:
        parsed = parse_diagnostic_row(candidate)
        if parsed.get("analysis_type") == "internal_brand":
            row = candidate
            break
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay diagnostico interno previo para guardar un plan de mejora.",
        )
    improvement_payload = body.model_dump()
    improvement_payload["updated_at"] = datetime.utcnow().isoformat()
    row.improvement_plan_json = json.dumps(improvement_payload, ensure_ascii=False)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _as_read_payload(row)


@router.get("/reinpia/diagnostics", response_model=list[BrandDiagnosticSummaryRead], dependencies=[Depends(get_reinpia_admin)])
def list_global_diagnostics(
    db: Session = Depends(get_db),
) -> list[BrandDiagnosticSummaryRead]:
    rows = db.scalars(
        select(BrandDiagnostic).order_by(BrandDiagnostic.analyzed_at.desc(), BrandDiagnostic.id.desc()).limit(100)
    ).all()
    payload: list[BrandDiagnosticSummaryRead] = []
    for row in rows:
        parsed = parse_diagnostic_row(row)
        payload.append(
            BrandDiagnosticSummaryRead(
                id=row.id,
                tenant_id=row.tenant_id,
                brand_name=parsed["brand_name"],
                analysis_type=str(parsed.get("analysis_type") or "internal_brand"),
                source_url=parsed.get("source_url"),
                analyzed_at=row.analyzed_at,
                status=row.status,
                global_score=row.global_score,
            )
        )
    return payload
