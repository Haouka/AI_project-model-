# AI-Based Fake Identity & Document Screening System
## Recommended Tech Stack

## 1. Frontend

### Recommended

- **React + TypeScript**
- **Next.js** for application structure
- **Tailwind CSS** for UI styling
- **shadcn/ui** for reusable interface components
- **React Query / TanStack Query** for API state
- **Recharts** for case analytics

### Why

The dashboard needs complex tables, evidence panels, document viewers, filters, status indicators, and responsive layouts. TypeScript helps reduce errors in a workflow with many structured fields.

## 2. Backend

### Recommended

- **Python**
- **FastAPI**
- **Pydantic**
- **SQLAlchemy**
- **Celery** or an equivalent background-job system
- **Redis** for queues/cache

FastAPI is a good fit because OCR, computer vision, machine-learning inference, and Python data tooling can remain in the same ecosystem.

## 3. OCR

Possible choices:

- PaddleOCR
- Tesseract for a lightweight prototype
- Cloud OCR services where permitted

A practical prototype can use PaddleOCR and add document-specific parsing on top.

### OCR pipeline

```text
Image → Preprocessing → OCR → Field Parser → Confidence → JSON
```

For passports, add MRZ-specific parsing and checksum validation.

## 4. Computer Vision

Recommended ecosystem:

- OpenCV
- Pillow
- NumPy
- PyTorch

Potential model categories:

- Document detection/classification
- Face detection
- Image-quality assessment
- Tamper/anomaly classification
- Region-level artifact detection

Do not train a fraud classifier solely on synthetic examples. Evaluate it against representative, properly sourced documents and realistic non-fraud variations.

## 5. Face Verification

Possible prototype components:

- OpenCV for image preprocessing
- A vetted face detection/embedding library
- PyTorch for custom model experimentation

For a real deployment, the exact model, threshold, retention policy, and operating procedure must be validated for the intended population and legal environment.

## 6. Database

### PostgreSQL

Suggested tables:

```text
users
roles
cases
documents
document_fields
validation_results
tamper_results
face_results
rules
rule_versions
model_versions
review_actions
audit_events
```

## 7. File Storage

Use encrypted object storage for:

- Original uploads
- Processed images
- Cropped evidence regions
- Generated reports

Store references/metadata in PostgreSQL rather than putting large images directly in relational tables.

## 8. API Design

Example endpoints:

```text
POST   /api/v1/cases
POST   /api/v1/cases/{case_id}/documents
POST   /api/v1/cases/{case_id}/process
GET    /api/v1/cases/{case_id}
GET    /api/v1/cases/{case_id}/evidence
GET    /api/v1/cases?status=NEEDS_REVIEW
POST   /api/v1/cases/{case_id}/review
GET    /api/v1/rules
GET    /api/v1/models
GET    /api/v1/audit/{case_id}
```

## 9. Authentication & Authorization

Recommended:

- OAuth 2.0 / OpenID Connect
- JWT access tokens
- Role-based access control
- MFA
- Session timeout
- Device/session auditing

Example roles:

```text
ADMIN
  └── System configuration

SUPERVISOR
  └── Review oversight + reports

REVIEWER
  └── Case analysis + review actions

ANALYST
  └── Aggregated analytics without unnecessary PII
```

## 10. DevOps

- Docker
- GitHub/GitLab CI
- Automated tests
- Container scanning
- Dependency scanning
- Infrastructure as Code
- Centralized logs
- Metrics and alerts

For a student prototype, Docker Compose is enough. Kubernetes can be introduced later if scale requires it.

## 11. Observability

Track:

- Request latency
- OCR latency
- Queue depth
- Model inference time
- Processing failures
- API error rates
- Reviewer turnaround time
- Model drift indicators
- False-positive / false-negative rates from validated evaluation sets

Avoid logging raw identity documents or unnecessary personal information.

## 12. Suggested Repository Structure

```text
identity-screening/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── workers/
│   └── rules/
├── ml/
│   ├── ocr/
│   ├── tamper/
│   ├── face/
│   ├── evaluation/
│   └── training/
├── infrastructure/
│   ├── docker/
│   └── deployment/
├── tests/
└── docs/
```
