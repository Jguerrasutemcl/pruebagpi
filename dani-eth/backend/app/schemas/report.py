from pydantic import BaseModel, Field


class ReportSummary(BaseModel):
    report_id: str
    campaign_id: str
    target: str
    type: str
    generated_at: str
    pdf_url: str | None = None       # URL pública de Supabase, null si no hay PDF
    markdown_url: str | None = None  # URL pública del .md en Supabase Storage


class FindingDetail(BaseModel):
    finding_id: str | None = None
    type: str | None = None
    severity: str | None = None
    description: str | None = None
    evidence: str | None = None
    cve: str | None = None
    remediation: str | None = None


class ReportSummaryStats(BaseModel):
    total_findings: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0


class ReportDetail(BaseModel):
    report_id: str
    campaign_id: str
    target: str
    type: str
    # summary puede ser {"markdown": "..."} (orquestador) o stats de hallazgos
    summary: dict | None = None
    findings: list[FindingDetail] = []
    generated_at: str
    pdf_url: str | None = None       # URL pública del PDF en Supabase Storage
    markdown_url: str | None = None  # URL pública del .md en Supabase Storage


class ReportIngest(BaseModel):
    """Payload que manda el orquestador en POST /reports."""
    campaign_id: str
    target: str
    type: str = "technical"
    summary: dict = Field(default_factory=dict)
    findings: list[dict] = Field(default_factory=list)
    generated_at: str
    pdf_base64: str | None = Field(
        default=None,
        description="PDF en base64. El back lo sube a Supabase Storage.",
    )