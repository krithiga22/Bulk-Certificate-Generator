from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import JobStatus, CertificateStatus
from app.schemas import (
    JobCreateRequest,
    JobCreateResponse,
    JobResponse,
    JobListResponse,
    JobCertificatesResponse,
    JobCertificateItem,
    DashboardStatsResponse,
)
from app.services.job_service import (
    create_bulk_job,
    get_job_by_id,
    list_jobs,
    build_job_response,
    get_dashboard_statistics,
)
from app.services.report_service import generate_job_csv_report

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "",
    response_model=JobCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a bulk certificate generation job",
)
def create_job(
    request: JobCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    job = create_bulk_job(db=db, request=request, background_tasks=background_tasks)
    return JobCreateResponse(
        job_id=job.id,
        status=job.status,
        total_count=job.total_count,
        status_url=f"/api/jobs/{job.id}",
    )


@router.get(
    "/dashboard/stats",
    response_model=DashboardStatsResponse,
    summary="Get overall generation statistics for dashboard",
)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return get_dashboard_statistics(db)


@router.get(
    "",
    response_model=JobListResponse,
    summary="List generation jobs with pagination and filters",
)
def get_jobs(
    page: int = 1,
    page_size: int = 20,
    status: Optional[JobStatus] = None,
    db: Session = Depends(get_db),
):
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    total, items = list_jobs(db=db, page=page, page_size=page_size, status_filter=status)
    return JobListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Retrieve current state and counters for a job",
)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "JOB_NOT_FOUND", "message": f"Job {job_id} not found."},
        )
    return build_job_response(job)


@router.get(
    "/{job_id}/certificates",
    response_model=JobCertificatesResponse,
    summary="Retrieve all recipient certificate outcomes for a job",
)
def get_job_certificates(job_id: str, db: Session = Depends(get_db)):
    job = get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "JOB_NOT_FOUND", "message": f"Job {job_id} not found."},
        )

    items = []
    for cert in job.certificates:
        download_url = (
            f"/api/certificates/{cert.id}/download"
            if cert.status == CertificateStatus.SUCCESS
            else None
        )
        items.append(
            JobCertificateItem(
                id=cert.id,
                recipient_name=cert.recipient_name,
                recipient_email=cert.recipient_email,
                status=cert.status,
                certificate_code=cert.certificate_code,
                download_url=download_url,
                error_message=cert.error_message,
                issued_at=cert.issued_at,
            )
        )

    return JobCertificatesResponse(
        job_id=job.id,
        event_name=job.event_name,
        total=len(items),
        certificates=items,
    )


@router.get(
    "/{job_id}/report",
    summary="Export job results and audit log as CSV",
)
def download_job_report(job_id: str, db: Session = Depends(get_db)):
    job = get_job_by_id(db=db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "JOB_NOT_FOUND", "message": f"Job {job_id} not found."},
        )

    csv_content = generate_job_csv_report(job, job.certificates)
    filename = f"certibatch_job_{job.id[:8]}_report.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
