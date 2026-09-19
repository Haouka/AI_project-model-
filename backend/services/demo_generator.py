import os
import math
from pathlib import Path
from typing import Dict, Any, List
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from backend.config import DEMO_DIR
from backend.services.mrz_service import calculate_check_digit


def _generate_synthetic_face(seed: int, width: int = 150, height: int = 180) -> Image.Image:
    """Generates a clean synthetic avatar face with realistic portrait composition"""
    img = Image.new("RGB", (width, height), color=(225, 232, 240))
    draw = ImageDraw.Draw(img)

    np.random.seed(seed)
    skin_tones = [(245, 218, 192), (230, 190, 160), (200, 150, 120), (140, 95, 70)]
    skin = skin_tones[seed % len(skin_tones)]
    hair_colors = [(40, 30, 20), (90, 60, 30), (160, 120, 60), (30, 30, 30)]
    hair = hair_colors[seed % len(hair_colors)]

    cx, cy = width // 2, int(height * 0.46)
    head_w, head_h = int(width * 0.55), int(height * 0.52)

    # Hair background
    draw.ellipse(
        [cx - head_w // 2 - 8, cy - head_h // 2 - 12, cx + head_w // 2 + 8, cy + head_h // 2 + 4],
        fill=hair
    )

    # Face oval
    draw.ellipse(
        [cx - head_w // 2, cy - head_h // 2, cx + head_w // 2, cy + head_h // 2],
        fill=skin,
        outline=(min(255, skin[0] + 15), min(255, skin[1] + 15), min(255, skin[2] + 15)),
        width=2
    )

    # Eyes
    eye_y = cy - 6
    eye_dx = int(head_w * 0.22)
    draw.ellipse([cx - eye_dx - 7, eye_y - 4, cx - eye_dx + 7, eye_y + 4], fill=(255, 255, 255))
    draw.ellipse([cx + eye_dx - 7, eye_y - 4, cx + eye_dx + 7, eye_y + 4], fill=(255, 255, 255))
    draw.ellipse([cx - eye_dx - 3, eye_y - 3, cx - eye_dx + 3, eye_y + 3], fill=(30, 30, 40))
    draw.ellipse([cx + eye_dx - 3, eye_y - 3, cx + eye_dx + 3, eye_y + 3], fill=(30, 30, 40))

    # Eyebrows
    draw.line([cx - eye_dx - 10, eye_y - 12, cx - eye_dx + 9, eye_y - 10], fill=hair, width=3)
    draw.line([cx + eye_dx - 9, eye_y - 10, cx + eye_dx + 10, eye_y - 12], fill=hair, width=3)

    # Nose
    draw.line([cx, eye_y, cx, cy + 14], fill=(max(0, skin[0] - 40), max(0, skin[1] - 40), max(0, skin[2] - 40)), width=2)
    draw.arc([cx - 5, cy + 10, cx + 5, cy + 18], 0, 180, fill=(max(0, skin[0] - 40), max(0, skin[1] - 40), max(0, skin[2] - 40)), width=2)

    # Mouth
    draw.arc([cx - 14, cy + 22, cx + 14, cy + 34], 0, 180, fill=(180, 80, 80), width=3)

    # Suit / collar
    draw.polygon(
        [(0, height), (cx - 25, cy + head_h // 2 + 5), (cx + 25, cy + head_h // 2 + 5), (width, height)],
        fill=(35, 45, 65)
    )
    draw.polygon([(cx - 15, height), (cx, cy + head_h // 2 + 15), (cx + 15, height)], fill=(240, 240, 245))

    return img


def _draw_guilloche_pattern(draw: ImageDraw.ImageDraw, w: int, h: int):
    """Draws subtle security background guilloche curves typical of identity documents"""
    for i in range(0, w, 25):
        points = []
        for y in range(0, h, 8):
            x = i + int(10 * math.sin(y * 0.04) + 6 * math.cos(y * 0.02))
            points.append((x, y))
        draw.line(points, fill=(228, 235, 245), width=1)


def generate_demo_documents():
    """Pre-generates the 5 realistic demo documents and metadata"""
    demo_files = {}

    # 1. Clean Valid Passport (US)
    path1 = DEMO_DIR / "demo_clean_passport.jpg"
    w, h = 800, 520
    img1 = Image.new("RGB", (w, h), color=(245, 248, 252))
    d1 = ImageDraw.Draw(img1)
    _draw_guilloche_pattern(d1, w, h)

    # Header
    d1.rectangle([(0, 0), (w, 55)], fill=(18, 38, 75))
    d1.text((30, 16), "UNITED STATES OF AMERICA / PASSPORT", fill=(255, 255, 255))
    d1.text((680, 16), "TYPE: P", fill=(220, 230, 245))

    # Portrait
    face1 = _generate_synthetic_face(seed=42, width=190, height=230)
    img1.paste(face1, (40, 80))
    d1.rectangle([(38, 78), (232, 312)], outline=(120, 140, 170), width=2)

    # Document details
    fields1 = [
        ("PASSPORT NO.", "C40294821", (280, 80)),
        ("SURNAME / NOM", "CROSS", (280, 125)),
        ("GIVEN NAMES / PRENOMS", "ALEXANDER", (280, 165)),
        ("NATIONALITY", "USA", (280, 205)),
        ("DATE OF BIRTH", "12 APR 1988", (280, 245)),
        ("SEX", "M", (520, 245)),
        ("DATE OF ISSUE", "10 MAY 2021", (280, 285)),
        ("DATE OF EXPIRY", "10 MAY 2031", (520, 285)),
    ]
    for label, val, pos in fields1:
        d1.text((pos[0], pos[1]), label, fill=(100, 115, 135))
        d1.text((pos[0], pos[1] + 16), val, fill=(15, 25, 45))

    # MRZ lines
    # TD3: P<USACROSS<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<<<
    # Line 2: C402948218USA8804124M3105102<<<<<<<<<<<<<<02
    l1 = "P<USACROSS<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<"
    # Check digits: C40294821 (8), 880412 (4), 310510 (2)
    c_doc = calculate_check_digit("C40294821")
    c_dob = calculate_check_digit("880412")
    c_exp = calculate_check_digit("310510")
    comp_str = f"C40294821{c_doc}880412{c_dob}310510{c_exp}<<<<<<<<<<<<<<"
    c_comp = calculate_check_digit(comp_str)
    l2 = f"C40294821{c_doc}USA880412{c_dob}M310510{c_exp}<<<<<<<<<<<<<<{c_comp}"

    d1.rectangle([(0, 410), (w, h)], fill=(235, 240, 248))
    d1.line([(0, 410), (w, 410)], fill=(180, 195, 215), width=2)
    d1.text((35, 428), l1, fill=(20, 30, 50))
    d1.text((35, 465), l2, fill=(20, 30, 50))
    img1.save(str(path1), quality=95)

    demo_files["clean_passport"] = {
        "file_path": str(path1),
        "document_type": "PASSPORT",
        "title": "Clean Authentic US Passport",
        "applicant_name": "ALEXANDER CROSS",
        "document_number": "C40294821",
        "nationality": "USA",
        "expected_status": "COMPLETED",
        "expected_priority": "LOW_CONCERN",
        "fields": {
            "name": "ALEXANDER CROSS",
            "passport_number": "C40294821",
            "nationality": "USA",
            "date_of_birth": "1988-04-12",
            "gender": "M",
            "issue_date": "2021-05-10",
            "expiry_date": "2031-05-10",
            "mrz_line1": l1,
            "mrz_line2": l2,
        }
    }

    # 2. Tampered Passport (Photo Replacement Anomaly)
    path2 = DEMO_DIR / "demo_tampered_passport.jpg"
    img2 = Image.new("RGB", (w, h), color=(248, 245, 240))
    d2 = ImageDraw.Draw(img2)
    _draw_guilloche_pattern(d2, w, h)

    d2.rectangle([(0, 0), (w, 55)], fill=(80, 20, 30))
    d2.text((30, 16), "UNITED KINGDOM OF GREAT BRITAIN / PASSPORT", fill=(255, 255, 255))
    d2.text((680, 16), "TYPE: P", fill=(240, 220, 225))

    # Spliced photo with strong edge boundary artifact
    face2 = _generate_synthetic_face(seed=99, width=190, height=230)
    # Convert to high-noise altered patch
    face_arr = np.array(face2)
    noise = np.random.normal(0, 15, face_arr.shape).astype(np.int16)
    noisy_face = np.clip(face_arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img2.paste(Image.fromarray(noisy_face), (40, 80))

    # Harsh rectangular cut edge simulating digital copy-paste
    d2.rectangle([(38, 78), (232, 312)], outline=(255, 50, 50), width=3)

    fields2 = [
        ("PASSPORT NO.", "982341094", (280, 80)),
        ("SURNAME", "CONNOR", (280, 125)),
        ("GIVEN NAMES", "SARAH JANE", (280, 165)),
        ("NATIONALITY", "GBR", (280, 205)),
        ("DATE OF BIRTH", "28 FEB 1985", (280, 245)),
        ("SEX", "F", (520, 245)),
        ("DATE OF ISSUE", "15 JUN 2019", (280, 285)),
        ("DATE OF EXPIRY", "15 JUN 2029", (520, 285)),
    ]
    for label, val, pos in fields2:
        d2.text((pos[0], pos[1]), label, fill=(110, 100, 100))
        d2.text((pos[0], pos[1] + 16), val, fill=(35, 15, 20))

    c_doc2 = calculate_check_digit("982341094")
    c_dob2 = calculate_check_digit("850228")
    c_exp2 = calculate_check_digit("290615")
    l1_2 = "P<GBRCONNOR<<SARAH<JANE<<<<<<<<<<<<<<<<<<<<<"
    l2_2 = f"982341094{c_doc2}GBR850228{c_dob2}F290615{c_exp2}<<<<<<<<<<<<<<0"

    d2.rectangle([(0, 410), (w, h)], fill=(245, 235, 235))
    d2.line([(0, 410), (w, 410)], fill=(210, 180, 180), width=2)
    d2.text((35, 428), l1_2, fill=(40, 20, 25))
    d2.text((35, 465), l2_2, fill=(40, 20, 25))
    img2.save(str(path2), quality=80)

    demo_files["tampered_passport"] = {
        "file_path": str(path2),
        "document_type": "PASSPORT",
        "title": "Photo-Replaced UK Passport (Boundary Discontinuity)",
        "applicant_name": "SARAH JANE CONNOR",
        "document_number": "982341094",
        "nationality": "GBR",
        "expected_status": "NEEDS_REVIEW",
        "expected_priority": "HIGH_PRIORITY_REVIEW",
        "fields": {
            "name": "SARAH JANE CONNOR",
            "passport_number": "982341094",
            "nationality": "GBR",
            "date_of_birth": "1985-02-28",
            "gender": "F",
            "issue_date": "2019-06-15",
            "expiry_date": "2029-06-15",
            "mrz_line1": l1_2,
            "mrz_line2": l2_2,
        }
    }

    # 3. Altered Expiry Date (Visual Zone vs MRZ Mismatch)
    path3 = DEMO_DIR / "demo_altered_expiry.jpg"
    img3 = Image.new("RGB", (w, h), color=(245, 250, 245))
    d3 = ImageDraw.Draw(img3)
    _draw_guilloche_pattern(d3, w, h)

    d3.rectangle([(0, 0), (w, 55)], fill=(20, 60, 40))
    d3.text((30, 16), "REPUBLIC OF SOUTH AFRICA / PASSPORT", fill=(255, 255, 255))
    d3.text((680, 16), "TYPE: P", fill=(210, 240, 220))

    face3 = _generate_synthetic_face(seed=77, width=190, height=230)
    img3.paste(face3, (40, 80))
    d3.rectangle([(38, 78), (232, 312)], outline=(100, 150, 120), width=2)

    # VISUAL EXPIRY SAYS 2034, BUT MRZ SAYS 240820 (EXPIRED!)
    fields3 = [
        ("PASSPORT NO.", "A08912304", (280, 80)),
        ("SURNAME", "MANDELA", (280, 125)),
        ("GIVEN NAMES", "THABO", (280, 165)),
        ("NATIONALITY", "ZAF", (280, 205)),
        ("DATE OF BIRTH", "14 JUL 1980", (280, 245)),
        ("SEX", "M", (520, 245)),
        ("DATE OF ISSUE", "20 AUG 2014", (280, 285)),
        ("DATE OF EXPIRY", "20 AUG 2034", (520, 285)),  # Digitally altered text!
    ]
    for label, val, pos in fields3:
        d3.text((pos[0], pos[1]), label, fill=(90, 120, 100))
        d3.text((pos[0], pos[1] + 16), val, fill=(15, 40, 25))

    c_doc3 = calculate_check_digit("A08912304")
    c_dob3 = calculate_check_digit("800714")
    c_exp3 = calculate_check_digit("240820")  # Original 2024 expired date in MRZ
    l1_3 = "P<ZAFMANDELA<<THABO<<<<<<<<<<<<<<<<<<<<<<<<<"
    l2_3 = f"A08912304{c_doc3}ZAF800714{c_dob3}M240820{c_exp3}<<<<<<<<<<<<<<0"

    d3.rectangle([(0, 410), (w, h)], fill=(235, 245, 235))
    d3.line([(0, 410), (w, 410)], fill=(180, 210, 180), width=2)
    d3.text((35, 428), l1_3, fill=(15, 45, 25))
    d3.text((35, 465), l2_3, fill=(15, 45, 25))
    img3.save(str(path3), quality=92)

    demo_files["altered_expiry"] = {
        "file_path": str(path3),
        "document_type": "PASSPORT",
        "title": "Altered Expiry Date (Visual vs MRZ Conflict)",
        "applicant_name": "THABO MANDELA",
        "document_number": "A08912304",
        "nationality": "ZAF",
        "expected_status": "NEEDS_REVIEW",
        "expected_priority": "HIGH_PRIORITY_REVIEW",
        "fields": {
            "name": "THABO MANDELA",
            "passport_number": "A08912304",
            "nationality": "ZAF",
            "date_of_birth": "1980-07-14",
            "gender": "M",
            "issue_date": "2014-08-20",
            "expiry_date": "2034-08-20",  # visual
            "mrz_line1": l1_3,
            "mrz_line2": l2_3,
        }
    }

    # 4. Inconsistent Schengen Visa (Overstay anomaly)
    path4 = DEMO_DIR / "demo_schengen_visa.jpg"
    img4 = Image.new("RGB", (w, 450), color=(250, 248, 242))
    d4 = ImageDraw.Draw(img4)
    _draw_guilloche_pattern(d4, w, 450)

    d4.rectangle([(0, 0), (w, 50)], fill=(28, 55, 90))
    d4.text((30, 15), "SCHENGEN VISA / ETATS SCHENGEN", fill=(255, 255, 255))
    d4.text((650, 15), "VISA TYPE: C", fill=(230, 240, 255))

    visa_fields = [
        ("VISA NUMBER", "VC8810294", (50, 80)),
        ("VALID FOR", "SCHENGEN STATES", (50, 130)),
        ("FROM / DU", "2026-06-01", (50, 180)),
        ("UNTIL / AU", "2026-07-01", (280, 180)),  # 30 day window
        ("NUMBER OF ENTRIES", "MULTIPLE", (520, 180)),
        ("DURATION OF STAY", "90 DAYS", (50, 230)),  # Conflict: 90 days inside 30 day window!
        ("ISSUED IN", "ROME", (280, 230)),
        ("PASSPORT NO.", "IT489102", (520, 230)),
        ("SURNAME, NAME", "ROSSI, MARCO", (50, 280)),
    ]
    for label, val, pos in visa_fields:
        d4.text((pos[0], pos[1]), label, fill=(120, 110, 90))
        d4.text((pos[0], pos[1] + 16), val, fill=(30, 25, 20))

    img4.save(str(path4), quality=90)

    demo_files["schengen_visa"] = {
        "file_path": str(path4),
        "document_type": "VISA",
        "title": "Schengen Visa (Stay Exceeds Validity Window)",
        "applicant_name": "MARCO ROSSI",
        "document_number": "VC8810294",
        "nationality": "ITA",
        "expected_status": "NEEDS_REVIEW",
        "expected_priority": "NEEDS_REVIEW",
        "fields": {
            "visa_number": "VC8810294",
            "visa_type": "C - SHORT STAY",
            "valid_from": "2026-06-01",
            "valid_until": "2026-07-01",
            "stay_duration": "90 DAYS",
            "entries": "MULTIPLE",
            "passport_number": "IT489102",
            "name": "MARCO ROSSI",
        }
    }

    # 5. Presented Live Face Photos for Biometric Comparison
    # Live face matching demo 1 (Alex Cross)
    live1 = _generate_synthetic_face(seed=42, width=200, height=240)
    live1_path = DEMO_DIR / "demo_live_match.jpg"
    live1.save(str(live1_path), quality=95)

    # Live face mismatching demo 2 (Sarah Connor presented by different person)
    live2 = _generate_synthetic_face(seed=12, width=200, height=240)
    live2_path = DEMO_DIR / "demo_live_mismatch.jpg"
    live2.save(str(live2_path), quality=95)

    demo_files["live_faces"] = {
        "matching_alex": str(live1_path),
        "mismatch_impostor": str(live2_path),
    }

    return demo_files


if __name__ == "__main__":
    generate_demo_documents()
    print("Demo documents created successfully.")
