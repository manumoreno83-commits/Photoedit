"""9:16 Story crop without distortion.

Strategy:
- Compute the largest 9:16 rectangle that fits the image dimensions.
- Center it horizontally by default.
- If a face is detected (Haar cascade shipped with OpenCV), shift the crop
  vertically/horizontally so the face stays comfortably inside the frame.
- Never resize beyond the source resolution and never stretch.
"""

from __future__ import annotations

from typing import Optional, Tuple

import cv2
import numpy as np

from config import STORY_ASPECT


def _detect_main_face(img_rgb: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    """Return (x, y, w, h) of the largest detected face, or None."""
    try:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(cascade_path)
        if cascade.empty():
            return None
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(60, 60))
        if len(faces) == 0:
            return None
        # Largest face wins.
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        x, y, w, h = faces[0]
        return int(x), int(y), int(w), int(h)
    except Exception:
        return None


def story_crop(img_rgb: np.ndarray) -> np.ndarray:
    """Return a 9:16 crop of the input. No upscaling, no distortion."""
    h, w = img_rgb.shape[:2]
    aw, ah = STORY_ASPECT  # 9, 16

    # Largest 9:16 rectangle that fits.
    if w * ah <= h * aw:
        # Image is narrower than 9:16 -> use full width, crop height.
        crop_w = w
        crop_h = int(round(w * ah / aw))
    else:
        # Image is wider than 9:16 -> use full height, crop width.
        crop_h = h
        crop_w = int(round(h * aw / ah))

    crop_w = min(crop_w, w)
    crop_h = min(crop_h, h)

    # Default: centered crop.
    x0 = (w - crop_w) // 2
    y0 = (h - crop_h) // 2

    face = _detect_main_face(img_rgb)
    if face is not None:
        fx, fy, fw, fh = face
        fcx = fx + fw // 2
        fcy = fy + fh // 2

        # Adjust horizontally so face center sits inside the crop with margin.
        margin_x = max(fw, crop_w // 6)
        if crop_w < w:
            x0 = fcx - crop_w // 2
            x0 = max(0, min(x0, w - crop_w))
            # Make sure the whole face stays inside.
            if fx < x0 + margin_x // 2:
                x0 = max(0, fx - margin_x // 2)
            if fx + fw > x0 + crop_w - margin_x // 2:
                x0 = min(w - crop_w, fx + fw + margin_x // 2 - crop_w)

        # Adjust vertically: bias toward keeping the face in the upper third
        # (rule of thirds for portraits) but always inside.
        if crop_h < h:
            target_face_y = crop_h // 3
            y0 = fcy - target_face_y
            y0 = max(0, min(y0, h - crop_h))
            if fy < y0:
                y0 = max(0, fy - 20)
            if fy + fh > y0 + crop_h:
                y0 = min(h - crop_h, fy + fh + 20 - crop_h)

    return img_rgb[y0:y0 + crop_h, x0:x0 + crop_w].copy()
