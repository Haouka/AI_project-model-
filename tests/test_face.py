import numpy as np
import cv2
import pytest
from backend.services.face_service import face_verifier


def test_face_verification_without_live_photo(tmp_path):
    img = np.zeros((400, 400, 3), dtype=np.uint8)
    img_path = str(tmp_path / "doc_face.jpg")
    cv2.imwrite(img_path, img)

    result = face_verifier.verify(img_path, presented_image_path=None)
    assert result["outcome"] == "NOT_PERFORMED"
    assert "uncertainty_disclaimer" in result


def test_face_verification_with_live_photo(tmp_path):
    img1 = np.ones((300, 300, 3), dtype=np.uint8) * 128
    img2 = np.ones((300, 300, 3), dtype=np.uint8) * 128

    p1 = str(tmp_path / "face1.jpg")
    p2 = str(tmp_path / "face2.jpg")
    cv2.imwrite(p1, img1)
    cv2.imwrite(p2, img2)

    result = face_verifier.verify(p1, p2)
    assert result["outcome"] in ["SUPPORTING_MATCH", "POTENTIAL_MISMATCH", "INCONCLUSIVE"]
    assert "similarity_score" in result
    assert "quality_score" in result
