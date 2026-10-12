# CertiBatch API Reference & Usage Examples

Base URL: `http://localhost:8000/api`

---

## 1. Create a Bulk Generation Job

**Endpoint**: `POST /api/jobs`  
**Status**: `202 Accepted`

### Request
```bash
curl -X POST http://localhost:8000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Full Stack Cloud Architecture",
    "issue_date": "2026-10-11",
    "organization_name": "CertiBatch Authority",
    "signatory_name": "Dr. Alan Turing, Program Chair",
    "recipients": [
      { "name": "Arun Kumar", "email": "arun@example.com" },
      { "name": "Priya Sharma", "email": "priya@example.com" },
      { "name": "Invalid Recipient", "email": "not-an-email" }
    ]
  }'
```

### Response (202 Accepted)
```json
{
  "job_id": "c1f7a4e2-63b7-4a11-826d-495dbb7ca101",
  "status": "PENDING",
  "total_count": 3,
  "status_url": "/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101"
}
```

---

## 2. Check Job Status & Counters

**Endpoint**: `GET /api/jobs/{job_id}`  
**Status**: `200 OK`

### Request
```bash
curl http://localhost:8000/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101
```

### Response (200 OK)
```json
{
  "id": "c1f7a4e2-63b7-4a11-826d-495dbb7ca101",
  "event_name": "Full Stack Cloud Architecture",
  "issue_date": "2026-10-11",
  "organization_name": "CertiBatch Authority",
  "signatory_name": "Dr. Alan Turing, Program Chair",
  "status": "COMPLETED_WITH_ERRORS",
  "total_count": 3,
  "processed_count": 3,
  "success_count": 2,
  "failed_count": 1,
  "pending_count": 0,
  "progress_percentage": 100.0,
  "created_at": "2026-10-11T14:00:00Z",
  "started_at": "2026-10-11T14:00:01Z",
  "completed_at": "2026-10-11T14:00:03Z",
  "status_url": "/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101",
  "results_url": "/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101/certificates",
  "report_url": "/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101/report"
}
```

---

## 3. Retrieve Recipient Outcomes

**Endpoint**: `GET /api/jobs/{job_id}/certificates`  
**Status**: `200 OK`

### Request
```bash
curl http://localhost:8000/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101/certificates
```

### Response (200 OK)
```json
{
  "job_id": "c1f7a4e2-63b7-4a11-826d-495dbb7ca101",
  "event_name": "Full Stack Cloud Architecture",
  "total": 3,
  "certificates": [
    {
      "id": "78a1bc40-e221-4d32-9cb1-3a0cb79f1870",
      "recipient_name": "Arun Kumar",
      "recipient_email": "arun@example.com",
      "status": "SUCCESS",
      "certificate_code": "CERT-20261011-8F32C0D1",
      "download_url": "/api/certificates/78a1bc40-e221-4d32-9cb1-3a0cb79f1870/download",
      "error_message": null,
      "issued_at": "2026-10-11T14:00:02Z"
    },
    {
      "id": "e44d71f2-1a42-4f01-9a70-8b1e066a33f9",
      "recipient_name": "Invalid Recipient",
      "recipient_email": "not-an-email",
      "status": "FAILED",
      "certificate_code": null,
      "download_url": null,
      "error_message": "Invalid email format: The email address is not valid. It must have exactly one @-sign.",
      "issued_at": null
    }
  ]
}
```

---

## 4. Download Certificate PDF

**Endpoint**: `GET /api/certificates/{certificate_id}/download`  
**Status**: `200 OK` (Content-Type: `application/pdf`)

```bash
curl -O -J http://localhost:8000/api/certificates/78a1bc40-e221-4d32-9cb1-3a0cb79f1870/download
```

---

## 5. Verify Certificate Authenticity

**Endpoint**: `GET /api/verify/{certificate_code}`  
**Status**: `200 OK`

### Valid Code Request
```bash
curl http://localhost:8000/api/verify/CERT-20261011-8F32C0D1
```

### Response
```json
{
  "valid": true,
  "status": "ISSUED",
  "certificate_code": "CERT-20261011-8F32C0D1",
  "recipient_name": "Arun Kumar",
  "event_name": "Full Stack Cloud Architecture",
  "issue_date": "2026-10-11",
  "organization_name": "CertiBatch Authority",
  "signatory_name": "Dr. Alan Turing, Program Chair",
  "issued_at": "2026-10-11T14:00:02Z",
  "message": "This certificate is valid and was officially issued by CertiBatch."
}
```

### Invalid / Unknown Code Request
```bash
curl http://localhost:8000/api/verify/UNKNOWN-CODE-999
```

### Response
```json
{
  "valid": false,
  "status": "INVALID_OR_NOT_FOUND",
  "certificate_code": "UNKNOWN-CODE-999",
  "recipient_name": null,
  "event_name": null,
  "issue_date": null,
  "organization_name": null,
  "signatory_name": null,
  "issued_at": null,
  "message": "Certificate not found or has not been legitimately issued."
}
```

---

## 6. Export Job Audit Report as CSV

**Endpoint**: `GET /api/jobs/{job_id}/report`  
**Status**: `200 OK` (Content-Type: `text/csv`)

```bash
curl http://localhost:8000/api/jobs/c1f7a4e2-63b7-4a11-826d-495dbb7ca101/report
```
