import numpy as np
import cv2
import pytest
from backend.services.tamper_service import tamper_detector


def test_tamper_detector_analysis(tmp_path):
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    cv2.putText(img, "TEST PASSPORT", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    img_path = str(tmp_path / "test_doc.jpg")
    cv2.imwrite(img_path, img)

    results = tamper_detector.analyze(img_path, "PASSPORT")
    assert len(results) >= 3

    types = [r["anomaly_type"] for r in results]
    assert "ELA_COMPRESSION" in types
    assert "PHOTO_REPLACEMENT" in types
    assert "NOISE_INCONSISTENCY" in types

    for r in results:
        assert r["status"] in ["NO_CLEAR_ANOMALY", "POSSIBLE_ANOMALY", "INCONCLUSIVE", "REQUIRES_REVIEW"]
        assert 0.0 <= r["score"] <= 1.0
