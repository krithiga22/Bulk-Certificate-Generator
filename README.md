# CertiBatch — Bulk Certificate Generation & Verification System

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy_2.0-003B57.svg)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/tests-9%20passed%20(90%25%20cov)-brightgreen.svg)]()

CertiBatch is an enterprise-grade certificate management platform that empowers organizations to submit bulk participant batches, generate cryptographic-stamped PDF certificates via ReportLab, track real-time recipient progress, isolate failures gracefully without halting the batch, and publicly verify certificate authenticity via QR codes and unique certificate IDs.

---

## 🌟 Key Differentiating Features

1. **Independent Recipient Failure Isolation**: If an individual row in a batch contains an invalid email or malformed name, that recipient is flagged with an explicit failure reason in the audit log while valid certificates continue processing uninterrupted.
2. **QR-Based Authenticity Verification**: Every issued certificate embeds a high-resolution QR code linking to a dedicated public verification portal that validates the certificate code against the official database registry.
3. **Atomic Generation Safety**: Certificates are rendered to temporary files (`.tmp.pdf`) and atomically renamed only upon completion, preventing incomplete or corrupt PDF exposure.
4. **Complete Audit Trail & CSV Export**: Export job results with full recipient breakdown, certificate codes, timestamps, and error messages.
5. **Modern Reactive UI**: Built with React, TypeScript, and a bespoke CSS design system with live polling indicators, status chips, animated progress bars, and CSV drag-and-drop support.

---

## 📐 High-Level Architecture

```
certibatch/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & middleware
│   │   ├── config.py                # Pydantic Settings configuration
│   │   ├── database.py              # SQLite engine & foreign-key enforcement
│   │   ├── models.py                # SQLAlchemy GenerationJob & Certificate models
│   │   ├── schemas.py               # Pydantic V2 request & response schemas
│   │   ├── routes/
│   │   │   ├── jobs.py              # Bulk job management & status endpoints
│   │   │   ├── certificates.py      # PDF downloads & global directory
│   │   │   └── verification.py      # Public certificate verification
│   │   └── services/
│   │       ├── certificate_generator.py # ReportLab PDF & QR code engine
│   │       ├── processing_service.py    # Background worker & failure containment
│   │       ├── job_service.py           # Job persistence & analytics
│   │       └── report_service.py        # CSV audit export generator
│   ├── tests/
│   │   ├── conftest.py              # Pytest fixtures & in-memory DB configuration
│   │   ├── test_critical_integration.py # Multi-recipient failure isolation test
│   │   ├── test_jobs.py             # Validation, creation, status & dashboard tests
│   │   ├── test_pdf.py              # PDF generation & atomic file tests
│   │   └── test_verification.py     # Public verification & download tests
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/App.tsx              # Main layout & SPA hash router
│   │   ├── components/              # StatusBadge, ProgressBar, Sidebar, Header
│   │   ├── pages/                   # Dashboard, CreateJob, JobDetails, Jobs, Verify
│   │   ├── services/api.ts          # Type-safe API client
│   │   ├── types/api.ts             # TypeScript interfaces
│   │   ├── index.css                # Bespoke design system & styling
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md              # Detailed architecture & database invariants
│   └── api-examples.md              # cURL & HTTP request/response reference
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Installation

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Dashboard will open at `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the complete test suite with coverage:

```bash
cd backend
.\.venv\Scripts\pytest -v --cov=app tests/
```

### Critical Integration Test Coverage
CertiBatch includes a mandatory 4-recipient integration test (`tests/test_critical_integration.py`) verifying:
1. 2 Valid recipients (`Arun Kumar`, `Meena Raj`) -> `SUCCESS` with generated PDFs & certificate codes.
2. 1 Invalid email recipient (`Priya Sharma`) -> `FAILED` with distinct validation error reason.
3. 1 Generator failure recipient -> `FAILED` with distinct generation error reason.
4. Final batch status reaches `COMPLETED_WITH_ERRORS` with `100%` progress and consistent counters.

---

## 📡 API Endpoints

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/jobs` | Submit a bulk recipient batch | `202 Accepted` |
| `GET` | `/api/jobs` | List historical jobs with pagination | `200 OK` |
| `GET` | `/api/jobs/dashboard/stats` | Aggregated statistics for dashboard | `200 OK` |
| `GET` | `/api/jobs/{job_id}` | Job progress, status, and summary counters | `200 OK` |
| `GET` | `/api/jobs/{job_id}/certificates`| All recipient outcomes for a job | `200 OK` |
| `GET` | `/api/jobs/{job_id}/report` | Export job results as CSV | `200 OK` |
| `GET` | `/api/certificates/{id}/download`| Download issued certificate PDF | `200 OK` |
| `GET` | `/api/certificates` | Global certificate directory | `200 OK` |
| `GET` | `/api/verify/{code}` | Verify certificate authenticity | `200 OK` |
| `GET` | `/api/health` | Service health status | `200 OK` |

---

## 🔒 Security & Reliability Guarantees

- **No Public Leaks**: The public `/api/verify/{code}` endpoint reveals only essential certificate details (recipient name, event name, issue date) without exposing private recipient emails or database internals.
- **SQLite Foreign Key Pragmas**: All relations enforce database constraints with cascade rules.
- **Batch Size Safety**: Default batch size capped at 500 recipients per request.
- **Cross-Origin Resource Sharing (CORS)**: Configured for modern web clients.

---

## 📄 License
MIT License. Developed for CertiBatch Bulk Certificate Generation and Verification.
