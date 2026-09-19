# DocShield AI — AI-Based Fake Identity & Document Screening System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenCV](https://img.shields.io/badge/OpenCV-5.0-5C3EE8.svg?style=flat&logo=opencv&logoColor=white)](https://opencv.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**DocShield AI** is an end-to-end, AI-assisted identity document screening system engineered for border checkpoints, immigration desks, and travel security workflows. It combines multi-stage Optical Character Recognition (OCR), ICAO Doc 9303 Machine Readable Zone (MRZ) verification, deterministic business rule validation, computer vision forensics (Error Level Analysis, boundary discontinuity, noise variance, metadata inspection), and biometric facial verification.

> [!IMPORTANT]
> **Operational Boundary Notice**: DocShield AI operates as an **AI-assisted decision-support platform** that organizes explainable evidence for authorized human reviewers. It is intentionally architected **not** to make autonomous or irreversible immigration, detention, or denial decisions.

---

## Architecture & System Pipeline

```text
 Upload Document Image (+ Optional Live Face)
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │         AI Processing Layer         │
   ├─────────────────────────────────────┤
   │ 1. Quality & Resolution Check       │
   │ 2. Document Template Classification │
   │ 3. OCR & ICAO 9303 MRZ Parsing      │
   │ 4. Deterministic Rule Validation    │
   │ 5. Forensics & ELA Tamper Detection │
   │ 6. Facial Feature Biometrics        │
   └──────────────────┬──────────────────┘
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │     Evidence Aggregation Engine     │
   │     Produces Review Priority        │
   │  [LOW CONCERN / NEEDS REVIEW / HIGH]│
   └──────────────────┬──────────────────┘
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │    Three-Column Reviewer Station    │
   │ Left: Multi-Layer Viewer (ELA/Boxes)│
   │ Center: Extracted Data & MRZ Matrix │
   │ Right: Evidence Cards & Alerts      │
   │ Bottom: Review Action & Audit Sign  │
   └─────────────────────────────────────┘
```

---

## Major Modules & Capabilities

### 1. Optical Character Recognition (OCR) & MRZ Engine
- Multi-stage image enhancement: bilateral filtering, CLAHE contrast equalization, adaptive Otsu binarization.
- Extracts structured visual inspection zone (VIZ) fields:
  - **Passports**: Full Name, Passport Number, Nationality, Date of Birth, Gender, Issue Date, Expiry Date.
  - **Visas**: Visa Number, Visa Type, Valid From, Valid Until, Permitted Stay Duration, Number of Entries.
  - **National IDs**: Document Number, Full Name, DOB, Expiry Date, Address/State.
- Normalized bounding boxes (`[x, y, w, h]` coordinates) mapped to extracted text for interactive UI highlighting.
- Full **ICAO Doc 9303** TD1, TD2, and TD3 parser with 7-3-1 weight multiplier check digit calculation for document number, DOB, expiry date, and composite checksums.

### 2. Rule-Based Validation Engine
Deterministic, explainable business rules:
- `REQ-001` / `REQ-002`: Required Fields Completeness.
- `DATE-001`: ISO 8601 Date Formatting.
- `DATE-002`: Expiry Validity (flags expired documents).
- `DATE-003`: Issue vs Expiry Chronology (expiry logically after issue date, <= 10 years).
- `DATE-004`: Date of Birth Plausibility (birth in past, realistic biological age).
- `DATE-005`: Visa Stay Duration Consistency (stay duration cannot exceed validity span).
- `MRZ-001` to `MRZ-005`: ICAO syntax and check digits validation.
- `CROSS-001` to `CROSS-005`: Cross-field consistency between Visual Zone and MRZ lines (identifies altered expiry years or swapped passport numbers).
- `DOC-001`: Alphanumeric Document Number Pattern Constraints.
- `REF-001`: Border Reference Database Lookup simulation (watchlist & revocation status).

### 3. Computer Vision Tampering Detection Pipeline
- **Error Level Analysis (ELA)**: Resaves document at controlled 90% JPEG compression, measures pixel error delta matrix, amplifies variance, and generates a visual **JET color-mapped heatmap** saved to storage and rendered in the reviewer UI.
- **Photo Replacement Boundary Detector**: Identifies portrait perimeter, measures gradient sharpness discontinuity across the cut boundary, and detects focus/noise disparity between portrait and background.
- **Noise Analysis**: Evaluates high-frequency noise variance across 16 grid zones to catch digital multi-source splicing.
- **Metadata Forensics**: Inspects EXIF tags for digital editing software footprints (`Photoshop`, `GIMP`, `Canva`, `Pixlr`).
- Transparent labels: `NO_CLEAR_ANOMALY`, `POSSIBLE_ANOMALY`, `INCONCLUSIVE`, `REQUIRES_REVIEW`.

