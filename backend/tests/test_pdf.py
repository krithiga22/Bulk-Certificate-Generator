import uuid
from datetime import date
from pathlib import Path
from app.services.certificate_generator import CertificateGenerator


def test_pdf_generation_success(temp_storage):
    generator = CertificateGenerator(output_dir=temp_storage)
    cert_id = str(uuid.uuid4())

    file_path, cert_code = generator.generate(
        certificate_id=cert_id,
        recipient_name="Arun Kumar",
        event_name="Full Stack Masterclass",
        issue_date=date(2026, 10, 11),
        organization_name="CertiBatch Academy",
        signatory_name="John Doe",
    )

    pdf_file = Path(file_path)
    assert pdf_file.exists()
    assert pdf_file.stat().st_size > 1000  # PDF generated with valid size
    assert cert_code.startswith("CERT-20261011-")
    assert not (temp_storage / f"{cert_id}.tmp.pdf").exists()  # Temp file removed


def test_pdf_generation_simulated_failure(temp_storage):
    generator = CertificateGenerator(output_dir=temp_storage)
    cert_id = str(uuid.uuid4())

    try:
        generator.generate(
            certificate_id=cert_id,
            recipient_name="Faulty Recipient [SIMULATE_FAIL]",
            event_name="Fail Test",
            issue_date=date(2026, 10, 11),
        )
        assert False, "Should have raised deliberate failure"
    except RuntimeError as e:
        assert "Deliberate generation failure" in str(e)
        assert not (temp_storage / f"{cert_id}.pdf").exists()
        assert not (temp_storage / f"{cert_id}.tmp.pdf").exists()
