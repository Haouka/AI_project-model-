import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import AuditEvent, User


def log_audit_event(
    db: Session,
    action: str,
    case_id: Optional[str] = None,
    user_id: Optional[int] = None,
    status: str = "SUCCESS",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditEvent:
    event = AuditEvent(
        case_id=case_id,
        user_id=user_id,
        action=action,
        status=status,
        details_json=json.dumps(details or {}),
        ip_address=ip_address or "127.0.0.1",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
