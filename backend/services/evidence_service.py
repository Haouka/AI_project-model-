from typing import Dict, Any, List


class EvidenceAggregator:
    """
    Evidence Aggregation & Review Priority Engine.
    Combines OCR, deterministic rules, tampering forensics, and face verification
    into a transparent, explainable case summary and review-priority status.
    """

    def aggregate(
        self,
        ocr_summary: Dict[str, Any],
        validation_results: List[Dict[str, Any]],
        tamper_results: List[Dict[str, Any]],
        face_result: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        avg_ocr_conf = ocr_summary.get("average_confidence", 0.90)

        # 1. Validation analysis
        failed_critical_rules = [
            r for r in validation_results if r["status"] == "FAIL" and r["severity"] == "CRITICAL"
        ]
        failed_major_rules = [
            r for r in validation_results if r["status"] == "FAIL" and r["severity"] == "MAJOR"
        ]
        warning_rules = [r for r in validation_results if r["status"] == "WARNING"]
        passed_rules = [r for r in validation_results if r["status"] == "PASS"]

        mrz_rules = [r for r in validation_results if r["category"] == "MRZ"]
        mrz_all_pass = len(mrz_rules) > 0 and all(r["status"] == "PASS" for r in mrz_rules)

        date_rules = [r for r in validation_results if r["category"] in ("DATE", "VALIDITY")]
        date_all_pass = len(date_rules) > 0 and all(r["status"] == "PASS" for r in date_rules)

        # 2. Tampering analysis
        tamper_anomalies = [t for t in tamper_results if t["status"] == "POSSIBLE_ANOMALY"]
        tamper_reviews = [t for t in tamper_results if t["status"] == "REQUIRES_REVIEW"]
        tamper_inconclusive = [t for t in tamper_results if t["status"] == "INCONCLUSIVE"]

        # 3. Face verification analysis
        face_outcome = face_result.get("outcome", "NOT_PERFORMED") if face_result else "NOT_PERFORMED"

        # Determine overall Review Priority Indicator
        is_high_priority = False
        reasons_for_priority = []

        if failed_critical_rules:
            is_high_priority = True
            for r in failed_critical_rules:
                reasons_for_priority.append(f"Critical rule failed: {r['rule_name']} ({r['explanation']})")

        if tamper_anomalies:
            is_high_priority = True
            for t in tamper_anomalies:
                reasons_for_priority.append(f"Tampering anomaly: {t['anomaly_type']} ({t['explanation']})")

        if face_outcome == "POTENTIAL_MISMATCH":
            is_high_priority = True
            reasons_for_priority.append("Face verification flagged potential biometric mismatch.")

        if is_high_priority:
            review_priority = "HIGH_PRIORITY_REVIEW"
            status = "NEEDS_REVIEW"
        elif (
            failed_major_rules
            or warning_rules
            or tamper_reviews
            or tamper_inconclusive
            or face_outcome == "INCONCLUSIVE"
            or avg_ocr_conf < 0.85
        ):
            review_priority = "NEEDS_REVIEW"
            status = "NEEDS_REVIEW"
            if failed_major_rules:
                for r in failed_major_rules:
                    reasons_for_priority.append(f"Major rule inconsistency: {r['rule_name']}")
            if warning_rules:
                for r in warning_rules:
                    reasons_for_priority.append(f"Rule warning: {r['rule_name']} ({r['explanation']})")
            if tamper_reviews:
                for t in tamper_reviews:
                    reasons_for_priority.append(f"Forensic review required: {t['anomaly_type']}")
            if avg_ocr_conf < 0.85:
                reasons_for_priority.append(f"Borderline OCR confidence ({int(avg_ocr_conf * 100)}%).")
        else:
            review_priority = "LOW_CONCERN"
            status = "COMPLETED"
            reasons_for_priority.append("All automated integrity checks passed with high confidence.")

        # Structured evidence breakdown
        evidence_summary = {
            "review_priority": review_priority,
            "status": status,
            "overall_confidence": round(avg_ocr_conf, 2),
            "scores": {
                "ocr_confidence": f"{int(avg_ocr_conf * 100)}%",
                "mrz_validation": "PASS" if mrz_all_pass else ("FAIL" if mrz_rules else "N/A"),
                "date_validation": "PASS" if date_all_pass else "FAIL",
                "tamper_analysis": (
                    "ANOMALY DETECTED" if tamper_anomalies
                    else ("REQUIRES REVIEW" if tamper_reviews
                    else ("INCONCLUSIVE" if tamper_inconclusive else "NO CLEAR ANOMALY"))
                ),
                "face_verification": face_outcome.replace("_", " "),
            },
            "key_findings": reasons_for_priority,
            "statistics": {
                "total_rules": len(validation_results),
                "passed_rules": len(passed_rules),
                "failed_rules": len(failed_critical_rules) + len(failed_major_rules),
                "warning_rules": len(warning_rules),
            },
            "uncertainty_note": (
                "This report aggregates automated signals for human review. "
                "Final decisions must be recorded by an authorized reviewer according to standard operating procedures."
            ),
        }

        return evidence_summary


evidence_aggregator = EvidenceAggregator()