### 4. Biometric Face Verification
- Crops document portrait and optional live presented photo.
- Image quality assessment (Laplacian focus/blur, exposure, contrast).
- Structural and color-spatial feature representation comparison.
- Clear uncertainty disclosures: "Biometric comparison is provided as supporting evidence for human review and should not be used as autonomous proof of identity."

### 5. Reviewer Workspace & Audit Trail
- **3-Column Security Workstation**:
  - **Left**: Multi-layer viewer with Pan, Zoom, Rotate, Fit-to-screen, and layer toggles (`Original Document`, `OCR BBoxes`, `ELA Heatmap`, `Face Biometrics`).
  - **Center**: Extracted fields table with confidence bars and raw MRZ inspector. Clicking a field automatically highlights its bounding box on the viewer!
  - **Right**: Explainable evidence summary, review priority banner, rule violation cards with severity badges, and tamper indicators.
  - **Bottom**: Officer decision bar (`Clear / Approve`, `Request Better Image`, `Escalate to Supervisor`, `Record Outcome`) with mandatory notes and confirmation dialog.
- **Immutable Audit Trail**: Append-only ledger recording User, Case ID, Action, Timestamp, Status, and IP Address.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Authentication** | OAuth2, JWT (HS256), Native Bcrypt password hashing |
| **Database** | SQLite (default development), PostgreSQL-ready |
| **Computer Vision / ML** | OpenCV, Pillow, NumPy, PyTesseract, ICAO MRZ |
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS, Lucide Icons |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## Repository Structure

```text
├── backend/
│   ├── api/
│   │   ├── auth.py             # JWT authentication & role-based dependencies
│   │   ├── cases.py            # Case creation, document upload, screening & review
│   │   ├── evidence.py         # Structured evidence report endpoints
│   │   ├── rules_api.py        # Rule definitions registry
│   │   ├── audit_api.py        # Audit trail retrieval
│   │   ├── analytics_api.py    # System KPI & metrics aggregation
│   │   └── demo_api.py         # 1-click synthetic demo cases seeder
│   ├── database/
│   │   ├── db.py               # SQLAlchemy engine & session maker
│   │   └── models.py           # User, Case, Document, Field, Validation, Tamper, Face, Audit models
│   ├── rules/
│   │   ├── rule_definitions.py # Versioned rules catalog
│   │   └── validation_engine.py# Deterministic rule engine
│   ├── services/
│   │   ├── ocr_service.py      # OCR extraction, preprocessing & bounding box mapper
│   │   ├── mrz_service.py      # ICAO 9303 TD1/TD2/TD3 parser & check digit calculator
│   │   ├── tamper_service.py   # ELA, boundary discontinuity, noise & EXIF detector
│   │   ├── face_service.py     # Portrait extraction, quality scoring & feature comparison
│   │   ├── evidence_service.py # Evidence aggregation & review priority engine
│   │   ├── audit_service.py    # Append-only audit logger
│   │   └── demo_generator.py   # Synthetic identity documents & faces generator
│   ├── config.py               # Settings & storage directories
│   └── main.py                 # FastAPI application entrypoint & SPA static mount
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # App header, role switcher & demo seeder
│   │   │   ├── DashboardStats.tsx  # KPI cards
│   │   │   ├── CasesTable.tsx      # Filterable cases table
│   │   │   ├── DocumentViewer.tsx  # Multi-layer viewer (zoom, pan, rotate, ELA, bboxes)
│   │   │   ├── ExtractedFields.tsx # Field inspection table & MRZ decoder
│   │   │   ├── EvidencePanel.tsx   # Aggregated evidence cards & alerts
│   │   │   ├── ReviewActions.tsx   # Reviewer decision bar & modal
│   │   │   ├── NewScreeningModal.tsx # Upload modal with demo presets
│   │   │   ├── ProcessingModal.tsx # Step-by-step loading state
│   │   │   ├── AuditTrailView.tsx  # Case history drawer
│   │   │   ├── AnalyticsDashboard.tsx # Aggregate charts & metrics
│   │   │   ├── RulesCatalog.tsx    # Rule definitions table
│   │   │   └── LoginModal.tsx      # Sign-in modal with quick role presets
│   │   ├── types/index.ts          # TypeScript interfaces
│   │   ├── api/client.ts           # API client
│   │   ├── App.tsx                 # View router & state manager
│   │   └── main.tsx                # React DOM root
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── ml/
│   ├── evaluation/
│   │   └── eval_metrics.py     # Precision, recall, F1, ROC-AUC calculator
├── storage/                    # Uploads, processed portraits, and ELA heatmaps
├── tests/
│   ├── test_auth.py
│   ├── test_cases.py           # End-to-end integration test
│   ├── test_mrz.py             # ICAO 9303 checksum tests
│   ├── test_validation_rules.py# Rules engine tests
│   ├── test_tamper.py          # ELA & forensics tests
│   └── test_face.py            # Face verification tests
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** & **npm**
- *(Optional)* Tesseract-OCR for full optical character recognition

### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# (Optional) Copy environment template
cp .env.example .env
```

