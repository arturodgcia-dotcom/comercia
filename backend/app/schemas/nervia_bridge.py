from datetime import datetime

from pydantic import BaseModel


class NerviaPublicationMetricCreate(BaseModel):
    tenant_id: int
    publication_id: str
    channel: str
    campaign_name: str | None = None
    published_at: datetime | None = None
    impressions: int = 0
    clicks: int = 0
    leads_generated: int = 0
    notes: str | None = None


class NerviaSyncRequest(BaseModel):
    source: str = "nervia"
    items: list[NerviaPublicationMetricCreate]


class NerviaPublicationMetricRead(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    publication_id: str
    channel: str
    campaign_name: str | None = None
    published_at: datetime | None = None
    impressions: int
    clicks: int
    leads_generated: int
    notes: str | None = None
    synced_at: datetime


class NerviaTenantPerformance(BaseModel):
    tenant_id: int
    tenant_name: str
    clicks: int
    impressions: int
    leads: int
    ventas_pagadas: int
    revenue_mxn: float
    conversion_click_to_lead_pct: float
    conversion_lead_to_sale_pct: float


class NerviaReportRead(BaseModel):
    generated_at: datetime
    total_clicks: int
    total_impressions: int
    total_leads: int
    total_ventas_pagadas: int
    total_revenue_mxn: float
    ctr_pct: float
    conversion_click_to_lead_pct: float
    conversion_lead_to_sale_pct: float
    by_tenant: list[NerviaTenantPerformance]
    top_publications: list[NerviaPublicationMetricRead]


class NerviaSuggestionRead(BaseModel):
    tenant_id: int
    tenant_name: str
    insight: str
    suggested_post_angle: str
    suggested_cta: str
    suggested_format: str


class NerviaFeedbackPayloadRead(BaseModel):
    generated_at: datetime
    report: NerviaReportRead
    suggestions: list[NerviaSuggestionRead]
