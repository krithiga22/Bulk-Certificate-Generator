from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models import JobStatus, CertificateStatus


class RecipientInput(BaseModel):
    name: str = Field(..., description="Recipient full name")
    email: str = Field(..., description="Recipient email address")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class JobCreateRequest(BaseModel):
    event_name: str = Field(..., min_length=1, max_length=255, description="Event or course name")
    issue_date: date = Field(..., description="Certificate issue date (ISO format YYYY-MM-DD)")
    organization_name: Optional[str] = Field(None, max_length=255)
    signatory_name: Optional[str] = Field(None, max_length=255)
    recipients: List[RecipientInput] = Field(..., min_length=1, description="List of recipients")

    @field_validator("event_name")
    @classmethod
    def validate_event_name(cls, v: str) -> str:
        val = v.strip()
        if not val:
            raise ValueError("Event name must not be blank")
        return val


class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus
    total_count: int
    status_url: str


class JobResponse(BaseModel):
    id: str
    event_name: str
    issue_date: date
    organization_name: Optional[str] = None
    signatory_name: Optional[str] = None
    status: JobStatus
    total_count: int
    processed_count: int
    success_count: int
    failed_count: int
    pending_count: int
    progress_percentage: float
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status_url: str
    results_url: str
    report_url: str

    model_config = ConfigDict(from_attributes=True)


class JobCertificateItem(BaseModel):
    id: str
    recipient_name: str
    recipient_email: str
    status: CertificateStatus
    certificate_code: Optional[str] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None
    issued_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)



class JobCertificatesResponse(BaseModel):
    job_id: str
    event_name: str
    total: int
    certificates: List[JobCertificateItem]


class CertificateVerifyResponse(BaseModel):
    valid: bool
    status: str
    certificate_code: Optional[str] = None
    recipient_name: Optional[str] = None
    event_name: Optional[str] = None
    issue_date: Optional[date] = None
    organization_name: Optional[str] = None
    signatory_name: Optional[str] = None
    issued_at: Optional[datetime] = None
    message: str


class JobListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[JobResponse]


class DashboardStatsResponse(BaseModel):
    total_jobs: int
    certificates_issued: int
    jobs_processing: int
    failed_recipients: int
    recent_jobs: List[JobResponse]


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
