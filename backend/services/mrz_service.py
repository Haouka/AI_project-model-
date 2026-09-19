import re
from typing import Dict, Any, Optional, Tuple


def char_to_value(c: str) -> int:
    c = c.upper()
    if c.isdigit():
        return int(c)
    elif "A" <= c <= "Z":
        return ord(c) - ord("A") + 10
    elif c == "<":
        return 0
    return 0


def calculate_check_digit(data: str) -> int:
    weights = [7, 3, 1]
    total = 0
    for i, char in enumerate(data):
        val = char_to_value(char)
        weight = weights[i % 3]
        total += val * weight
    return total % 10


def parse_mrz_date(yy_mm_dd: str) -> Optional[str]:
    """Convert YYMMDD to YYYY-MM-DD estimating century"""
    if len(yy_mm_dd) != 6 or not yy_mm_dd.isdigit():
        return None
    yy = int(yy_mm_dd[0:2])
    mm = yy_mm_dd[2:4]
    dd = yy_mm_dd[4:6]

    # Century heuristic: current year threshold 35 (1936-2035)
    century = "20" if yy <= 35 else "19"
    return f"{century}{yy:02d}-{mm}-{dd}"


def parse_td3(line1: str, line2: str) -> Dict[str, Any]:
    """Parse standard ICAO Doc 9303 TD3 Passport MRZ (2 lines of 44 chars)"""
    line1 = line1.strip().upper().replace(" ", "")
    line2 = line2.strip().upper().replace(" ", "")

    if len(line1) != 44 or len(line2) != 44:
        # Pad or trim if close
        line1 = line1.ljust(44, "<")[:44]
        line2 = line2.ljust(44, "<")[:44]

    doc_type = line1[0:2].replace("<", "")
    issuing_country = line1[2:5].replace("<", "")

    # Name extraction: Surname<<Given Names
    names_raw = line1[5:]
    if "<<" in names_raw:
        parts = names_raw.split("<<", 1)
        surname = parts[0].replace("<", " ").strip()
        given_names = parts[1].replace("<", " ").strip()
        full_name = f"{given_names} {surname}".strip()
    else:
        full_name = names_raw.replace("<", " ").strip()
        surname = full_name
        given_names = ""

    # Line 2 fields
    doc_num_raw = line2[0:9]
    doc_num_check_char = line2[9]
    nationality = line2[10:13].replace("<", "")

    dob_raw = line2[13:19]
    dob_check_char = line2[19]

    gender_char = line2[20]
    gender = "M" if gender_char == "M" else ("F" if gender_char == "F" else "X")

    expiry_raw = line2[21:27]
    expiry_check_char = line2[27]

    opt_data = line2[28:42]
    opt_check_char = line2[42]

    composite_check_char = line2[43]

    # Calculate Checksums
    expected_doc_check = calculate_check_digit(doc_num_raw)
    doc_check_valid = (
        doc_num_check_char.isdigit() and int(doc_num_check_char) == expected_doc_check
    )

    expected_dob_check = calculate_check_digit(dob_raw)
    dob_check_valid = (
        dob_check_char.isdigit() and int(dob_check_char) == expected_dob_check
    )

    expected_exp_check = calculate_check_digit(expiry_raw)
    exp_check_valid = (
        expiry_check_char.isdigit() and int(expiry_check_char) == expected_exp_check
    )

    # Composite check over line2[0:10] + line2[13:20] + line2[21:43]
    composite_string = line2[0:10] + line2[13:20] + line2[21:43]
    expected_composite_check = calculate_check_digit(composite_string)
    composite_check_valid = (
        composite_check_char.isdigit() and int(composite_check_char) == expected_composite_check
    )

    # Clean document number
    document_number = doc_num_raw.replace("<", "")

    all_checks_passed = (
        doc_check_valid and dob_check_valid and exp_check_valid and composite_check_valid
    )

    return {
        "format": "TD3",
        "document_type": "P" if doc_type.startswith("P") else doc_type,
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": full_name,
        "document_number": document_number,
        "nationality": nationality,
        "date_of_birth": parse_mrz_date(dob_raw),
        "date_of_birth_raw": dob_raw,
        "gender": gender,
        "expiry_date": parse_mrz_date(expiry_raw),
        "expiry_date_raw": expiry_raw,
        "optional_data": opt_data.replace("<", ""),
        "checksums": {
            "document_number": {
                "provided": doc_num_check_char,
                "expected": str(expected_doc_check),
                "valid": doc_check_valid,
            },
            "date_of_birth": {
                "provided": dob_check_char,
                "expected": str(expected_dob_check),
                "valid": dob_check_valid,
            },
            "expiry_date": {
                "provided": expiry_check_char,
                "expected": str(expected_exp_check),
                "valid": exp_check_valid,
            },
            "composite": {
                "provided": composite_check_char,
                "expected": str(expected_composite_check),
                "valid": composite_check_valid,
            },
            "all_passed": all_checks_passed,
        },
        "raw_lines": [line1, line2],
    }


def parse_mrz_text(raw_text: str) -> Optional[Dict[str, Any]]:
    """Locates and parses MRZ lines from raw OCR text"""
    lines = [
        re.sub(r"[^A-Z0-9<]", "", line.strip().upper())
        for line in raw_text.splitlines()
        if len(re.sub(r"[^A-Z0-9<]", "", line.strip().upper())) >= 28
    ]

    # Look for 2 lines of 44 characters (TD3)
    td3_lines = [line for line in lines if len(line) == 44]
    if len(td3_lines) >= 2:
        for i in range(len(td3_lines) - 1):
            if td3_lines[i].startswith("P") or "<" in td3_lines[i]:
                return parse_td3(td3_lines[i], td3_lines[i + 1])

    # Try fuzzy length matching (within 42-46 chars)
    fuzzy_lines = [l for l in lines if 40 <= len(l) <= 46]
    if len(fuzzy_lines) >= 2:
        return parse_td3(fuzzy_lines[0].ljust(44, "<")[:44], fuzzy_lines[1].ljust(44, "<")[:44])

    return None
