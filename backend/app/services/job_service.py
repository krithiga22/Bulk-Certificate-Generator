from typing import List, Optional, Tuple
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.config import settings
from app.models import (
    GenerationJob,
    Certificate,
    JobStatus,
    CertificateStatus,
)
from app.schemas import JobCreateRequest, JobResponse, DashboardStatsResponse
from app.services.processing_service import process_generation_job


def build_job_response(job: GenerationJob) -> JobResponse:
    pending_count = max(0, job.total_count - job.processed_count)
    progress = 0.0
    if job.total_count > 0:
        progress = round((job.processed_count / job.total_count) * 100, 1)

    return JobResponse(
        id=job.id,
        event_name=job.event_name,
        issue_date=job.issue_date,
        organization_name=job.organization_name,
        signatory_name=job.signatory_name,
        status=job.status,
        total_count=job.total_count,
        processed_count=job.processed_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        pending_count=pending_count,
        progress_percentage=progress,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        status_url=f"/api/jobs/{job.id}",
        results_url=f"/api/jobs/{job.id}/certificates",
        report_url=f"/api/jobs/{job.id}/report",
    )


def create_bulk_job(
    db: Session,
    request: JobCreateRequest,
    background_tasks: Optional[BackgroundTasks] = None,
) -> GenerationJob:
    if len(request.recipients) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "BATCH_SIZE_EXCEEDED",
                "message": f"Maximum allowed batch size is {settings.MAX_BATCH_SIZE} recipients.",
            },
        )

    job = GenerationJob(
        event_name=request.event_name,
        issue_date=request.issue_date,
        organization_name=request.organization_name,
        signatory_name=request.signatory_name,
        status=JobStatus.PENDING,
        total_count=len(request.recipients),
        processed_count=0,
        success_count=0,
        failed_count=0,
    )
    db.add(job)
    db.flush()  # assign job.id

    for recipient in request.recipients:
        cert = Certificate(
            job_id=job.id,
            recipient_name=recipient.name,
            recipient_email=recipient.email,
            status=CertificateStatus.PENDING,
        )
        db.add(cert)

    # Commit ensures job and all recipient records are fully persisted before dispatching task
    db.commit()
    db.refresh(job)

    # Schedule background processing
    if background_tasks is not None:
        background_tasks.add_task(process_generation_job, job.id)

    return job


def get_job_by_id(db: Session, job_id: str) -> Optional[GenerationJob]:
    return db.query(GenerationJob).filter(GenerationJob.id == job_id).first()


def list_jobs(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[JobStatus] = None,
) -> Tuple[int, List[JobResponse]]:
    query = db.query(GenerationJob)
    if status_filter:
        query = query.filter(GenerationJob.status == status_filter)

    total = query.count()
    jobs = (
        query.order_by(desc(GenerationJob.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return total, [build_job_response(j) for j in jobs]


def get_dashboard_statistics(db: Session) -> DashboardStatsResponse:
    total_jobs = db.query(func.count(GenerationJob.id)).scalar() or 0
    certificates_issued = db.query(func.sum(GenerationJob.success_count)).scalar() or 0
    jobs_processing = (
        db.query(func.count(GenerationJob.id))
        .filter(GenerationJob.status.in_([JobStatus.PENDING, JobStatus.PROCESSING]))
        .scalar()
        or 0
    )
    failed_recipients = db.query(func.sum(GenerationJob.failed_count)).scalar() or 0

    recent_jobs_db = (
        db.query(GenerationJob)
        .order_by(desc(GenerationJob.created_at))
        .limit(5)
        .all()
    )
    recent_jobs = [build_job_response(j) for j in recent_jobs_db]

    return DashboardStatsResponse(
        total_jobs=int(total_jobs),
        certificates_issued=int(certificates_issued),
        jobs_processing=int(jobs_processing),
        failed_recipients=int(failed_recipients),
        recent_jobs=recent_jobs,
    )
