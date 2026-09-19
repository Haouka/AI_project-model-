import hashlib
import json
import os
import shutil
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.config import DEMO_DIR, UPLOAD_DIR
from backend.database.db import get_db
from backend.database.models import (
    Case,
    Document,
    DocumentField,
    ValidationResult,
    TamperResult,
    FaceResult,
    CaseStatus,
    ReviewPriority,
    DocumentType,
    User,
)
from backend.services.demo_generator import generate_demo_documents
from backend.rules.validation_engine import validation_engine
from backend.services.tamper_service import tamper_detector
from backend.services.face_service import face_verifier
from backend.services.evidence_service import evidence_aggregator
from backend.services.audit_service import log_audit_event
from backend.services.mrz_service import parse_td3

router = APIRouter(prefix="/demo", tags=["Demo Fixtures"])


@router.get("/presets")
def get_demo_presets():
    """Returns metadata about available demo documents for quick screening tests in UI"""
    return [
        {
            "id": "clean_passport",
            "title": "Clean Authentic US Passport",
            "document_type": "PASSPORT",
            "applicant": "ALEXANDER CROSS",
            "document_number": "C40294821",
            "expected_outcome": "LOW_CONCERN (Auto-cleared)",
            "description": "Standard authentic ICAO Doc 9303 passport. Clean MRZ, flawless checksums, valid dates, no tamper anomalies, matching live face.",
            "document_file": "demo_clean_passport.jpg",
            "live_file": "demo_live_match.jpg",
        },
        {
            "id": "tampered_passport",
            "title": "Photo-Replaced UK Passport (Tampered)",
            "document_type": "PASSPORT",
            "applicant": "SARAH JANE CONNOR",
            "document_number": "982341094",
            "expected_outcome": "HIGH_PRIORITY_REVIEW",
            "description": "Physically/digitally altered portrait. Boundary discontinuity, high ELA compression variance, and face comparison mismatch.",
            "document_file": "demo_tampered_passport.jpg",
            "live_file": "demo_live_mismatch.jpg",
        },
        {
            "id": "altered_expiry",
            "title": "Altered Expiry Date Passport",
            "document_type": "PASSPORT",
            "applicant": "THABO MANDELA",
            "document_number": "A08912304",
            "expected_outcome": "HIGH_PRIORITY_REVIEW",
            "description": "Visual text modified to display '2034' expiry, but underlying MRZ machine zone reads expired '2024'. Triggers CROSS-003 and DATE-002 alerts.",
            "document_file": "demo_altered_expiry.jpg",
            "live_file": None,
        },
        {
            "id": "schengen_visa",
            "title": "Inconsistent Schengen Visa (Overstay)",
            "document_type": "VISA",
            "applicant": "MARCO ROSSI",
            "document_number": "VC8810294",
            "expected_outcome": "NEEDS_REVIEW",
            "description": "Visa stay duration (90 Days) conflicts with 30-day validity window (2026-06-01 to 2026-07-01). Triggers DATE-005 violation.",
            "document_file": "demo_schengen_visa.jpg",
            "live_file": None,
        },
    ]


