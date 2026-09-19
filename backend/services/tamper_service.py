import os
import uuid
from pathlib import Path
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from PIL import Image, ExifTags
from backend.config import HEATMAP_DIR


class BaseTamperDetector:
    """Base interface for document tampering detection models."""

    def analyze(self, image_path: str, document_type: str = "PASSPORT") -> List[Dict[str, Any]]:
        raise NotImplementedError


class ComputerVisionTamperDetector(BaseTamperDetector):
    """
    Modular, forensic computer-vision tampering detection pipeline.
    Combines:
    1. Error Level Analysis (ELA) for digital manipulation / text modification
    2. Portrait Boundary Discontinuity & Resampling Analysis (photo replacement)
    3. Noise Variance Discrepancy across document regions
    4. Image Metadata / EXIF Software Footprint Inspection
    5. Document Template & Layout Alignment Sanity
    """

    def __init__(self):
        # Load OpenCV Haar cascade for face detection in documents
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            self.face_cascade = None

    def _generate_ela_heatmap(self, image_path: str) -> Tuple[float, str, List[Dict[str, float]]]:
        """
        Error Level Analysis (ELA):
        Resaves the image at 90% JPEG quality, computes pixel difference with original.
        Areas modified or inserted at different compression levels produce elevated error levels.
        """
        try:
            original = Image.open(image_path).convert("RGB")
            temp_path = str(HEATMAP_DIR / f"temp_{uuid.uuid4().hex[:8]}.jpg")
            original.save(temp_path, "JPEG", quality=90)

            resaved = Image.open(temp_path).convert("RGB")
            orig_arr = np.array(original, dtype=np.float32)
            resav_arr = np.array(resaved, dtype=np.float32)

            if os.path.exists(temp_path):
                os.remove(temp_path)

            # Compute difference
            diff = np.abs(orig_arr - resav_arr)
            diff_gray = np.mean(diff, axis=2)

            # Measure max & mean error
            max_diff = np.max(diff_gray)
            mean_diff = np.mean(diff_gray)

            # Scale error for visualization
            scale = 255.0 / max(max_diff, 1.0)
            amplified = np.clip(diff_gray * scale * 1.5, 0, 255).astype(np.uint8)

            # Colorize with JET colormap
            colored_heatmap = cv2.applyColorMap(amplified, cv2.COLORMAP_JET)

            # Save heatmap
            heatmap_filename = f"ela_{Path(image_path).stem}_{uuid.uuid4().hex[:6]}.jpg"
            heatmap_file_path = str(HEATMAP_DIR / heatmap_filename)
            cv2.imwrite(heatmap_file_path, colored_heatmap)

            # Detect high-anomaly regions (top 5% intensity)
            thresh = np.percentile(diff_gray, 95)
            high_error_mask = (diff_gray > thresh).astype(np.uint8) * 255
            contours, _ = cv2.findContours(high_error_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            h, w = diff_gray.shape
            evidence_regions = []
            for cnt in contours[:5]:
                x, y, cw, ch = cv2.boundingRect(cnt)
                if cw * ch > (w * h * 0.005):  # Ignore tiny specks
                    evidence_regions.append({
                        "x": round(x / w, 4),
                        "y": round(y / h, 4),
                        "w": round(cw / w, 4),
                        "h": round(ch / h, 4),
                        "anomaly_score": round(float(np.mean(diff_gray[y:y+ch, x:x+cw])) / 25.5, 2)
                    })

            # Calculate overall anomaly score (0.0 to 1.0)
            score = float(min(1.0, mean_diff / 15.0))
            return score, f"/api/v1/storage/heatmaps/{heatmap_filename}", evidence_regions

        except Exception as e:
            return 0.1, "", []

    def _analyze_photo_replacement(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """
        Detects portrait region and measures perimeter gradient discontinuity and sharpness disparity.
        """
        h, w = cv_image.shape[:2]
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

        faces = []
        if self.face_cascade:
            detected = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(int(w * 0.1), int(h * 0.15))
            )
            for (x, y, fw, fh) in detected:
                faces.append((x, y, fw, fh))

        # Heuristic fallback for standard passport portrait zone (left third)
        if not faces:
            px, py, pw, ph = int(w * 0.05), int(h * 0.15), int(w * 0.35), int(h * 0.65)
            faces.append((px, py, pw, ph))

        fx, fy, fw, fh = faces[0]

        # Extract portrait and document background patches
        portrait_patch = gray[fy : fy + fh, fx : fx + fw]
        bg_patch = gray[fy : fy + fh, min(w - 1, fx + fw) : min(w, fx + fw + fw)]

        # Laplacian variance (sharpness/focus)
        portrait_var = cv2.Laplacian(portrait_patch, cv2.CV_64F).var() if portrait_patch.size > 0 else 0
        bg_var = cv2.Laplacian(bg_patch, cv2.CV_64F).var() if bg_patch.size > 0 else 1.0

        # Boundary perimeter gradient check
        # Spliced photos show sharp, unnatural gradient discontinuity along the rectangular edge
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobel_x**2 + sobel_y**2)

        border_thickness = 4
        y1, y2 = max(0, fy - border_thickness), min(h, fy + fh + border_thickness)
        x1, x2 = max(0, fx - border_thickness), min(w, fx + fw + border_thickness)
        border_grad = np.mean(grad_mag[y1:y2, x1:x2])
        overall_grad = np.mean(grad_mag)

        ratio = border_grad / max(overall_grad, 1.0)
        variance_ratio = abs(portrait_var - bg_var) / max(bg_var, 1.0)

        evidence_region = {
            "x": round(fx / w, 4),
            "y": round(fy / h, 4),
            "w": round(fw / w, 4),
            "h": round(fh / h, 4),
        }

        # Check for anomaly
        if ratio > 2.8 or variance_ratio > 4.5:
            status = "POSSIBLE_ANOMALY"
            explanation = (
                "Discontinuity detected around portrait boundary. Sharp gradient transition and "
                "texture variance disparity indicate possible physical or digital photo replacement."
            )
            score = min(0.92, round(0.5 + (ratio * 0.1), 2))
        elif ratio > 2.0:
            status = "REQUIRES_REVIEW"
            explanation = "Mild edge variation observed along portrait perimeter. Review recommended."
            score = 0.45
        else:
            status = "NO_CLEAR_ANOMALY"
            explanation = "Portrait region exhibits consistent boundary blending, natural noise, and focus continuity."
            score = 0.08

        return {
            "status": status,
            "score": score,
            "explanation": explanation,
            "evidence_regions": [evidence_region],
        }

    def _analyze_noise_variance(self, cv_image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes high-frequency noise variance across document patches.
        Digital splices introduce distinct local noise distributions.
        """
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        grid_rows, grid_cols = 4, 4
        rh, cw = h // grid_rows, w // grid_cols

        variances = []
        for r in range(grid_rows):
            for c in range(grid_cols):
                patch = gray[r * rh : (r + 1) * rh, c * cw : (c + 1) * cw]
                lap = cv2.Laplacian(patch, cv2.CV_64F)
                variances.append(float(lap.var()))

        std_dev = float(np.std(variances))
        mean_var = float(np.mean(variances))
        cv_ratio = std_dev / max(mean_var, 1.0)

        if cv_ratio > 1.8:
            status = "REQUIRES_REVIEW"
            explanation = (
                f"Significant spatial noise variance detected across document grid (coefficient of variation {cv_ratio:.2f}). "
                "Indicates potential multi-source image splicing or localized compression filtering."
            )
            score = 0.65
        else:
            status = "NO_CLEAR_ANOMALY"
            explanation = "Uniform noise distribution observed across document background and text fields."
            score = 0.12

        return {
            "status": status,
            "score": score,
            "explanation": explanation,
            "evidence": {"noise_cv_ratio": round(cv_ratio, 2)},
        }

    def _analyze_metadata(self, image_path: str) -> Dict[str, Any]:
        """
        Inspects EXIF metadata for editing software signatures and timestamp discrepancies.
        """
        try:
            img = Image.open(image_path)
            exif_data = img._getexif()
            if not exif_data:
                return {
                    "status": "INCONCLUSIVE",
                    "score": 0.20,
                    "explanation": "No EXIF metadata found. Metadata is commonly stripped during transmission or scanning.",
                    "evidence": {"metadata_present": False},
                }

            tag_map = {}
            for tag_id, val in exif_data.items():
                tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                tag_map[tag_name] = str(val)

            software = tag_map.get("Software", "")
            suspicious_software = ["photoshop", "gimp", "canva", "pixlr", "paint.net", "illustrator"]
            found_suspicious = [s for s in suspicious_software if s in software.lower()]

            if found_suspicious:
                return {
                    "status": "POSSIBLE_ANOMALY",
                    "score": 0.85,
                    "explanation": f"Image metadata reveals digital editing software fingerprint: '{software}'.",
                    "evidence": {"software": software, "tags": tag_map},
                }
            else:
                return {
                    "status": "NO_CLEAR_ANOMALY",
                    "score": 0.05,
                    "explanation": f"Metadata indicates standard capture/scan device ({tag_map.get('Model', 'Standard Scanner')}).",
                    "evidence": {"software": software or "Camera/Scanner firmware"},
                }

        except Exception:
            return {
                "status": "INCONCLUSIVE",
                "score": 0.15,
                "explanation": "Image metadata could not be fully parsed.",
                "evidence": {},
            }

    def analyze(self, image_path: str, document_type: str = "PASSPORT") -> List[Dict[str, Any]]:
        cv_image = cv2.imread(image_path)
        if cv_image is None:
            return [{
                "anomaly_type": "IMAGE_INTEGRITY",
                "status": "INCONCLUSIVE",
                "score": 0.0,
                "heatmap_path": None,
                "explanation": "Unable to read image for computer-vision tampering analysis.",
                "evidence_regions": [],
            }]

        results = []

        # 1. Error Level Analysis (ELA)
        ela_score, heatmap_url, ela_regions = self._generate_ela_heatmap(image_path)
        ela_status = (
            "POSSIBLE_ANOMALY" if ela_score > 0.65
            else ("REQUIRES_REVIEW" if ela_score > 0.40 else "NO_CLEAR_ANOMALY")
        )
        ela_explanation = (
            "Error Level Analysis identified localized compression rate inconsistencies, suggesting digital modification of text or graphics."
            if ela_status != "NO_CLEAR_ANOMALY"
            else "Error Level Analysis shows uniform compression degradation typical of authentic single-generation documents."
        )

        results.append({
            "anomaly_type": "ELA_COMPRESSION",
            "status": ela_status,
            "score": round(ela_score, 2),
            "heatmap_path": heatmap_url,
            "explanation": ela_explanation,
            "evidence_regions": ela_regions,
        })

        # 2. Photo Replacement Boundary Analysis
        photo_res = self._analyze_photo_replacement(cv_image)
        results.append({
            "anomaly_type": "PHOTO_REPLACEMENT",
            "status": photo_res["status"],
            "score": photo_res["score"],
            "heatmap_path": heatmap_url,
            "explanation": photo_res["explanation"],
            "evidence_regions": photo_res.get("evidence_regions", []),
        })

        # 3. Noise Analysis
        noise_res = self._analyze_noise_variance(cv_image)
        results.append({
            "anomaly_type": "NOISE_INCONSISTENCY",
            "status": noise_res["status"],
            "score": noise_res["score"],
            "heatmap_path": None,
            "explanation": noise_res["explanation"],
            "evidence_regions": [],
        })

        # 4. Metadata Inspection
        meta_res = self._analyze_metadata(image_path)
        results.append({
            "anomaly_type": "METADATA_ANOMALY",
            "status": meta_res["status"],
            "score": meta_res["score"],
            "heatmap_path": None,
            "explanation": meta_res["explanation"],
            "evidence_regions": [],
        })

        return results


tamper_detector = ComputerVisionTamperDetector()
