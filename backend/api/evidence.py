from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import Case, DocumentField, ValidationResult, TamperResult, FaceResult
from backend.services.evidence_service import evidence_aggregator

router = APIRouter(prefix="/cases", tags=["Evidence"])


@router.get("/{case_id}/evidence")
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    fields = db.query(DocumentField).filter(DocumentField.case_id == case.id).all()
    vals = db.query(ValidationResult).filter(ValidationResult.case_id == case.id).all()
    tampers = db.query(TamperResult).filter(TamperResult.case_id == case.id).all()
    faces = db.query(FaceResult).filter(FaceResult.case_id == case.id).all()

    ocr_summary = {
        "average_confidence": case.overall_confidence or 0.95,
        "fields": {f.field_name: {"value": f.value, "confidence": f.confidence} for f in fields},
    }

    val_list = [
        {
            "rule_id": v.rule_id,
            "rule_name": v.rule_name,
            "category": v.category,
            "status": v.status.value,
            "severity": v.severity.value,
            "explanation": v.explanation,
        }
        for v in vals
    ]

    tamper_list = [
        {
            "anomaly_type": t.anomaly_type,
            "status": t.status.value,
            "score": t.score,
            "explanation": t.explanation,
        }
        for t in tampers
    ]

    face_dict = (
        {
            "outcome": faces[0].outcome.value,
            "similarity_score": faces[0].similarity_score,
            "quality_score": faces[0].quality_score,
            "explanation": faces[0].explanation,
        }
        if faces
        else None
    )

    aggregated = evidence_aggregator.aggregate(
        ocr_summary=ocr_summary,
        validation_results=val_list,
        tamper_results=tamper_list,
        face_result=face_dict,
    )

    return {
        "case_id": case.id,
        "document_type": case.document_type.value,
        "review_priority": case.review_priority.value,
        "status": case.status.value,
        "evidence_report": aggregated,
    }
