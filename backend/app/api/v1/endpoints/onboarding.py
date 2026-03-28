from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.models import OnboardingGuide, OnboardingStep, User
from app.schemas.onboarding import (
    OnboardingGuideRead,
    OnboardingProgressResponse,
    StepCompletePayload,
    UserOnboardingProgressRead,
)
from app.services.onboarding_service import complete_step, ensure_default_onboarding_guides, get_progress_summary

router = APIRouter()


@router.get("/guides", response_model=list[OnboardingGuideRead])
def list_guides(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ensure_default_onboarding_guides(db)
    guides = db.scalars(select(OnboardingGuide).where(OnboardingGuide.is_active.is_(True))).all()
    response: list[OnboardingGuideRead] = []
    for guide in guides:
        steps = db.scalars(
            select(OnboardingStep).where(OnboardingStep.guide_id == guide.id).order_by(OnboardingStep.step_order.asc())
        ).all()
        data = OnboardingGuideRead.model_validate(guide).model_dump()
        data["steps"] = steps
        response.append(OnboardingGuideRead.model_validate(data))
    return response


@router.get("/guides/{guide_id}", response_model=OnboardingGuideRead)
def get_guide(guide_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ensure_default_onboarding_guides(db)
    guide = db.get(OnboardingGuide, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="guia no encontrada")
    steps = db.scalars(
        select(OnboardingStep).where(OnboardingStep.guide_id == guide.id).order_by(OnboardingStep.step_order.asc())
    ).all()
    data = OnboardingGuideRead.model_validate(guide).model_dump()
    data["steps"] = steps
    return OnboardingGuideRead.model_validate(data)


@router.get("/progress/me", response_model=OnboardingProgressResponse)
def my_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_default_onboarding_guides(db)
    summary = get_progress_summary(db, current_user)
    return OnboardingProgressResponse(
        progress=[UserOnboardingProgressRead.model_validate(row) for row in summary["progress"]],
        total_steps=summary["total_steps"],
        completed_steps=summary["completed_steps"],
    )


@router.post("/progress/step-complete", response_model=UserOnboardingProgressRead)
def complete_onboarding_step(
    payload: StepCompletePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_onboarding_guides(db)
    return complete_step(
        db,
        user=current_user,
        guide_id=payload.guide_id,
        step_id=payload.step_id,
        completed=payload.completed,
    )
