import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import cv2
import numpy as np
from backend.config import PROCESSED_DIR


class FaceVerificationEngine:
    """
    Biometric face verification and image quality assessment engine.
    Extracts portrait from document, detects presented face, assesses quality,
    and calculates supporting similarity metrics.
    """

    def __init__(self):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            self.face_cascade = None

    def _assess_quality(self, face_crop: np.ndarray) -> Tuple[float, str]:
        """
        Assesses face image quality based on sharpness (Laplacian variance),
        contrast, and brightness.
        Returns quality_score (0.0 - 1.0) and description.
        """
        if face_crop.size == 0:
            return 0.0, "Empty crop"

        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Sharpness score: 100+ is sharp, < 30 is blurry
        sharpness_score = min(1.0, lap_var / 120.0)

        # Brightness & contrast
        mean_bright = np.mean(gray)
        std_bright = np.std(gray)

        is_underexposed = mean_bright < 40
        is_overexposed = mean_bright > 220
        has_low_contrast = std_bright < 20

        if is_underexposed or is_overexposed or has_low_contrast:
            quality = sharpness_score * 0.5
            desc = "Poor illumination or low contrast"
        elif sharpness_score < 0.35:
            quality = sharpness_score
            desc = "Substantial motion or optical blur"
        else:
            quality = min(1.0, 0.4 + 0.6 * sharpness_score)
            desc = "Good resolution and clarity"

        return round(float(quality), 2), desc

    def _crop_face(self, image_path: str, is_document: bool = True) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """Detects and crops the primary face from an image"""
        img = cv2.imread(image_path)
        if img is None:
            return None, None

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        faces = []
        if self.face_cascade:
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(int(w * 0.08), int(h * 0.08))
            )

        # Heuristic fallback for passport portrait region if detector missed
        if len(faces) == 0 and is_document:
            # Standard left-side portrait region
            fx, fy, fw, fh = int(w * 0.04), int(h * 0.18), int(w * 0.32), int(h * 0.58)
            crop = img[fy : fy + fh, fx : fx + fw]
        elif len(faces) > 0:
            # Select the largest detected face
            largest = max(faces, key=lambda f: f[2] * f[3])
            fx, fy, fw, fh = largest
            # Add padding
            pad_x, pad_y = int(fw * 0.15), int(fh * 0.2)
            y1, y2 = max(0, fy - pad_y), min(h, fy + fh + pad_y)
            x1, x2 = max(0, fx - pad_x), min(w, fx + fw + pad_x)
            crop = img[y1:y2, x1:x2]
        else:
            return None, None

        # Save crop
        crop_filename = f"crop_{'doc' if is_document else 'live'}_{uuid.uuid4().hex[:8]}.jpg"
        crop_save_path = str(PROCESSED_DIR / crop_filename)
        cv2.imwrite(crop_save_path, crop)

        return crop, f"/api/v1/storage/processed/{crop_filename}"

    def _extract_facial_embedding(self, face_crop: np.ndarray) -> np.ndarray:
        """
        Extracts structural and color-spatial feature representation for comparison.
        """
        resized = cv2.resize(face_crop, (128, 128))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

        # Multi-scale histogram of oriented gradients (HOG) approximation
        gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0)
        gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1)
        mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)

        # 8-bin spatial orientation histogram
        hist = cv2.calcHist([ang], [0], None, [16], [0, 360])
        color_hist = cv2.calcHist([resized], [0, 1, 2], None, [6, 6, 6], [0, 256, 0, 256, 0, 256])

        combined = np.concatenate([hist.flatten(), color_hist.flatten()])
        norm = np.linalg.norm(combined)
        return combined / max(norm, 1e-6)

    def verify(
        self,
        document_image_path: str,
        presented_image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Performs biometric comparison between document portrait and live image.
        """
        # Crop document portrait
        doc_crop, doc_crop_url = self._crop_face(document_image_path, is_document=True)
        doc_face_detected = doc_crop is not None

        doc_quality, doc_quality_desc = (
            self._assess_quality(doc_crop) if doc_face_detected else (0.0, "No face detected")
        )

        if not presented_image_path:
            return {
                "document_face_detected": doc_face_detected,
                "live_face_detected": False,
                "similarity_score": 0.0,
                "quality_score": doc_quality,
                "outcome": "NOT_PERFORMED",
                "explanation": "No live or secondary presented image was provided for face comparison.",
                "doc_portrait_url": doc_crop_url,
                "live_photo_url": None,
                "uncertainty_disclaimer": "Face verification not performed. Manual visual check required.",
            }

        # Crop live face
        live_crop, live_crop_url = self._crop_face(presented_image_path, is_document=False)
        live_face_detected = live_crop is not None

        live_quality, live_quality_desc = (
            self._assess_quality(live_crop) if live_face_detected else (0.0, "No face detected")
        )

        if not doc_face_detected or not live_face_detected:
            return {
                "document_face_detected": doc_face_detected,
                "live_face_detected": live_face_detected,
                "similarity_score": 0.0,
                "quality_score": min(doc_quality, live_quality),
                "outcome": "INCONCLUSIVE",
                "explanation": (
                    "Face could not be reliably located in "
                    + ("document image." if not doc_face_detected else "presented live photo.")
                ),
                "doc_portrait_url": doc_crop_url,
                "live_photo_url": live_crop_url,
                "uncertainty_disclaimer": "Inconclusive result due to face detection limits. Proceed to human review.",
            }

        # Compute feature similarity
        v1 = self._extract_facial_embedding(doc_crop)
        v2 = self._extract_facial_embedding(live_crop)
        cos_sim = float(np.dot(v1, v2))
        similarity = round(max(0.0, min(1.0, cos_sim)), 3)

        avg_quality = round((doc_quality + live_quality) / 2.0, 2)

        if avg_quality < 0.35:
            outcome = "INCONCLUSIVE"
            explanation = f"Image quality is too low for reliable comparison ({doc_quality_desc} / {live_quality_desc})."
        elif similarity >= 0.72:
            outcome = "SUPPORTING_MATCH"
            explanation = (
                f"Facial features show strong visual alignment (similarity: {int(similarity * 100)}%). "
                "Serves as supporting evidence of identity."
            )
        elif similarity < 0.52:
            outcome = "POTENTIAL_MISMATCH"
            explanation = (
                f"Low facial feature similarity detected ({int(similarity * 100)}%). "
                "Flagged for mandatory manual secondary inspection."
            )
        else:
            outcome = "INCONCLUSIVE"
            explanation = (
                f"Similarity ({int(similarity * 100)}%) falls within borderline threshold zone. "
                "Secondary physical inspection recommended."
            )

        return {
            "document_face_detected": True,
            "live_face_detected": True,
            "similarity_score": similarity,
            "quality_score": avg_quality,
            "outcome": outcome,
            "explanation": explanation,
            "doc_portrait_url": doc_crop_url,
            "live_photo_url": live_crop_url,
            "uncertainty_disclaimer": (
                "Notice: Biometric facial comparison is a probabilistic supporting indicator, "
                "not absolute proof of identity. Human review and standard operating procedures govern."
            ),
        }


face_verifier = FaceVerificationEngine()
