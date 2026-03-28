from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import OnboardingGuide, OnboardingStep, User, UserOnboardingProgress


def ensure_default_onboarding_guides(db: Session) -> None:
    _ensure_guide(
        db,
        code="sales_onboarding",
        title="Onboarding Comercial REINPIA",
        audience="sales",
        description="Guia para vender COMERCIA de forma estructurada.",
        steps=[
            ("Introduccion a COMERCIA", "COMERCIA centraliza landing, ecommerce, growth y operacion."),
            ("Que problema resuelve", "Elimina dispersion de herramientas y mejora control comercial."),
            ("Que incluye", "Landing, ecommerce, fidelizacion, distribuidores, logistica y reporting."),
            ("Como se vende", "Diagnostico, recomendacion de plan y siguiente accion clara."),
            ("IMPULSA vs ESCALA", "IMPULSA para arranque, ESCALA para crecimiento y automatizacion."),
            ("Registro de leads", "Usar formulario de lead en /comercia y panel de seguimiento."),
            ("Clave de comisionista", "Capturar o leer ?ref para trazabilidad comercial-contable."),
            ("FAQ comercial", "Responder dudas sobre ecommerce, servicios, distribuidores y logistica."),
            ("Proximo paso", "Definir cita, propuesta y seguimiento."),
        ],
    )
    _ensure_guide(
        db,
        code="client_onboarding",
        title="Onboarding Tenant Admin",
        audience="client",
        description="Guia de configuracion inicial para publicar tienda.",
        steps=[
            ("Configura tu marca", "Completa branding, logo y contacto."),
            ("Configura tu landing", "Define hero, mensajes y banners principales."),
            ("Carga tus productos o servicios", "Publica catalogo base con precios y categorias."),
            ("Configura Stripe", "Conecta llaves y webhook para cobros."),
            ("Configura cupones y fidelizacion", "Activa recompra y promociones."),
            ("Configura distribuidores", "Habilita canal comercial B2B."),
            ("Revisa logistica", "Define flujo operativo de entregas."),
            ("Publica tu tienda", "Valida storefront y activa salida comercial."),
        ],
    )
    db.commit()


def _ensure_guide(
    db: Session, code: str, title: str, audience: str, description: str, steps: list[tuple[str, str]]
) -> None:
    guide = db.scalar(select(OnboardingGuide).where(OnboardingGuide.code == code))
    if not guide:
        guide = OnboardingGuide(code=code, title=title, audience=audience, description=description, is_active=True)
        db.add(guide)
        db.flush()
    else:
        guide.title = title
        guide.audience = audience
        guide.description = description
        guide.is_active = True
    for idx, (step_title, content) in enumerate(steps, start=1):
        step = db.scalar(
            select(OnboardingStep).where(OnboardingStep.guide_id == guide.id, OnboardingStep.step_order == idx)
        )
        if not step:
            db.add(
                OnboardingStep(
                    guide_id=guide.id,
                    step_order=idx,
                    title=step_title,
                    content=content,
                    cta_label="Siguiente paso",
                    cta_path=None,
                    is_required=True,
                )
            )
            continue
        step.title = step_title
        step.content = content
        step.is_required = True


def complete_step(db: Session, user: User, guide_id: int, step_id: int, completed: bool = True) -> UserOnboardingProgress:
    row = db.scalar(
        select(UserOnboardingProgress).where(
            UserOnboardingProgress.user_id == user.id,
            UserOnboardingProgress.guide_id == guide_id,
            UserOnboardingProgress.step_id == step_id,
        )
    )
    if not row:
        row = UserOnboardingProgress(user_id=user.id, guide_id=guide_id, step_id=step_id, completed=completed)
        db.add(row)
    row.completed = completed
    row.completed_at = datetime.utcnow() if completed else None
    db.commit()
    db.refresh(row)
    return row


def get_progress_summary(db: Session, user: User) -> dict:
    progress = db.scalars(select(UserOnboardingProgress).where(UserOnboardingProgress.user_id == user.id)).all()
    total_steps = db.scalar(select(func.count(OnboardingStep.id))) or 0
    completed_steps = sum(1 for row in progress if row.completed)
    return {"progress": progress, "total_steps": total_steps, "completed_steps": completed_steps}
