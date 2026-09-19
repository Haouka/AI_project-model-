import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database.db import get_db
from backend.database.models import AuditEvent

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("/{case_id}")
def get_case_audit_trail(case_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.case_id == case_id)
        .order_by(desc(AuditEvent.timestamp))
        .all()
    )
    return {
        "case_id": case_id,
        "count": len(events),
        "events": [
            {
                "id": e.id,
                "action": e.action,
                "status": e.status,
                "user": e.user.full_name if e.user else "System Automation",
                "details": json.loads(e.details_json or "{}"),
                "timestamp": e.timestamp,
                "ip_address": e.ip_address,
            }
            for e in events
        ],
    }


@router.get("")
def list_system_audit_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(AuditEvent).order_by(desc(AuditEvent.timestamp))
    total = query.count()
    events = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "events": [
            {
                "id": e.id,
                "case_id": e.case_id,
                "action": e.action,
                "status": e.status,
                "user": e.user.full_name if e.user else "System Automation",
                "details": json.loads(e.details_json or "{}"),
                "timestamp": e.timestamp,
            }
            for e in events
        ],
    }
