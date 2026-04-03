from datetime import datetime

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field

from app.schemas.common import TimestampSchema


class DiagnosticScores(BaseModel):
    seo: int
    aeo: int
    branding: int
    global_score: int = Field(alias="global")

    model_config = ConfigDict(populate_by_name=True)


class DiagnosticFinding(BaseModel):
    status: str
    criterion: str
    detail: str


class DiagnosticFindings(BaseModel):
    seo: list[DiagnosticFinding]
    aeo: list[DiagnosticFinding]
    branding: list[DiagnosticFinding]


class DiagnosticRecommendations(BaseModel):
    high_priority: list[str]
    medium_priority: list[str]
    low_priority: list[str]


class BrandDiagnosticRead(TimestampSchema):
    id: int
    tenant_id: int
    brand_name: str
    analysis_type: str = "internal_brand"
    source_url: str | None = None
    analyzed_at: datetime
    status: str
    scores: DiagnosticScores
    findings: DiagnosticFindings
    recommendations: DiagnosticRecommendations
    summary: str
    next_actions: list[str]
    missing_data: list[str]
    raw_context: dict[str, object]
    improvement_plan: dict[str, object] | None = None


class BrandDiagnosticSummaryRead(BaseModel):
    id: int
    tenant_id: int
    brand_name: str
    analysis_type: str = "internal_brand"
    source_url: str | None = None
    analyzed_at: datetime
    status: str
    global_score: int


class BrandDiagnosticImprovementPlanRequest(BaseModel):
    accepted_high_priority: list[str] = Field(default_factory=list)
    accepted_medium_priority: list[str] = Field(default_factory=list)
    accepted_low_priority: list[str] = Field(default_factory=list)
    notes: str = ""
    owner: str = "equipo-marca"


class BrandDiagnosticExternalUrlRequest(BaseModel):
    url: AnyHttpUrl
    tenant_id: int | None = None
