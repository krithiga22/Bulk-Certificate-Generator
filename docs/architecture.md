# CertiBatch System Architecture

## 1. Overview
CertiBatch is structured as a high-reliability modular monolith designed for bulk PDF certificate issuance, progress tracking, recipient error isolation, and public cryptographic-style authenticity verification.

```
+-------------------------------------------------------------+
|                      React + TypeScript                     |
|  Dashboard · New Job · Job Details · Directory · Verify     |
+------------------------------+------------------------------+
                               | REST JSON / File Downloads
                               v
+-------------------------------------------------------------+
|                    FastAPI Application                      |
|       Routes: /api/jobs, /api/certificates, /api/verify     |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|    Service Layer      |             |     Storage Layer     |
| - Recipient Validation|             | - Atomic PDF Write    |
| - Progress Tracking   |             | - QR Code Generation  |
| - CSV Audit Reporting |             | - Temp file cleanup   |
+-----------+-----------+             +-----------------------+
            |
            v
+-------------------------------------------------------------+
|                    SQLAlchemy 2.0 ORM                       |
|         generation_jobs <---1:N---> certificates           |
|         Foreign keys enforced, Transactional commits        |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     SQLite Database                         |
+-------------------------------------------------------------+
```

---

## 2. Layers & Responsibilities

### 2.1 Presentation Layer (Frontend)
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Bespoke Vanilla CSS design system with custom CSS variables, Google Fonts (`Outfit` and `Plus Jakarta Sans`), glassmorphism, responsive data tables, animated progress bars, and status badges.
- **Routing**: Client-side hash routing (`#/`, `#/jobs/new`, `#/jobs/:id`, `#/certificates`, `#/verify/:code`).
- **State & Polling**: Real-time polling (every 2.5s) while jobs are in `PENDING` or `PROCESSING` states, halting automatically upon reaching a terminal state (`COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`).

### 2.2 API Layer (FastAPI)
- Handles HTTP requests, enforces strict schema validation via Pydantic V2, handles errors consistently, and dispatches background generation tasks via FastAPI `BackgroundTasks`.
- Enforces batch safety limits (default maximum 500 recipients per request).

### 2.3 Application & Service Layer
- **Job Service (`job_service.py`)**: Persists job records and recipient rows, computes statistics, and coordinates job lifecycle.
- **Processing Service (`processing_service.py`)**: Executes in background. Validates each recipient individually (name length, email syntax). If an individual recipient is malformed, it records the failure reason and advances without stopping other valid recipients.
- **Certificate Generator (`certificate_generator.py`)**: Uses ReportLab to generate landscape A4 certificates with double borders, gold accents, recipient name, course/event name, authorized signature line, and an embedded high-resolution QR code linking to the public verification endpoint. Employs atomic file replacement (`.tmp.pdf` -> `.pdf`).
- **Report Service (`report_service.py`)**: Builds an exportable CSV audit trail with job metadata and recipient-level outcomes.

### 2.4 Persistence Layer
- **Database**: SQLite with foreign key enforcement (`PRAGMA foreign_keys=ON;`).
- **Schema**:
  - `generation_jobs`: `id`, `event_name`, `issue_date`, `status`, `total_count`, `processed_count`, `success_count`, `failed_count`, `created_at`, `started_at`, `completed_at`.
  - `certificates`: `id`, `job_id`, `recipient_name`, `recipient_email`, `status`, `certificate_code` (unique), `file_path`, `error_message`, `created_at`, `issued_at`.
- **Invariants**:
  - `0 <= processed_count <= total_count`
  - `success_count + failed_count = processed_count`
  - A certificate has a `certificate_code` and `file_path` if and only if status is `SUCCESS`.
  - A failed recipient record has an informative `error_message` and no public download.

---

## 3. Reliability & Failure Isolation

1. **Transactional Commits**: In background processing, each recipient is processed independently and committed to the database with corresponding job counters (`processed_count`, `success_count` / `failed_count`).
2. **Atomic PDF Generation**: ReportLab writes the certificate to a temporary file (`{id}.tmp.pdf`). Only when generation completes without errors is the file atomically renamed to `{id}.pdf`. In case of failure, temporary files are removed immediately.
3. **Graceful Error Containment**: A malformed email or PDF engine glitch marks only that specific recipient as `FAILED`, allowing all remaining valid recipients in the batch to complete successfully. The overall job transitions to `COMPLETED_WITH_ERRORS`.
