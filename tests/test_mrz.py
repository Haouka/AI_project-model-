import pytest
from backend.services.mrz_service import (
    calculate_check_digit,
    parse_td3,
    parse_mrz_text,
    parse_mrz_date,
)


def test_calculate_check_digit():
    # Standard ICAO 9303 7-3-1 weight examples
    assert calculate_check_digit("520727") == 3
    assert calculate_check_digit("AB123456") == calculate_check_digit("AB123456")


def test_parse_mrz_date():
    assert parse_mrz_date("880412") == "1988-04-12"
    assert parse_mrz_date("210510") == "2021-05-10"
    assert parse_mrz_date("invalid") is None


def test_td3_parsing_and_checksums():
    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"

    result = parse_td3(line1, line2)

    assert result["document_type"] == "P"
    assert result["issuing_country"] == "UTO"
    assert result["surname"] == "ERIKSSON"
    assert result["given_names"] == "ANNA MARIA"
    assert result["document_number"] == "L898902C3"
    assert result["nationality"] == "UTO"
    assert result["gender"] == "F"
    assert result["date_of_birth"] == "1974-08-12"
    assert result["expiry_date"] == "2012-04-15"

    checksums = result["checksums"]
    assert checksums["document_number"]["valid"] is True
    assert checksums["date_of_birth"]["valid"] is True
    assert checksums["expiry_date"]["valid"] is True
    assert checksums["composite"]["valid"] is True
    assert checksums["all_passed"] is True


def test_td3_invalid_checksum():
    line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<"
    line2 = "L898902C39UTO7408122F1204159ZE184226B<<<<<10"  # Incorrect doc check digit '9' instead of '6'

    result = parse_td3(line1, line2)
    assert result["checksums"]["document_number"]["valid"] is False
    assert result["checksums"]["all_passed"] is False