@router.post("/seed")
def seed_demo_cases(db: Session = Depends(get_db)):
    """Seeds the 4 primary demo cases with full screening pipelines into the database"""
    demo_docs = generate_demo_documents()
    system_user = db.query(User).filter(User.username == "admin").first()
    system_user_id = system_user.id if system_user else 1

    created_cases = []

    for key, spec in [
        ("clean_passport", demo_docs["clean_passport"]),
        ("tampered_passport", demo_docs["tampered_passport"]),
        ("altered_expiry", demo_docs["altered_expiry"]),
        ("schengen_visa", demo_docs["schengen_visa"]),
    ]:
        case_id = f"CASE-DEMO-{key.upper()[:6]}-{uuid.uuid4().hex[:4].upper()}"

        # Copy document image to upload storage
        src_path = spec["file_path"]
        ext = os.path.splitext(src_path)[1]
        dest_filename = f"{case_id}_primary{ext}"
        dest_path = UPLOAD_DIR / dest_filename
        shutil.copyfile(src_path, str(dest_path))

        # Copy live face if available
        live_dest_path = None
        if key == "clean_passport":
            live_src = demo_docs["live_faces"]["matching_alex"]
            live_filename = f"{case_id}_live.jpg"
            live_dest_path = UPLOAD_DIR / live_filename
            shutil.copyfile(live_src, str(live_dest_path))
        elif key == "tampered_passport":
            live_src = demo_docs["live_faces"]["mismatch_impostor"]
            live_filename = f"{case_id}_live.jpg"
            live_dest_path = UPLOAD_DIR / live_filename
            shutil.copyfile(live_src, str(live_dest_path))

        # Create Case
        case = Case(
            id=case_id,
            title=spec["title"],
            document_type=DocumentType(spec["document_type"]),
            status=CaseStatus.PROCESSING,
            review_priority=ReviewPriority.NEEDS_REVIEW,
            applicant_name=spec["applicant_name"],
            document_number=spec["document_number"],
            nationality=spec["nationality"],
        )
        db.add(case)
        db.commit()

        # Add Document Record
        with open(dest_path, "rb") as f:
            c = f.read()
            doc_hash = hashlib.sha256(c).hexdigest()

        doc_rec = Document(
            case_id=case.id,
            document_type=case.document_type,
            file_path=str(dest_path),
            original_filename=os.path.basename(src_path),
            file_size=len(c),
            mime_type="image/jpeg",
            file_hash=doc_hash,
            is_live_face=False,
        )
        db.add(doc_rec)

        if live_dest_path:
            with open(live_dest_path, "rb") as f:
                lc = f.read()
                live_hash = hashlib.sha256(lc).hexdigest()
            live_rec = Document(
                case_id=case.id,
                document_type=case.document_type,
                file_path=str(live_dest_path),
                original_filename=os.path.basename(str(live_dest_path)),
                file_size=len(lc),
                mime_type="image/jpeg",
                file_hash=live_hash,
                is_live_face=True,
            )
            db.add(live_rec)

        db.commit()

        # Add Document Fields
        fields_data = spec["fields"]
        mrz_data = None
        if "mrz_line1" in fields_data and "mrz_line2" in fields_data:
            mrz_data = parse_td3(fields_data["mrz_line1"], fields_data["mrz_line2"])

        for f_name, f_val in fields_data.items():
            field_rec = DocumentField(
                case_id=case.id,
                document_id=doc_rec.id,
                field_name=f_name,
                value=str(f_val),
                confidence=0.97 if key == "clean_passport" else (0.84 if key == "tampered_passport" else 0.94),
                bbox_x=0.25,
                bbox_y=0.25,
                bbox_w=0.4,
                bbox_h=0.08,
                is_mrz="mrz" in f_name,
            )
            db.add(field_rec)

        # Run Deterministic Rule Validation
        val_results = validation_engine.validate(
            document_type=spec["document_type"],
            fields=fields_data,
            mrz_data=mrz_data,
        )
        for vr in val_results:
            vr_rec = ValidationResult(
                case_id=case.id,
                document_id=doc_rec.id,
                rule_id=vr["rule_id"],
                rule_name=vr["rule_name"],
                category=vr["category"],
                status=vr["status"],
                severity=vr["severity"],
                explanation=vr["explanation"],
                evidence_json=json.dumps(vr.get("evidence", {})),
            )
            db.add(vr_rec)

        # Run Tamper Detection
        tamper_res = tamper_detector.analyze(
            image_path=str(dest_path),
            document_type=spec["document_type"],
        )
        for tr in tamper_res:
            tr_rec = TamperResult(
                case_id=case.id,
                document_id=doc_rec.id,
                anomaly_type=tr["anomaly_type"],
                status=tr["status"],
                score=tr["score"],
                heatmap_path=tr.get("heatmap_path"),
                explanation=tr["explanation"],
                evidence_regions_json=json.dumps(tr.get("evidence_regions", [])),
            )
            db.add(tr_rec)

        # Run Face Verification
        face_res = face_verifier.verify(
            document_image_path=str(dest_path),
            presented_image_path=str(live_dest_path) if live_dest_path else None,
        )
        face_rec = FaceResult(
            case_id=case.id,
            document_face_detected=face_res["document_face_detected"],
            live_face_detected=face_res["live_face_detected"],
            similarity_score=face_res["similarity_score"],
            quality_score=face_res["quality_score"],
            outcome=face_res["outcome"],
            explanation=face_res["explanation"],
            doc_portrait_path=face_res.get("doc_portrait_url"),
            live_photo_path=face_res.get("live_photo_url"),
        )
        db.add(face_rec)

        # Evidence Aggregation
        ocr_summary = {
            "average_confidence": 0.98 if key == "clean_passport" else 0.88,
            "fields": fields_data,
        }
        aggregated = evidence_aggregator.aggregate(
            ocr_summary=ocr_summary,
            validation_results=val_results,
            tamper_results=tamper_res,
            face_result=face_res,
        )

        case.status = CaseStatus(aggregated["status"])
        case.review_priority = ReviewPriority(aggregated["review_priority"])
        case.overall_confidence = aggregated["overall_confidence"]
        db.commit()

        log_audit_event(
            db,
            action="DEMO_CASE_SEEDED",
            case_id=case.id,
            user_id=system_user_id,
            details={"demo_key": key, "title": spec["title"]},
        )

        created_cases.append({
            "case_id": case.id,
            "title": case.title,
            "status": case.status.value,
            "priority": case.review_priority.value,
        })

    return {
        "message": f"Successfully seeded {len(created_cases)} demo screening cases.",
        "seeded_cases": created_cases,
    }
