from fastapi import APIRouter
from backend.rules.rule_definitions import DEFAULT_RULES

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("")
def list_rules():
    return {
        "count": len(DEFAULT_RULES),
        "rules": DEFAULT_RULES,
        "active_rule_version": "2026.09-v1.4",
    }