### 2. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Running the Application

### Method 1 — Unified Single-Command Full-Stack Run (Recommended)
Because FastAPI is configured to serve the compiled frontend distribution directly:
```bash
python -m backend.main
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

### Method 2 — Development Mode (Live Hot-Reloading)
Run backend and frontend independently:
```bash
# Terminal 1: Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** (Vite proxies API calls to port 8000).

---

## Running Tests

Execute the complete automated test suite (13 unit and integration tests):
```bash
python -m pytest tests/ -v
```

Run ML evaluation benchmarks:
```bash
python ml/evaluation/eval_metrics.py
```

---

## Demo Workflow Walkthrough

1. **Sign In**:
   - Open [http://localhost:8000](http://localhost:8000).
   - Use the **Quick 1-Click Role Login** buttons to select **Reviewer Diaz** (`reviewer` / `Review@123`).
2. **Seed Synthetic Test Documents**:
   - Click the top-bar button **"Load Demo Fixtures"**.
   - 4 pre-configured synthetic cases are automatically seeded into the queue.
3. **Inspect Cases in the Dashboard**:
   - Observe KPI cards updated: Active Cases, Needs Review, High Priority, and Average Latency (~3.4s).
4. **Demonstrate Case 2 — Photo-Replaced UK Passport (Tampered)**:
   - Click **Review** on the case with applicant **SARAH JANE CONNOR**.
   - Notice the **HIGH-PRIORITY REVIEW** banner.
   - On the left viewer, switch layers to **ELA Forensics** to observe the compression discrepancy heatmap around the portrait region.
   - Switch layer to **Face Biometrics** to view the cropped portrait vs live photo and observe the mismatch indicator.
   - Inspect the **Rule Validation Alerts** and **Tamper Forensics** cards.
   - Type officer notes into the bottom bar: *"Portrait perimeter discontinuity confirmed on ELA heatmap. Escalating for secondary manual examination."*
   - Click **[Escalate Case]** and confirm in the signing dialog.
5. **Demonstrate Case 3 — Altered Expiry Date Passport**:
   - Open case **THABO MANDELA**.
   - Observe that the visual text shows `2034-08-20`, but the MRZ line reads `240820` (expired 2024).
   - Notice that rule `CROSS-003` (VIZ to MRZ Expiry Match) failed, preventing an altered document from passing.
6. **Verify the Audit Trail**:
   - Click **View Case Audit Trail** in the review header.
   - Observe the cryptographically recorded, immutable timeline of intake, OCR extraction, rules evaluation, tamper forensics, and officer review actions.
7. **Perform a New Screening**:
   - Click **New Screening** in the top bar.
   - Select any of the 1-click presets or upload a custom image.
   - Click **Start Automated AI Screening** to watch the animated 7-step verification pipeline execute.

---

## Default Role Accounts

| Role | Username | Password | Purpose |
|---|---|---|---|
| **REVIEWER** | `reviewer` | `Review@123` | Case examination & outcome recording |
| **SUPERVISOR**| `supervisor` | `Super@123` | Oversight, escalation review & analytics |
| **ADMIN** | `admin` | `Admin@123` | System configuration & rule management |
| **ANALYST** | `analyst` | `Analyst@123` | Performance analytics & quality metrics |

---

## Known Limitations & Future Work

- **OCR Engine**: Standard deployment uses Tesseract OCR alongside computer vision preprocessing. Production environments should leverage high-throughput distributed OCR workers (PaddleOCR or specialized identity document OCR models).
- **Deep Tamper Models**: Current prototype utilizes deterministic computer vision (Error Level Analysis, boundary discontinuity, noise variance, and EXIF tagging). The `BaseTamperDetector` interface allows drop-in replacement with deep CNN / Transformer tampering models (e.g. ManTra-Net or TruFor) once trained on domain-specific border datasets.
- **Biometric Face Verification**: Uses structural and color feature vector cosine similarity. Production implementations should incorporate dedicated deep facial embedding models (e.g. ArcFace / MagFace) certified under national biometric standards and compliant with local privacy laws.
