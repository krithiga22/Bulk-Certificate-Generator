import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Certificate, CertificateStatus
from app.schemas import JobCertificateItem

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get(
    "",
    summary="List recent certificates globally with optional status filter",
)
def list_all_certificates(
    page: int = 1,
    page_size: int = 30,
    search: Optional[str] = None,
    status_filter: Optional[CertificateStatus] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Certificate)
    if status_filter:
        query = query.filter(Certificate.status == status_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Certificate.recipient_name.ilike(search_pattern))
            | (Certificate.recipient_email.ilike(search_pattern))
            | (Certificate.certificate_code.ilike(search_pattern))
        )

    total = query.count()
    certs = (
        query.order_by(desc(Certificate.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []
    for cert in certs:
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

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "certificates": items,
    }


@router.get(
    "/{certificate_id}/download",
    summary="Download issued certificate PDF",
)
def download_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CERTIFICATE_NOT_FOUND", "message": f"Certificate {certificate_id} was not found."},
        )

    if cert.status != CertificateStatus.SUCCESS or not cert.file_path:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CERTIFICATE_NOT_READY",
                "message": f"Certificate is not in ready state (current: {cert.status.value}).",
            },
        )

    file_path = Path(cert.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FILE_NOT_FOUND", "message": "Certificate PDF file is missing on server."},
        )

    safe_name = "".join(c for c in cert.recipient_name if c.isalnum() or c in (" ", "_", "-")).strip()
    download_filename = f"Certificate_{safe_name or cert.id[:8]}.pdf"

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=download_filename,
    )
