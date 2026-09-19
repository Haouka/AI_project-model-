# AI-Based Fake Identity & Document Screening System
## Architecture Design

> **Purpose:** This document describes a prototype architecture for assisted document screening. The system is designed to flag possible inconsistencies and tampering for trained reviewers; it should **not make autonomous immigration, admission, detention, or denial decisions**.

## 1. System Goals

The platform should:

- Accept passport, visa, national ID, permit, and driving-license images.
- Extract structured fields using OCR.
- Check extracted information against configurable document rules.
- Detect visual and digital signs of tampering.
- Compare the face in a document with a voluntarily captured/live image where legally permitted.
- Combine signals into an explainable risk indicator.
- Route uncertain or high-risk cases to trained human reviewers.
- Maintain an auditable record of model outputs, reviewer actions, and evidence.

## 2. High-Level Architecture

```text
                    ┌─────────────────────────┐
                    │      Web / Kiosk UI     │
                    │ Upload • Camera • Queue  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      API Gateway         │
                    │ Auth • Rate Limit • TLS  │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      │ Document     │   │ Case /       │   │ Audit &      │
      │ Ingestion    │   │ Workflow API │   │ Monitoring   │
      └──────┬───────┘   └──────┬───────┘   └──────────────┘
             │                  │
             ▼                  ▼
      ┌─────────────────────────────────────────────┐
      │              AI Processing Layer            │
      │                                             │
      │ OCR → Validation → Tamper Analysis → Face  │
      │                    Verification              │
      └──────────────────────┬──────────────────────┘
                             │
                             ▼
                   ┌──────────────────────┐
                   │ Evidence & Rules     │
                   │ Engine               │
                   │                      │
                   │ Rules + Model Scores │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Reviewer Dashboard    │
                   │ Evidence • Alerts     │
                   │ Explanation • Action  │
                   └──────────┬───────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
        ┌──────────────┐             ┌──────────────┐
        │ Case Storage │             │ Audit Store  │
        └──────────────┘             └──────────────┘
```

## 3. Core Modules

### Module 1 — OCR Extraction

**Input**

- Passport image
- Visa image
- National ID image
- Driving licence
- Permit/travel authorization

**Pipeline**

```text
Image
  ↓
Quality Check
  ↓
Orientation / Perspective Correction
  ↓
Document Type Classification
  ↓
OCR / MRZ Detection
  ↓
Field Parsing
  ↓
Confidence Estimation
  ↓
Structured Document Record
```

**Example extracted passport fields**

- Full name
- Passport number
- Nationality
- Date of birth
- Date of expiry
- Gender
- MRZ lines

**Example visa fields**

- Visa number
- Visa type
- Valid-from date
- Valid-until date
- Permitted stay duration
- Number of entries

The UI should show OCR confidence and allow a reviewer to inspect the source region corresponding to every important field.

### Module 2 — Document Validation

Validation combines deterministic rules with trusted reference data.

Examples:

- Required fields are present.
- Dates have valid formats.
- Expiry date is logically after issue date.
- Passport/visa number follows the expected format for the selected document type.
- MRZ check digits are valid where applicable.
- Visa dates are consistent with the document's stated validity.
- Document type matches its detected template.
- Country/document-specific rules are applied from a versioned rule set.

**Important:** A failed rule should be treated as evidence requiring review, not automatic proof of fraud.

### Module 3 — Tampering Detection

This is the main AI-assisted analysis component.

#### A. Photo replacement indicators

Potential signals:

- Boundary inconsistencies around portrait regions.
- Differences in compression/noise patterns.
- Copy-paste or resampling artifacts.
- Inconsistent lighting or image texture.
- Alignment with the expected portrait area.

#### B. Text manipulation indicators

Potential signals:

- Local compression anomalies.
- Font/layout inconsistencies.
- Unusual spacing or character rendering.
- Region-level resampling artifacts.
- Conflict between visible text and machine-readable information.

#### C. Stamp/signature analysis

