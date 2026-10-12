from datetime import date
from app.models import GenerationJob, Certificate, JobStatus, CertificateStatus, utcnow
from app.services.certificate_generator import CertificateGenerator


def test_verification_valid_and_invalid(client, db_session, temp_storage):
    # Create test job and certificate directly in DB
    job = GenerationJob(
        event_name="Cloud Computing Workshop",
        issue_date=date(2026, 10, 11),
        organization_name="CertiBatch University",
        signatory_name="Dean Adams",
        status=JobStatus.COMPLETED,
        total_count=1,
        processed_count=1,
        success_count=1,
        failed_count=0,
    )
    db_session.add(job)
    db_session.flush()

    generator = CertificateGenerator(output_dir=temp_storage)
    cert = Certificate(
        job_id=job.id,
        recipient_name="Deepa Raman",
        recipient_email="deepa@example.com",
        status=CertificateStatus.PENDING,
    )
    db_session.add(cert)
    db_session.flush()

    file_path, code = generator.generate(
        certificate_id=cert.id,
        recipient_name="Deepa Raman",
        event_name=job.event_name,
        issue_date=job.issue_date,
        organization_name=job.organization_name,
        signatory_name=job.signatory_name,
    )

    cert.file_path = file_path
    cert.certificate_code = code
    cert.status = CertificateStatus.SUCCESS
    cert.issued_at = utcnow()
    db_session.commit()

    # 1. Verify valid code
    res = client.get(f"/api/verify/{code}")
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["status"] == "ISSUED"
    assert data["recipient_name"] == "Deepa Raman"
    assert data["event_name"] == "Cloud Computing Workshop"
    assert data["certificate_code"] == code

    # 2. Verify invalid code
    bad_res = client.get("/api/verify/NON-EXISTENT-CODE-1234")
    assert bad_res.status_code == 200
    bad_data = bad_res.json()
    assert bad_data["valid"] is False
    assert bad_data["status"] == "INVALID_OR_NOT_FOUND"

    # 3. Download certificate
    dl_res = client.get(f"/api/certificates/{cert.id}/download")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert len(dl_res.content) > 1000
