from datetime import date
from app.models import GenerationJob, Certificate, JobStatus, CertificateStatus
from app.schemas import JobCreateRequest, RecipientInput
from app.services.job_service import create_bulk_job
from app.services.processing_service import process_generation_job


def test_critical_four_recipient_integration(db_session, temp_storage):
    """
    Critical Integration Test (SRS Section 11.1):
    Batch with 4 recipients:
    1. Valid recipient 1 (Arun Kumar) -> SUCCESS
    2. Valid recipient 2 (Meena Raj) -> SUCCESS
    3. Invalid recipient (Priya Sharma, bad email) -> FAILED (Validation)
    4. Deliberate generation failure recipient (Dev Fail [SIMULATE_FAIL]) -> FAILED (Generation)

    Expected Outcome:
    - Total: 4
    - Processed: 4
    - Successful: 2
    - Failed: 2
    - Progress: 100%
    - Final job status: COMPLETED_WITH_ERRORS
    - Two distinct failure reasons recorded.
    """
    request_data = JobCreateRequest(
        event_name="Data Science Intensive",
        issue_date=date(2026, 10, 11),
        organization_name="AI Research Guild",
        signatory_name="Prof. Harrison",
        recipients=[
            RecipientInput(name="Arun Kumar", email="arun@example.com"),
            RecipientInput(name="Priya Sharma", email="invalid-email-format"),
            RecipientInput(name="Dev Fail [SIMULATE_FAIL]", email="devfail@example.com"),
            RecipientInput(name="Meena Raj", email="meena@example.com"),
        ],
    )

    # 1. Create bulk job without background dispatcher so we can run processor synchronously
    job = create_bulk_job(db=db_session, request=request_data, background_tasks=None)
    job_id = job.id

    assert job.status == JobStatus.PENDING
    assert job.total_count == 4
    assert job.processed_count == 0

    # 2. Execute processing service with isolated temporary storage
    process_generation_job(job_id=job_id, db=db_session, output_dir=temp_storage)

    # 3. Re-query job and certificates from DB
    db_session.expire_all()
    updated_job = db_session.query(GenerationJob).filter(GenerationJob.id == job_id).first()
    assert updated_job is not None

    # Assert Counters and Invariants
    assert updated_job.total_count == 4
    assert updated_job.processed_count == 4
    assert updated_job.success_count == 2
    assert updated_job.failed_count == 2
    assert updated_job.status == JobStatus.COMPLETED_WITH_ERRORS
    assert updated_job.started_at is not None
    assert updated_job.completed_at is not None

    # Invariants verification
    assert 0 <= updated_job.processed_count <= updated_job.total_count
    assert updated_job.success_count + updated_job.failed_count == updated_job.processed_count

    # 4. Verify Individual Certificates & Failure Reasons
    certs = (
        db_session.query(Certificate)
        .filter(Certificate.job_id == job_id)
        .order_by(Certificate.created_at)
        .all()
    )
    assert len(certs) == 4

    # Check recipient 1: Arun Kumar
    c_arun = next(c for c in certs if c.recipient_name == "Arun Kumar")
    assert c_arun.status == CertificateStatus.SUCCESS
    assert c_arun.certificate_code is not None
    assert c_arun.file_path is not None
    assert c_arun.error_message is None

    # Check recipient 2: Priya Sharma (Validation error)
    c_priya = next(c for c in certs if c.recipient_name == "Priya Sharma")
    assert c_priya.status == CertificateStatus.FAILED
    assert c_priya.certificate_code is None
    assert c_priya.file_path is None
    assert "Invalid email format" in c_priya.error_message

    # Check recipient 3: Dev Fail (Generation error)
    c_fail = next(c for c in certs if "[SIMULATE_FAIL]" in c.recipient_name)
    assert c_fail.status == CertificateStatus.FAILED
    assert c_fail.certificate_code is None
    assert c_fail.file_path is None
    assert "Deliberate generation failure" in c_fail.error_message

    # Check recipient 4: Meena Raj
    c_meena = next(c for c in certs if c.recipient_name == "Meena Raj")
    assert c_meena.status == CertificateStatus.SUCCESS
    assert c_meena.certificate_code is not None
    assert c_meena.file_path is not None
    assert c_meena.error_message is None

    # Verify that the two failures have distinct reasons
    assert c_priya.error_message != c_fail.error_message
