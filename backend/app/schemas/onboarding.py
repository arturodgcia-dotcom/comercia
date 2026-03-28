from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMBase, TimestampSchema


class OnboardingStepRead(TimestampSchema):
    id: int
    guide_id: int
    step_order: int
    title: str
    content: str
    cta_label: str | None
    cta_path: str | None
    is_required: bool


class OnboardingGuideRead(TimestampSchema):
    id: int
    code: str
    title: str
    audience: str
    description: str | None
    is_active: bool
    steps: list[OnboardingStepRead] = []


class UserOnboardingProgressRead(TimestampSchema):
    id: int
    user_id: int
    guide_id: int
    step_id: int
    completed: bool
    completed_at: datetime | None


class StepCompletePayload(BaseModel):
    guide_id: int
    step_id: int
    completed: bool = True


class OnboardingProgressResponse(ORMBase):
    progress: list[UserOnboardingProgressRead]
    total_steps: int
    completed_steps: int