Where applicable and legally authorized:

- Template/layout inconsistency.
- Unusual geometry.
- Image-layer anomalies.
- Missing or inconsistent expected elements.

#### D. Metadata analysis

Possible checks:

- Unexpected editing software metadata.
- Creation/modification timestamp anomalies.
- Image encoding inconsistencies.

Metadata must be treated as a supporting signal because it can be removed or modified legitimately.

### Module 4 — Face Verification

```text
Document Portrait
       │
       ▼
Face Detection
       │
       ▼
Face Quality Check
       │
       ├── poor quality → request better image / human review
       ▼
Face Representation
       │
       ▼
Comparison with authorized live/presented image
       │
       ▼
Similarity + Quality + Policy Threshold
```

The system should expose:

- Match confidence
- Image quality
- Whether both faces were detected correctly
- Reason for inconclusive result

Do not expose a face similarity number as a definitive identity judgment. Human review and applicable legal procedures remain necessary.

## 4. Risk / Evidence Aggregation

Instead of a single opaque "fraud probability," use an evidence-based result:

```text
Document Integrity
├── OCR confidence
├── Rule validation results
├── MRZ consistency
├── Tampering indicators
├── Face verification result
└── Data-source consistency

                    ↓

          Evidence Aggregation

                    ↓

        REVIEW PRIORITY INDICATOR
        ├── Low concern
        ├── Needs review
        └── High-priority review
```

The system should display the contributing evidence rather than only a final number.

## 5. Data Layer

Recommended logical stores:

- **PostgreSQL:** cases, extracted fields, rule versions, reviewer actions.
- **Object storage:** encrypted document images and cropped evidence.
- **Redis:** short-lived processing state and queues.
- **Audit store:** append-only security/audit events.
- **Model registry:** model versions, evaluation metrics, deployment metadata.

## 6. Security Architecture

- TLS for data in transit.
- Encryption at rest.
- Role-based access control.
- Least-privilege service accounts.
- MFA for reviewer/admin accounts.
- Short-lived access tokens.
- Signed audit events.
- Access logging.
- Data retention/deletion policies.
- Secure secrets management.
- Network segmentation between public UI, APIs, processing workers, and databases.

## 7. Deployment

### Prototype

```text
Frontend → FastAPI → Celery/Redis → AI Workers
                         ↓
                  PostgreSQL + Object Storage
```

### Production-oriented design

Use containerized services behind an API gateway/load balancer. GPU-enabled workers can be introduced for computer-vision models. Horizontal scaling should be applied to OCR/tamper-processing workers independently from the UI.

## 8. Reliability

Every processing request should have:

- Unique case ID.
- Processing status.
- Model/rule versions.
- Timestamps.
- Error state.
- Retry count.
- Reviewer outcome.

Example:

```json
{
  "case_id": "CASE-2026-000123",
  "status": "NEEDS_REVIEW",
  "document_type": "PASSPORT",
  "ocr_confidence": 0.96,
  "validation": "2_RULES_FAILED",
  "tamper_analysis": "INCONCLUSIVE",
  "face_verification": "NOT_PERFORMED",
  "model_version": "tamper-v1.3",
  "rule_version": "passport-rules-2026.09"
}
```

## 9. Human-in-the-Loop Workflow

```text
Upload
  ↓
Automated Analysis
  ↓
Evidence Report
  ↓
Reviewer
  ├── Clear / continue according to procedure
  ├── Request better document/image
  ├── Escalate for secondary review
  └── Record reason and evidence
```

The platform should never silently convert a model score into an irreversible decision.

## 10. Performance Targets for a Prototype

These are engineering targets, not guaranteed results:

| Component | Prototype Target |
|---|---:|
| Image upload | < 2 sec |
| OCR processing | 1–3 sec |
| Rule validation | < 1 sec |
| Tamper analysis | 2–5 sec |
| Face verification | 1–3 sec |
| End-to-end | ~5–10 sec |

Performance should be measured using representative, legally obtained test data.
