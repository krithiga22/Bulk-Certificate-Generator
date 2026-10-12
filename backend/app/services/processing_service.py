import re
import logging
from typing import Tuple, Optional
from email_validator import validate_email, EmailNotValidError

from app.database import SessionLocal
from app.models import (
    GenerationJob,
    Certificate,
    JobStatus,
    CertificateStatus,
    utcnow,
)
from app.services.certificate_generator import CertificateGenerator

logger = logging.getLogger(__name__)


def validate_recipient_data(name: str, email: str) -> Tuple[bool, Optional[str]]:
    """
    Validates recipient name and email format.
    Returns (is_valid, error_message).
    """
    if not name or not name.strip():
        return False, "Recipient name cannot be blank."

    if len(name.strip()) > 255:
        return False, "Recipient name exceeds maximum allowed length of 255 characters."

    if not email or not email.strip():
        return False, "Recipient email cannot be blank."

    clean_email = email.strip()
    try:
        # Check syntax, allow deliverability check to be bypassed for offline/local verification
        validate_email(clean_email, check_deliverability=False)
    except EmailNotValidError as e:
        return False, f"Invalid email format: {str(e)}"
    except Exception:
        # Fallback regex if email-validator has any unexpected issue
        pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(pattern, clean_email):
            return False, f"Invalid email format: {clean_email}"

    return True, None


def process_generation_job(job_id: str, db=None, output_dir=None):
    """
    Synchronous processing function suitable for BackgroundTasks.
    Uses provided db session or instantiates an isolated SessionLocal.
    """
    close_db_when_done = False
    if db is None:
        db = SessionLocal()
        close_db_when_done = True

    generator = CertificateGenerator(output_dir=output_dir)

    try:
        job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found for background execution")
            return

        # Mark job as PROCESSING
        job.status = JobStatus.PROCESSING
        if not job.started_at:
            job.started_at = utcnow()
        db.commit()

        # Fetch all pending certificates for this job
        certificates = (
            db.query(Certificate)
            .filter(Certificate.job_id == job_id)
            .order_by(Certificate.created_at)
            .all()
        )

        for cert in certificates:
            # If already in terminal state (e.g. from prior partial run), skip
            if cert.status != CertificateStatus.PENDING:
                continue

            name = cert.recipient_name
            email = cert.recipient_email

            # 1. Validate recipient data
            is_valid, validation_err = validate_recipient_data(name, email)

            if not is_valid:
                cert.status = CertificateStatus.FAILED
                cert.error_message = validation_err
                job.failed_count += 1
                job.processed_count += 1
                db.commit()
                continue

            # 2. Attempt PDF Generation
            try:
                file_path, cert_code = generator.generate(
                    certificate_id=cert.id,
                    recipient_name=name.strip(),
                    event_name=job.event_name,
                    issue_date=job.issue_date,
                    organization_name=job.organization_name,
                    signatory_name=job.signatory_name,
                )

                cert.file_path = file_path
                cert.certificate_code = cert_code
                cert.status = CertificateStatus.SUCCESS
                cert.error_message = None
                cert.issued_at = utcnow()

                job.success_count += 1
                job.processed_count += 1
                db.commit()

            except Exception as gen_err:
                logger.warning(f"Generation failure for cert {cert.id}: {gen_err}")
                cert.status = CertificateStatus.FAILED
                cert.error_message = f"Certificate generation failed: {str(gen_err)}"
                cert.file_path = None
                cert.certificate_code = None

                job.failed_count += 1
                job.processed_count += 1
                db.commit()

        # 3. Finalize Job Status
        # Refresh job state
        db.refresh(job)
        if job.processed_count >= job.total_count:
            job.completed_at = utcnow()
            if job.failed_count == 0:
                job.status = JobStatus.COMPLETED
            else:
                job.status = JobStatus.COMPLETED_WITH_ERRORS
        db.commit()

    except Exception as fatal_err:
        logger.exception(f"Fatal job error processing job {job_id}: {fatal_err}")
        try:
            job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                job.completed_at = utcnow()
                db.commit()
        except Exception:
            db.rollback()
    finally:
        if close_db_when_done:
            db.close()
