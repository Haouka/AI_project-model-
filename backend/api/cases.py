import hashlib
import json
import os
import shutil
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.config import settings, UPLOAD_DIR
from backend.database.db import get_db
from backend.database.models import (
    Case,
    Document,
    DocumentField,
    ValidationResult,
    TamperResult,
    FaceResult,
    ReviewAction,
    CaseStatus,
    ReviewPriority,
    DocumentType,
    User,
)
from backend.api.auth import get_current_user
from backend.services.ocr_service import ocr_engine
from backend.services.mrz_service import parse_mrz_text
from backend.rules.validation_engine import validation_engine
from backend.services.tamper_service import tamper_detector
from backend.services.face_service import face_verifier
from backend.services.evidence_service import evidence_aggregator
from backend.services.audit_service import log_audit_event

router = APIRouter(prefix="/cases", tags=["Cases & Screening"])


class CaseCreateRequest(BaseModel):
    title: Optional[str] = None
    document_type: str = "PASSPORT"


class ReviewSubmissionRequest(BaseModel):
    action: str  # CLEAR, REQUEST_BETTER_IMAGE, ESCALATE, RECORD_OUTCOME
    reason: Optional[str] = None
    notes: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_case(
    req: CaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case_number = f"CASE-{uuid.uuid4().hex[:8].upper()}"
    try:
        doc_type_enum = DocumentType(req.document_type.upper())
    except ValueError:
        doc_type_enum = DocumentType.PASSPORT

    new_case = Case(
        id=case_number,
        title=req.title or f"{doc_type_enum.value} Screening #{case_number[-6:]}",
        document_type=doc_type_enum,
        status=CaseStatus.PROCESSING,
        review_priority=ReviewPriority.NEEDS_REVIEW,
        overall_confidence=0.0,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    log_audit_event(
        db,
        action="CASE_CREATED",
        case_id=new_case.id,
        user_id=current_user.id,
        details={"document_type": doc_type_enum.value},
    )

    return {
        "case_id": new_case.id,
        "title": new_case.title,
        "document_type": new_case.document_type.value,
        "status": new_case.status.value,
        "created_at": new_case.created_at,
    }


@router.post("/{case_id}/documents")
async def upload_documents(
    case_id: str,
    document_file: UploadFile = File(...),
    live_photo_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Validate file extension
    ext = document_file.filename.split(".")[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )

    # Save primary document
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    saved_doc_name = f"{case_id}_{doc_id}.{ext}"
    doc_path = UPLOAD_DIR / saved_doc_name

    hasher = hashlib.sha256()
    with open(doc_path, "wb") as buffer:
        content = await document_file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds maximum allowable size (20MB)")
        buffer.write(content)
        hasher.update(content)

    doc_record = Document(
        case_id=case.id,
        document_type=case.document_type,
        file_path=str(doc_path),
        original_filename=document_file.filename,
        file_size=len(content),
        mime_type=document_file.content_type or "image/jpeg",
        file_hash=hasher.hexdigest(),
        is_live_face=False,
    )
    db.add(doc_record)

    # Optional live face photo
    live_doc_record = None
    if live_photo_file:
        live_ext = live_photo_file.filename.split(".")[-1].lower()
        live_name = f"{case_id}_live_{uuid.uuid4().hex[:6]}.{live_ext}"
        live_path = UPLOAD_DIR / live_name
        live_content = await live_photo_file.read()
        with open(live_path, "wb") as buffer:
            buffer.write(live_content)

        live_doc_record = Document(
            case_id=case.id,
            document_type=case.document_type,
            file_path=str(live_path),
            original_filename=live_photo_file.filename,
            file_size=len(live_content),
            mime_type=live_photo_file.content_type or "image/jpeg",
            file_hash=hashlib.sha256(live_content).hexdigest(),
            is_live_face=True,
        )
        db.add(live_doc_record)

    db.commit()

    log_audit_event(
        db,
        action="DOCUMENT_UPLOADED",
        case_id=case.id,
        user_id=current_user.id,
        details={
            "filename": document_file.filename,
            "has_live_photo": live_photo_file is not None,
            "hash": doc_record.file_hash,
        },
    )

    return {
        "message": "Documents uploaded successfully",
        "document_id": doc_record.id,
        "case_id": case.id,
        "has_live_photo": live_photo_file is not None,
    }


@router.post("/{case_id}/process")
def process_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes the full automated AI document screening pipeline:
    1. OCR extraction & confidence estimation
    2. MRZ check digits calculation (ICAO 9303)
    3. Deterministic rule validation
    4. CV tampering analysis (ELA, photo boundary, noise, EXIF)
    5. Biometric face verification
    6. Evidence aggregation and review priority assignment
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    primary_doc = (
        db.query(Document)
        .filter(Document.case_id == case.id, Document.is_live_face == False)
        .first()
    )
    if not primary_doc:
        raise HTTPException(status_code=400, detail="No primary document uploaded for this case")

    live_doc = (
        db.query(Document)
        .filter(Document.case_id == case.id, Document.is_live_face == True)
        .first()
    )

    # 1. OCR Extraction
    ocr_result = ocr_engine.extract_document_fields(
        image_path=primary_doc.file_path,
        document_type=case.document_type.value,
    )

    # Clear previous fields if re-processing
    db.query(DocumentField).filter(DocumentField.case_id == case.id).delete()

    extracted_dict = {}
    for f_name, f_data in ocr_result.get("fields", {}).items():
        val = f_data.get("value", "")
        extracted_dict[f_name] = val
        bbox = f_data.get("bbox", [0, 0, 0, 0])
        field_model = DocumentField(
            case_id=case.id,
            document_id=primary_doc.id,
            field_name=f_name,
            value=str(val),
            confidence=float(f_data.get("confidence", 0.9)),
            bbox_x=bbox[0] if len(bbox) > 0 else None,
            bbox_y=bbox[1] if len(bbox) > 1 else None,
            bbox_w=bbox[2] if len(bbox) > 2 else None,
            bbox_h=bbox[3] if len(bbox) > 3 else None,
            is_mrz=f_data.get("is_mrz", False),
        )
        db.add(field_model)

    # Update case applicant info
    case.applicant_name = extracted_dict.get("name") or extracted_dict.get("full_name") or case.applicant_name
    case.document_number = (
        extracted_dict.get("passport_number")
        or extracted_dict.get("document_number")
        or extracted_dict.get("visa_number")
        or case.document_number
    )
    case.nationality = extracted_dict.get("nationality") or case.nationality

    # 2. Rule Validation Engine
    db.query(ValidationResult).filter(ValidationResult.case_id == case.id).delete()
    val_results = validation_engine.validate(
        document_type=case.document_type.value,
        fields=extracted_dict,
        mrz_data=ocr_result.get("mrz_data"),
    )
    for vr in val_results:
        vr_model = ValidationResult(
            case_id=case.id,
            document_id=primary_doc.id,
            rule_id=vr["rule_id"],
            rule_name=vr["rule_name"],
            category=vr["category"],
            status=vr["status"],
            severity=vr["severity"],
            explanation=vr["explanation"],
            evidence_json=json.dumps(vr.get("evidence", {})),
        )
        db.add(vr_model)

    # 3. Tampering Analysis (ELA, Boundary, Noise, EXIF)
    db.query(TamperResult).filter(TamperResult.case_id == case.id).delete()
    tamper_analysis = tamper_detector.analyze(
        image_path=primary_doc.file_path,
        document_type=case.document_type.value,
    )
    for tr in tamper_analysis:
        tr_model = TamperResult(
            case_id=case.id,
            document_id=primary_doc.id,
            anomaly_type=tr["anomaly_type"],
            status=tr["status"],
            score=tr["score"],
            heatmap_path=tr.get("heatmap_path"),
            explanation=tr["explanation"],
            evidence_regions_json=json.dumps(tr.get("evidence_regions", [])),
        )
        db.add(tr_model)

    # 4. Face Verification Engine
    db.query(FaceResult).filter(FaceResult.case_id == case.id).delete()
    face_res = face_verifier.verify(
        document_image_path=primary_doc.file_path,
        presented_image_path=live_doc.file_path if live_doc else None,
    )
    face_model = FaceResult(
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
    db.add(face_model)

    # 5. Evidence Aggregation & Review Priority Calculation
    aggregated = evidence_aggregator.aggregate(
        ocr_summary=ocr_result,
        validation_results=val_results,
        tamper_results=tamper_analysis,
        face_result=face_res,
    )

    case.status = CaseStatus(aggregated["status"])
    case.review_priority = ReviewPriority(aggregated["review_priority"])
    case.overall_confidence = aggregated["overall_confidence"]

    db.commit()

    log_audit_event(
        db,
        action="AI_SCREENING_COMPLETED",
        case_id=case.id,
        user_id=current_user.id,
        details={
            "review_priority": case.review_priority.value,
            "status": case.status.value,
            "overall_confidence": case.overall_confidence,
            "rules_checked": len(val_results),
        },
    )

    return {
        "case_id": case.id,
        "status": case.status.value,
        "review_priority": case.review_priority.value,
        "overall_confidence": case.overall_confidence,
        "evidence_summary": aggregated,
    }


@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    docs = db.query(Document).filter(Document.case_id == case.id).all()
    fields = db.query(DocumentField).filter(DocumentField.case_id == case.id).all()
    vals = db.query(ValidationResult).filter(ValidationResult.case_id == case.id).all()
    tampers = db.query(TamperResult).filter(TamperResult.case_id == case.id).all()
    faces = db.query(FaceResult).filter(FaceResult.case_id == case.id).all()
    actions = (
        db.query(ReviewAction)
        .filter(ReviewAction.case_id == case.id)
        .order_by(desc(ReviewAction.created_at))
        .all()
    )

    primary_doc = next((d for d in docs if not d.is_live_face), None)
    live_doc = next((d for d in docs if d.is_live_face), None)

    # Transform document paths to serveable URLs
    primary_doc_url = None
    if primary_doc:
        fname = os.path.basename(primary_doc.file_path)
        primary_doc_url = f"/api/v1/storage/documents/{fname}"

    live_doc_url = None
    if live_doc:
        fname = os.path.basename(live_doc.file_path)
        live_doc_url = f"/api/v1/storage/documents/{fname}"

    return {
        "id": case.id,
        "title": case.title,
        "document_type": case.document_type.value,
        "status": case.status.value,
        "review_priority": case.review_priority.value,
        "overall_confidence": case.overall_confidence,
        "applicant_name": case.applicant_name,
        "document_number": case.document_number,
        "nationality": case.nationality,
        "reviewer_outcome": case.reviewer_outcome,
        "review_notes": case.review_notes,
        "created_at": case.created_at,
        "updated_at": case.updated_at,
        "document_url": primary_doc_url,
        "live_photo_url": live_doc_url,
        "fields": [
            {
                "field_name": f.field_name,
                "value": f.value,
                "confidence": f.confidence,
                "bbox": [f.bbox_x, f.bbox_y, f.bbox_w, f.bbox_h] if f.bbox_x is not None else None,
                "is_mrz": f.is_mrz,
                "validation_status": f.validation_status,
            }
            for f in fields
        ],
        "validation_results": [
            {
                "rule_id": v.rule_id,
                "rule_name": v.rule_name,
                "category": v.category,
                "status": v.status.value,
                "severity": v.severity.value,
                "explanation": v.explanation,
                "evidence": json.loads(v.evidence_json or "{}"),
            }
            for v in vals
        ],
        "tamper_results": [
            {
                "anomaly_type": t.anomaly_type,
                "status": t.status.value,
                "score": t.score,
                "heatmap_path": t.heatmap_path,
                "explanation": t.explanation,
                "evidence_regions": json.loads(t.evidence_regions_json or "[]"),
            }
            for t in tampers
        ],
        "face_result": (
            {
                "document_face_detected": faces[0].document_face_detected,
                "live_face_detected": faces[0].live_face_detected,
                "similarity_score": faces[0].similarity_score,
                "quality_score": faces[0].quality_score,
                "outcome": faces[0].outcome.value,
                "explanation": faces[0].explanation,
                "doc_portrait_url": faces[0].doc_portrait_path,
                "live_photo_url": faces[0].live_photo_path,
            }
            if faces
            else None
        ),
        "review_actions": [
            {
                "id": a.id,
                "action": a.action,
                "reason": a.reason,
                "notes": a.notes,
                "reviewer": a.user.full_name if a.user else "Reviewer",
                "created_at": a.created_at,
            }
            for a in actions
        ],
    }


@router.get("")
def list_cases(
    status: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Case)

    if status:
        query = query.filter(Case.status == status.upper())
    if document_type:
        query = query.filter(Case.document_type == document_type.upper())
    if priority:
        query = query.filter(Case.review_priority == priority.upper())
    if search:
        term = f"%{search}%"
        query = query.filter(
            (Case.id.ilike(term))
            | (Case.applicant_name.ilike(term))
            | (Case.document_number.ilike(term))
            | (Case.title.ilike(term))
        )

    total = query.count()
    cases = query.order_by(desc(Case.created_at)).offset(offset).limit(limit).all()

    # KPI counts for dashboard
    active_count = db.query(Case).filter(Case.status == CaseStatus.PROCESSING).count()
    needs_review_count = db.query(Case).filter(Case.status == CaseStatus.NEEDS_REVIEW).count()
    completed_count = db.query(Case).filter(Case.status == CaseStatus.COMPLETED).count()
    high_priority_count = db.query(Case).filter(Case.review_priority == ReviewPriority.HIGH_PRIORITY_REVIEW).count()

    return {
        "total": total,
        "active_cases": active_count,
        "needs_review": needs_review_count,
        "completed": completed_count,
        "high_priority": high_priority_count,
        "items": [
            {
                "id": c.id,
                "title": c.title,
                "document_type": c.document_type.value,
                "status": c.status.value,
                "review_priority": c.review_priority.value,
                "overall_confidence": c.overall_confidence,
                "applicant_name": c.applicant_name or "Unknown Applicant",
                "document_number": c.document_number or "N/A",
                "nationality": c.nationality or "N/A",
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c in cases
        ],
    }


@router.post("/{case_id}/review")
def record_review(
    case_id: str,
    req: ReviewSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    action_type = req.action.upper()
    if action_type == "CLEAR":
        case.status = CaseStatus.COMPLETED
        case.review_priority = ReviewPriority.LOW_CONCERN
    elif action_type == "ESCALATE":
        case.status = CaseStatus.ESCALATED
        case.review_priority = ReviewPriority.HIGH_PRIORITY_REVIEW
    elif action_type == "REQUEST_BETTER_IMAGE":
        case.status = CaseStatus.NEEDS_REVIEW
    elif action_type == "RECORD_OUTCOME":
        case.status = CaseStatus.CLOSED

    case.reviewer_id = current_user.id
    case.reviewer_outcome = action_type
    case.review_notes = req.notes

    action_record = ReviewAction(
        case_id=case.id,
        user_id=current_user.id,
        action=action_type,
        reason=req.reason,
        notes=req.notes,
    )
    db.add(action_record)
    db.commit()

    log_audit_event(
        db,
        action=f"REVIEW_{action_type}",
        case_id=case.id,
        user_id=current_user.id,
        details={"action": action_type, "reason": req.reason, "notes": req.notes},
    )

    return {
        "case_id": case.id,
        "new_status": case.status.value,
        "review_priority": case.review_priority.value,
        "reviewer": current_user.full_name,
        "recorded_action": action_type,
    }
