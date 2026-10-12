import csv
import io
from typing import List
from app.models import GenerationJob, Certificate


def generate_job_csv_report(job: GenerationJob, certificates: List[Certificate]) -> str:
    """
    Generates a clean CSV report containing recipient outcomes and audit details.
    """
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header metadata comments
    writer.writerow(["# CertiBatch Generation Job Audit Report"])
    writer.writerow([f"# Job ID: {job.id}"])
    writer.writerow([f"# Event Name: {job.event_name}"])
    writer.writerow([f"# Issue Date: {job.issue_date}"])
    writer.writerow([f"# Overall Status: {job.status.value}"])
    writer.writerow([f"# Total: {job.total_count}, Success: {job.success_count}, Failed: {job.failed_count}"])
    writer.writerow([])

    # Table columns
    writer.writerow([
        "Record ID",
        "Recipient Name",
        "Recipient Email",
        "Status",
        "Certificate Code",
        "Issued At (UTC)",
        "Failure Reason",
    ])

    for cert in certificates:
        writer.writerow([
            cert.id,
            cert.recipient_name,
            cert.recipient_email,
            cert.status.value,
            cert.certificate_code or "",
            cert.issued_at.isoformat() if cert.issued_at else "",
            cert.error_message or "",
        ])

    return output.getvalue()
