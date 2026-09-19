import datetime
import json
import re
from typing import Dict, Any, List


class ValidationEngine:
    """
    Deterministic rule-based document validation engine.
    Produces comprehensive, explainable outputs including Rule ID, Name,
    Category, Status (PASS/FAIL/WARNING), Severity (CRITICAL/MAJOR/MINOR/INFO),
    human-readable Explanation, and structured Evidence.
    """

    def __init__(self):
        # Current reference date for testing (2026-09-19)
        self.reference_date = datetime.date(2026, 9, 19)

    def _parse_date(self, date_str: str) -> datetime.date | None:
        if not date_str:
            return None
        date_str = str(date_str).strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y", "%d %b %Y"):
            try:
                return datetime.datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return None

    def validate(
        self,
        document_type: str,
        fields: Dict[str, Any],
        mrz_data: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        results = []
        doc_type_upper = (document_type or "PASSPORT").upper()

        # 1. REQ-001 / REQ-002: Required fields completeness
        if doc_type_upper == "PASSPORT":
            required = ["name", "passport_number", "nationality", "date_of_birth", "expiry_date"]
            missing = [f for f in required if not fields.get(f) or str(fields.get(f)).strip() == ""]
            if missing:
                results.append({
                    "rule_id": "REQ-001",
                    "rule_name": "Required Fields Completeness",
                    "category": "COMPLETENESS",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": f"Missing required passport fields: {', '.join(missing)}.",
                    "evidence": {"missing_fields": missing, "present_fields": list(fields.keys())},
                })
            else:
                results.append({
                    "rule_id": "REQ-001",
                    "rule_name": "Required Fields Completeness",
                    "category": "COMPLETENESS",
                    "status": "PASS",
                    "severity": "CRITICAL",
                    "explanation": "All mandatory passport fields are present.",
                    "evidence": {"required_fields": required},
                })

        elif doc_type_upper == "VISA":
            required = ["visa_number", "visa_type", "valid_from", "valid_until"]
            missing = [f for f in required if not fields.get(f) or str(fields.get(f)).strip() == ""]
            if missing:
                results.append({
                    "rule_id": "REQ-002",
                    "rule_name": "Required Visa Fields Completeness",
                    "category": "COMPLETENESS",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": f"Missing required visa fields: {', '.join(missing)}.",
                    "evidence": {"missing_fields": missing},
                })
            else:
                results.append({
                    "rule_id": "REQ-002",
                    "rule_name": "Required Visa Fields Completeness",
                    "category": "COMPLETENESS",
                    "status": "PASS",
                    "severity": "CRITICAL",
                    "explanation": "All mandatory visa fields are present.",
                    "evidence": {"required_fields": required},
                })

        # 2. DATE-001: Date Format Validation
        date_keys = ["date_of_birth", "issue_date", "expiry_date", "valid_from", "valid_until"]
        invalid_dates = []
        parsed_dates = {}
        for dk in date_keys:
            val = fields.get(dk)
            if val:
                parsed = self._parse_date(str(val))
                if not parsed:
                    invalid_dates.append(f"{dk} ('{val}')")
                else:
                    parsed_dates[dk] = parsed

        if invalid_dates:
            results.append({
                "rule_id": "DATE-001",
                "rule_name": "Date Format Validation",
                "category": "FORMAT",
                "status": "FAIL",
                "severity": "MAJOR",
                "explanation": f"Non-conforming date format detected in: {', '.join(invalid_dates)}.",
                "evidence": {"invalid_date_fields": invalid_dates},
            })
        else:
            results.append({
                "rule_id": "DATE-001",
                "rule_name": "Date Format Validation",
                "category": "FORMAT",
                "status": "PASS",
                "severity": "MAJOR",
                "explanation": "All extracted dates have valid, parseable calendar structures.",
                "evidence": {k: str(v) for k, v in parsed_dates.items()},
            })

        # 3. DATE-002: Expiry Validity
        exp_date = parsed_dates.get("expiry_date") or parsed_dates.get("valid_until")
        if exp_date:
            if exp_date < self.reference_date:
                results.append({
                    "rule_id": "DATE-002",
                    "rule_name": "Document Expiry Validity",
                    "category": "VALIDITY",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": f"Document is expired. Expiry date is {exp_date} (reference date is {self.reference_date}).",
                    "evidence": {"expiry_date": str(exp_date), "reference_date": str(self.reference_date)},
                })
            else:
                results.append({
                    "rule_id": "DATE-002",
                    "rule_name": "Document Expiry Validity",
                    "category": "VALIDITY",
                    "status": "PASS",
                    "severity": "CRITICAL",
                    "explanation": f"Document is within valid operational period (expires {exp_date}).",
                    "evidence": {"expiry_date": str(exp_date), "reference_date": str(self.reference_date)},
                })

        # 4. DATE-003: Issue vs Expiry Chronology
        issue_date = parsed_dates.get("issue_date") or parsed_dates.get("valid_from")
        if issue_date and exp_date:
            if exp_date <= issue_date:
                results.append({
                    "rule_id": "DATE-003",
                    "rule_name": "Issue vs Expiry Chronology",
                    "category": "CONSISTENCY",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": f"Logical inconsistency: expiry date ({exp_date}) is on or before issue date ({issue_date}).",
                    "evidence": {"issue_date": str(issue_date), "expiry_date": str(exp_date)},
                })
            else:
                term_years = (exp_date - issue_date).days / 365.25
                if doc_type_upper == "PASSPORT" and term_years > 10.5:
                    results.append({
                        "rule_id": "DATE-003",
                        "rule_name": "Issue vs Expiry Chronology",
                        "category": "CONSISTENCY",
                        "status": "WARNING",
                        "severity": "MAJOR",
                        "explanation": f"Passport validity span is {term_years:.1f} years, exceeding standard 10-year limit.",
                        "evidence": {"term_years": round(term_years, 1)},
                    })
                else:
                    results.append({
                        "rule_id": "DATE-003",
                        "rule_name": "Issue vs Expiry Chronology",
                        "category": "CONSISTENCY",
                        "status": "PASS",
                        "severity": "CRITICAL",
                        "explanation": "Expiry date is chronologically consistent with issue date.",
                        "evidence": {"issue_date": str(issue_date), "expiry_date": str(exp_date)},
                    })

        # 5. DATE-004: Date of Birth Plausibility
        dob = parsed_dates.get("date_of_birth")
        if dob:
            if dob > self.reference_date:
                results.append({
                    "rule_id": "DATE-004",
                    "rule_name": "Date of Birth Plausibility",
                    "category": "CONSISTENCY",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": f"Date of birth ({dob}) is in the future relative to reference date ({self.reference_date}).",
                    "evidence": {"date_of_birth": str(dob)},
                })
            else:
                age = (self.reference_date - dob).days // 365
                if age > 120:
                    results.append({
                        "rule_id": "DATE-004",
                        "rule_name": "Date of Birth Plausibility",
                        "category": "CONSISTENCY",
                        "status": "WARNING",
                        "severity": "MAJOR",
                        "explanation": f"Calculated applicant age is {age} years, exceeding expected biological limit.",
                        "evidence": {"age": age},
                    })
                else:
                    results.append({
                        "rule_id": "DATE-004",
                        "rule_name": "Date of Birth Plausibility",
                        "category": "CONSISTENCY",
                        "status": "PASS",
                        "severity": "MAJOR",
                        "explanation": f"Date of birth is plausible (calculated age: {age} years).",
                        "evidence": {"calculated_age": age, "date_of_birth": str(dob)},
                    })

        # 6. DATE-005: Visa Stay Duration Consistency
        if doc_type_upper == "VISA":
            stay_raw = fields.get("stay_duration")
            v_from = parsed_dates.get("valid_from")
            v_until = parsed_dates.get("valid_until")
            if stay_raw and v_from and v_until:
                stay_num = None
                m = re.search(r"\d+", str(stay_raw))
                if m:
                    stay_num = int(m.group(0))
                max_days = (v_until - v_from).days
                if stay_num and stay_num > max_days:
                    results.append({
                        "rule_id": "DATE-005",
                        "rule_name": "Visa Stay Duration Consistency",
                        "category": "CONSISTENCY",
                        "status": "FAIL",
                        "severity": "MAJOR",
                        "explanation": f"Permitted stay duration ({stay_num} days) exceeds the total visa validity window ({max_days} days).",
                        "evidence": {"stay_days": stay_num, "window_days": max_days},
                    })
                else:
                    results.append({
                        "rule_id": "DATE-005",
                        "rule_name": "Visa Stay Duration Consistency",
                        "category": "CONSISTENCY",
                        "status": "PASS",
                        "severity": "MAJOR",
                        "explanation": f"Stay duration ({stay_num or 'N/A'} days) is compatible with visa validity span.",
                        "evidence": {"stay_days": stay_num, "window_days": max_days},
                    })

        # 7. DOC-001: Document Number Pattern Format
        doc_num = fields.get("passport_number") or fields.get("document_number") or fields.get("visa_number")
        if doc_num:
            clean_num = str(doc_num).strip().replace(" ", "").upper()
            if not re.match(r"^[A-Z0-9<]{6,12}$", clean_num):
                results.append({
                    "rule_id": "DOC-001",
                    "rule_name": "Document Number Pattern Format",
                    "category": "FORMAT",
                    "status": "WARNING",
                    "severity": "MAJOR",
                    "explanation": f"Document number '{clean_num}' contains irregular characters or unusual length.",
                    "evidence": {"document_number": clean_num},
                })
            else:
                results.append({
                    "rule_id": "DOC-001",
                    "rule_name": "Document Number Pattern Format",
                    "category": "FORMAT",
                    "status": "PASS",
                    "severity": "MAJOR",
                    "explanation": f"Document number '{clean_num}' matches standard alphanumeric format specifications.",
                    "evidence": {"document_number": clean_num},
                })

        # 8. MRZ Rules & Cross-field Checks
        if doc_type_upper == "PASSPORT":
            if not mrz_data:
                results.append({
                    "rule_id": "MRZ-001",
                    "rule_name": "MRZ Syntax & Presence",
                    "category": "MRZ",
                    "status": "FAIL",
                    "severity": "CRITICAL",
                    "explanation": "No readable Machine Readable Zone (MRZ) was detected on this passport.",
                    "evidence": {"detected": False},
                })
            else:
                checksums = mrz_data.get("checksums", {})

                # MRZ-001
                results.append({
                    "rule_id": "MRZ-001",
                    "rule_name": "MRZ Syntax & Presence",
                    "category": "MRZ",
                    "status": "PASS",
                    "severity": "CRITICAL",
                    "explanation": "Valid ICAO Doc 9303 TD3 MRZ layout detected.",
                    "evidence": {"raw_lines": mrz_data.get("raw_lines", [])},
                })

                # MRZ-002: Document number check digit
                d_check = checksums.get("document_number", {})
                d_valid = d_check.get("valid", False)
                results.append({
                    "rule_id": "MRZ-002",
                    "rule_name": "MRZ Document Number Checksum",
                    "category": "MRZ",
                    "status": "PASS" if d_valid else "FAIL",
                    "severity": "CRITICAL",
                    "explanation": (
                        f"MRZ document number check digit passed ({d_check.get('provided')})."
                        if d_valid
                        else f"MRZ document number check digit mismatch: provided '{d_check.get('provided')}', expected '{d_check.get('expected')}'."
                    ),
                    "evidence": d_check,
                })

                # MRZ-003: DOB check digit
                b_check = checksums.get("date_of_birth", {})
                b_valid = b_check.get("valid", False)
                results.append({
                    "rule_id": "MRZ-003",
                    "rule_name": "MRZ Date of Birth Checksum",
                    "category": "MRZ",
                    "status": "PASS" if b_valid else "FAIL",
                    "severity": "CRITICAL",
                    "explanation": (
                        f"MRZ DOB check digit valid ({b_check.get('provided')})."
                        if b_valid
                        else f"MRZ DOB check digit mismatch: provided '{b_check.get('provided')}', expected '{b_check.get('expected')}'."
                    ),
                    "evidence": b_check,
                })

                # MRZ-004: Expiry date check digit
                e_check = checksums.get("expiry_date", {})
                e_valid = e_check.get("valid", False)
                results.append({
                    "rule_id": "MRZ-004",
                    "rule_name": "MRZ Expiry Date Checksum",
                    "category": "MRZ",
                    "status": "PASS" if e_valid else "FAIL",
                    "severity": "CRITICAL",
                    "explanation": (
                        f"MRZ expiry date check digit valid ({e_check.get('provided')})."
                        if e_valid
                        else f"MRZ expiry check digit mismatch: provided '{e_check.get('provided')}', expected '{e_check.get('expected')}'."
                    ),
                    "evidence": e_check,
                })

                # MRZ-005: Composite check digit
                c_check = checksums.get("composite", {})
                c_valid = c_check.get("valid", False)
                results.append({
                    "rule_id": "MRZ-005",
                    "rule_name": "MRZ Composite Checksum",
                    "category": "MRZ",
                    "status": "PASS" if c_valid else "FAIL",
                    "severity": "CRITICAL",
                    "explanation": (
                        f"MRZ composite check digit valid ({c_check.get('provided')})."
                        if c_valid
                        else f"MRZ composite check digit mismatch: provided '{c_check.get('provided')}', expected '{c_check.get('expected')}'."
                    ),
                    "evidence": c_check,
                })

                # Cross checks: VIZ vs MRZ
                # CROSS-001: Document Number
                viz_doc = str(fields.get("passport_number", "")).strip().upper().replace("<", "")
                mrz_doc = str(mrz_data.get("document_number", "")).strip().upper().replace("<", "")
                if viz_doc and mrz_doc:
                    if viz_doc == mrz_doc:
                        results.append({
                            "rule_id": "CROSS-001",
                            "rule_name": "VIZ to MRZ Document Number Match",
                            "category": "CROSS_FIELD",
                            "status": "PASS",
                            "severity": "CRITICAL",
                            "explanation": f"Visual passport number '{viz_doc}' matches MRZ document number perfectly.",
                            "evidence": {"viz_value": viz_doc, "mrz_value": mrz_doc},
                        })
                    else:
                        results.append({
                            "rule_id": "CROSS-001",
                            "rule_name": "VIZ to MRZ Document Number Match",
                            "category": "CROSS_FIELD",
                            "status": "FAIL",
                            "severity": "CRITICAL",
                            "explanation": f"Discrepancy detected: Visual passport number '{viz_doc}' does NOT match MRZ value '{mrz_doc}'.",
                            "evidence": {"viz_value": viz_doc, "mrz_value": mrz_doc},
                        })

                # CROSS-002: DOB Match
                viz_dob = str(fields.get("date_of_birth", "")).strip()
                mrz_dob = str(mrz_data.get("date_of_birth", "")).strip()
                if viz_dob and mrz_dob:
                    # Match dates
                    v_p = self._parse_date(viz_dob)
                    m_p = self._parse_date(mrz_dob)
                    if v_p and m_p and v_p == m_p:
                        results.append({
                            "rule_id": "CROSS-002",
                            "rule_name": "VIZ to MRZ Date of Birth Match",
                            "category": "CROSS_FIELD",
                            "status": "PASS",
                            "severity": "MAJOR",
                            "explanation": f"Visual date of birth ({v_p}) matches MRZ encoded date ({m_p}).",
                            "evidence": {"viz_dob": str(v_p), "mrz_dob": str(m_p)},
                        })
                    else:
                        results.append({
                            "rule_id": "CROSS-002",
                            "rule_name": "VIZ to MRZ Date of Birth Match",
                            "category": "CROSS_FIELD",
                            "status": "FAIL",
                            "severity": "MAJOR",
                            "explanation": f"Conflict between visual date of birth '{viz_dob}' and MRZ date '{mrz_dob}'.",
                            "evidence": {"viz_dob": viz_dob, "mrz_dob": mrz_dob},
                        })

                # CROSS-003: Expiry Date Match
                viz_exp = str(fields.get("expiry_date", "")).strip()
                mrz_exp = str(mrz_data.get("expiry_date", "")).strip()
                if viz_exp and mrz_exp:
                    v_p = self._parse_date(viz_exp)
                    m_p = self._parse_date(mrz_exp)
                    if v_p and m_p and v_p == m_p:
                        results.append({
                            "rule_id": "CROSS-003",
                            "rule_name": "VIZ to MRZ Expiry Date Match",
                            "category": "CROSS_FIELD",
                            "status": "PASS",
                            "severity": "CRITICAL",
                            "explanation": f"Visual expiry date ({v_p}) matches MRZ encoded expiry ({m_p}).",
                            "evidence": {"viz_expiry": str(v_p), "mrz_expiry": str(m_p)},
                        })
                    else:
                        results.append({
                            "rule_id": "CROSS-003",
                            "rule_name": "VIZ to MRZ Expiry Date Match",
                            "category": "CROSS_FIELD",
                            "status": "FAIL",
                            "severity": "CRITICAL",
                            "explanation": f"Critical alteration indicator: visual expiry date '{viz_exp}' does NOT match MRZ value '{mrz_exp}'.",
                            "evidence": {"viz_expiry": viz_exp, "mrz_expiry": mrz_exp},
                        })

                # CROSS-005: Name consistency
                viz_name = str(fields.get("name", "")).strip().upper()
                mrz_name = str(mrz_data.get("full_name", "")).strip().upper()
                if viz_name and mrz_name:
                    # Check token overlap
                    viz_tokens = set(re.findall(r"[A-Z]+", viz_name))
                    mrz_tokens = set(re.findall(r"[A-Z]+", mrz_name))
                    overlap = viz_tokens.intersection(mrz_tokens)
                    if len(overlap) >= 1:
                        results.append({
                            "rule_id": "CROSS-005",
                            "rule_name": "VIZ to MRZ Name Consistency",
                            "category": "CROSS_FIELD",
                            "status": "PASS",
                            "severity": "MAJOR",
                            "explanation": f"Name tokens match across visual and MRZ zones: {', '.join(overlap)}.",
                            "evidence": {"viz_name": viz_name, "mrz_name": mrz_name, "matched_tokens": list(overlap)},
                        })
                    else:
                        results.append({
                            "rule_id": "CROSS-005",
                            "rule_name": "VIZ to MRZ Name Consistency",
                            "category": "CROSS_FIELD",
                            "status": "WARNING",
                            "severity": "MAJOR",
                            "explanation": f"No common name tokens between visual name '{viz_name}' and MRZ name '{mrz_name}'.",
                            "evidence": {"viz_name": viz_name, "mrz_name": mrz_name},
                        })

        # 9. REF-001: Authorized Reference System Lookup
        # Simulates checking border authority watchlist / lost-stolen database
        # Fictional watchlist document numbers: e.g. "REVOKED99", "STOLEN123"
        doc_val = (doc_num or "").upper().strip()
        if "STOLEN" in doc_val or "REVOKED" in doc_val:
            results.append({
                "rule_id": "REF-001",
                "rule_name": "Authorized Reference System Lookup",
                "category": "REFERENCE",
                "status": "FAIL",
                "severity": "CRITICAL",
                "explanation": f"Document {doc_val} flagged on authorized reference system (Recorded as revoked/stolen).",
                "evidence": {"database": "Interpol SLTD / Border Control Gateway", "flag": "REVOKED"},
            })
        else:
            results.append({
                "rule_id": "REF-001",
                "rule_name": "Authorized Reference System Lookup",
                "category": "REFERENCE",
                "status": "PASS",
                "severity": "CRITICAL",
                "explanation": "No adverse records or stolen document alerts on simulated border reference database.",
                "evidence": {"database": "Interpol SLTD / Border Control Gateway", "status": "CLEAR"},
            })

        return results


validation_engine = ValidationEngine()
