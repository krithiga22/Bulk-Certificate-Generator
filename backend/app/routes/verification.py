from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Certificate, CertificateStatus
from app.schemas import CertificateVerifyResponse

router = APIRouter(prefix="/verify", tags=["Verification"])


@router.get(
    "/{certificate_code}",
    response_model=CertificateVerifyResponse,
    summary="Verify authenticity of an issued certificate",
)
def verify_certificate(certificate_code: str, db: Session = Depends(get_db)):
    clean_code = certificate_code.strip()

    cert = (
        db.query(Certificate)
        .filter(Certificate.certificate_code == clean_code)
        .first()
    )

    if not cert or cert.status != CertificateStatus.SUCCESS:
        return CertificateVerifyResponse(
            valid=False,
            status="INVALID_OR_NOT_FOUND",
            certificate_code=clean_code,
            message="Certificate not found or has not been legitimately issued.",
        )

    # Valid issued certificate
    job = cert.job
    return CertificateVerifyResponse(
        valid=True,
        status="ISSUED",
        certificate_code=cert.certificate_code,
        recipient_name=cert.recipient_name,
        event_name=job.event_name if job else "Certified Program",
        issue_date=job.issue_date if job else None,
        organization_name=job.organization_name if job else None,
        signatory_name=job.signatory_name if job else None,
        issued_at=cert.issued_at,
        message="This certificate is valid and was officially issued by CertiBatch.",
    )
