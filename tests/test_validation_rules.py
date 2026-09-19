import pytest
from backend.rules.validation_engine import validation_engine
from backend.services.mrz_service import parse_td3


def test_required_fields_check():
    # Incomplete fields
    incomplete_fields = {
        "name": "John Doe",
        "passport_number": "P12345678",
    }
    results = validation_engine.validate("PASSPORT", incomplete_fields)
    req_rule = next(r for r in results if r["rule_id"] == "REQ-001")
    assert req_rule["status"] == "FAIL"
    assert "nationality" in req_rule["evidence"]["missing_fields"]

    # Complete fields
    complete_fields = {
        "name": "John Doe",
        "passport_number": "P12345678",
        "nationality": "USA",
        "date_of_birth": "1990-01-01",
        "expiry_date": "2030-01-01",
    }
    results_complete = validation_engine.validate("PASSPORT", complete_fields)
    req_rule_pass = next(r for r in results_complete if r["rule_id"] == "REQ-001")
    assert req_rule_pass["status"] == "PASS"


def test_date_validity_and_chronology():
    fields = {
        "name": "Jane Smith",
        "passport_number": "P98765432",
        "nationality": "GBR",
        "date_of_birth": "1995-05-15",
        "issue_date": "2022-01-01",
        "expiry_date": "2020-01-01",  # Expired and before issue date!
    }
    results = validation_engine.validate("PASSPORT", fields)

    exp_rule = next(r for r in results if r["rule_id"] == "DATE-002")
    assert exp_rule["status"] == "FAIL"

    chrono_rule = next(r for r in results if r["rule_id"] == "DATE-003")
    assert chrono_rule["status"] == "FAIL"


def test_visa_stay_duration_consistency():
    # Stay of 90 days inside a 30 day validity window
    fields = {
        "visa_number": "V1234567",
        "visa_type": "TOURIST",
        "valid_from": "2026-06-01",
        "valid_until": "2026-07-01",
        "stay_duration": "90 DAYS",
    }
    results = validation_engine.validate("VISA", fields)
    stay_rule = next(r for r in results if r["rule_id"] == "DATE-005")
    assert stay_rule["status"] == "FAIL"


def test_mrz_cross_field_match_and_mismatch():
    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
    mrz_data = parse_td3(line1, line2)

    # Matching fields
    matching_fields = {
        "name": "ANNA MARIA ERIKSSON",
        "passport_number": "L898902C3",
        "nationality": "UTO",
        "date_of_birth": "1974-08-12",
        "expiry_date": "2012-04-15",
    }
    res_match = validation_engine.validate("PASSPORT", matching_fields, mrz_data)
    cross_doc = next(r for r in res_match if r["rule_id"] == "CROSS-001")
    assert cross_doc["status"] == "PASS"

    # Mismatched visual passport number
    mismatched_fields = matching_fields.copy()
    mismatched_fields["passport_number"] = "FORGED999"
    res_mismatch = validation_engine.validate("PASSPORT", mismatched_fields, mrz_data)
    cross_doc_fail = next(r for r in res_mismatch if r["rule_id"] == "CROSS-001")
    assert cross_doc_fail["status"] == "FAIL"
