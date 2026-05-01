"""Pixel-level retouching operations.

This module operates on numpy arrays in float32 [0, 1] RGB. Every operation
is a real pixel transform (curves, channel scaling, color-space mixing).
There is no generative model, no face reconstruction, no inpainting.
"""

from __future__ import annotations

import numpy as np
import cv2


# ---------------------------------------------------------------------------
# IO helpers
# ---------------------------------------------------------------------------

def to_float(img_uint8: np.ndarray) -> np.ndarray:
    return img_uint8.astype(np.float32) / 255.0


def to_uint8(img_float: np.ndarray) -> np.ndarray:
    return np.clip(img_float * 255.0, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# Tone operations
# ---------------------------------------------------------------------------

def auto_exposure(img: np.ndarray, lift: float) -> np.ndarray:
    """Lift exposure only when the image is genuinely dark.

    Looks at the luminance mean. If the image is already well exposed, this is
    a no-op so we don't blow out bright photos.
    """
    if lift <= 0:
        return img
    luma = 0.2126 * img[..., 0] + 0.7152 * img[..., 1] + 0.0722 * img[..., 2]
    mean = float(luma.mean())
    # 0.45 is a comfortable middle. Below that we apply a fraction of `lift`.
    if mean >= 0.45:
        return img
    deficit = (0.45 - mean) / 0.45  # 0..1
    gain = 1.0 + lift * deficit
    return np.clip(img * gain, 0, 1)


def highlight_recovery(img: np.ndarray, amount: float) -> np.ndarray:
    """Compress brightest tones by mapping values >0.7 toward 1.0 along a curve."""
    if amount <= 0:
        return img
    # Build a smooth tone curve: identity below 0.6, gently compressed above.
    x = np.linspace(0, 1, 256, dtype=np.float32)
    knee = 0.6
    above = np.clip((x - knee) / (1 - knee), 0, 1)
    # Compress the over-knee portion: y = knee + (1-knee) * (1 - (1-above)^p)
    p = 1.0 + 2.5 * amount
    compressed = knee + (1 - knee) * (1 - (1 - above) ** p)
    curve = np.where(x < knee, x, compressed)
    return _apply_curve_per_channel(img, curve)


def shadow_lift(img: np.ndarray, amount: float) -> np.ndarray:
    """Open shadows on the lower portion of the tone curve."""
    if amount <= 0:
        return img
    x = np.linspace(0, 1, 256, dtype=np.float32)
    # Lift values mostly below 0.4. Use a falloff that is 0 at x=0.5.
    falloff = np.clip(1 - x / 0.5, 0, 1)
    lifted = x + amount * falloff * (0.35 - x).clip(min=0)
    curve = np.clip(lifted, 0, 1)
    return _apply_curve_per_channel(img, curve)


def contrast(img: np.ndarray, amount: float) -> np.ndarray:
    if amount == 0:
        return img
    # S-curve around 0.5
    x = np.linspace(0, 1, 256, dtype=np.float32)
    curve = 0.5 + (x - 0.5) * (1.0 + amount)
    curve = np.clip(curve, 0, 1)
    return _apply_curve_per_channel(img, curve)


def _apply_curve_per_channel(img: np.ndarray, curve: np.ndarray) -> np.ndarray:
    idx = np.clip((img * 255).astype(np.int32), 0, 255)
    return curve[idx]


# ---------------------------------------------------------------------------
# Color operations
# ---------------------------------------------------------------------------

def saturation_vibrance(
    img: np.ndarray,
    saturation: float,
    vibrance: float,
    protect_skin: bool = False,
    protect_blue: bool = False,
) -> np.ndarray:
    """Adjust saturation globally, then apply vibrance to less-saturated pixels.

    Vibrance pulls weakly-saturated pixels up without crushing already-vivid ones.
    Optional masks keep skin and ocean blue untouched.
    """
    hsv = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h = hsv[..., 0]   # 0..179
    s = hsv[..., 1] / 255.0
    v = hsv[..., 2] / 255.0

    weight = np.ones_like(s)
    if protect_skin:
        # Skin hue band ~0..25 and ~160..179 in OpenCV HSV.
        skin = ((h <= 25) | (h >= 160)) & (s > 0.1) & (s < 0.7) & (v > 0.25)
        weight = np.where(skin, weight * 0.2, weight)
    if protect_blue:
        # Ocean/sky band ~95..130. We don't want to *desaturate* it but we
        # really don't want a hue push toward green either.
        blue = (h >= 95) & (h <= 130)
        weight = np.where(blue, weight * 0.3, weight)

    if saturation != 0:
        s = s + saturation * weight * s  # multiplicative-ish

    if vibrance != 0:
        # Stronger effect where current saturation is low.
        boost = vibrance * (1 - s) * weight
        s = s + boost

    s = np.clip(s, 0, 1)

    hsv[..., 1] = s * 255.0
    hsv[..., 2] = np.clip(v, 0, 1) * 255.0
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255.0
    return out


def warmth_tint(img: np.ndarray, warmth: float, tint: float) -> np.ndarray:
    """Shift along blue<->yellow (warmth) and green<->magenta (tint) in LAB."""
    if warmth == 0 and tint == 0:
        return img
    lab = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    # a: green(-) <-> magenta(+), b: blue(-) <-> yellow(+)
    lab[..., 2] = np.clip(lab[..., 2] + warmth * 12.0, 0, 255)
    lab[..., 1] = np.clip(lab[..., 1] + tint * 12.0, 0, 255)
    out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32) / 255.0
    return out


def gentle_white_balance(img: np.ndarray, strength: float, protect_blue: bool = False) -> np.ndarray:
    """Gray-world white balance, blended with the original by `strength`.

    Strength is 0..1. Even at 1.0 we keep some of the original cast to avoid
    a clinical look.
    """
    if strength <= 0:
        return img

    # Compute per-channel means on a luminance-weighted, mid-tone subset to
    # avoid being dragged by extreme highlights/shadows.
    luma = 0.2126 * img[..., 0] + 0.7152 * img[..., 1] + 0.0722 * img[..., 2]
    mid_mask = (luma > 0.2) & (luma < 0.85)
    if mid_mask.sum() < 1000:
        mid_mask = np.ones_like(luma, dtype=bool)

    means = np.array([img[..., c][mid_mask].mean() for c in range(3)], dtype=np.float32)
    target = means.mean()
    means = np.where(means < 1e-4, 1e-4, means)
    gains = target / means
    # Bound the gains so we never make a wild correction.
    gains = np.clip(gains, 0.85, 1.15)

    if protect_blue:
        # Pull blue gain toward 1.0 to avoid shifting the ocean.
        gains[2] = 1.0 + (gains[2] - 1.0) * 0.3

    corrected = img * gains
    out = img * (1 - strength) + corrected * strength
    return np.clip(out, 0, 1)


# ---------------------------------------------------------------------------
# Local detail
# ---------------------------------------------------------------------------

def clarity(img: np.ndarray, amount: float) -> np.ndarray:
    """Mid-tone local-contrast boost on the L channel, with a midtone weight.

    This is unsharp mask on luminance only, so colors don't shift.
    """
    if amount <= 0:
        return img
    lab = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0] / 255.0
    blurred = cv2.GaussianBlur(L, (0, 0), sigmaX=20, sigmaY=20)
    detail = L - blurred
    # Weight: strongest in midtones, fades at extremes.
    midweight = 1.0 - np.abs(L - 0.5) * 2.0
    midweight = np.clip(midweight, 0, 1)
    L_new = np.clip(L + detail * amount * 2.5 * midweight, 0, 1)
    lab[..., 0] = L_new * 255.0
    out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32) / 255.0
    return out


def film_grain(img: np.ndarray, amount: float, seed: int = 42) -> np.ndarray:
    """Subtle, luminance-weighted monochrome grain."""
    if amount <= 0:
        return img
    rng = np.random.default_rng(seed)
    h, w = img.shape[:2]
    noise = rng.standard_normal((h, w), dtype=np.float32) * amount
    luma = 0.2126 * img[..., 0] + 0.7152 * img[..., 1] + 0.0722 * img[..., 2]
    # Slightly less grain in pure highlights/shadows so it looks like real film.
    weight = 1.0 - np.abs(luma - 0.5) * 1.2
    weight = np.clip(weight, 0.4, 1.0)
    noise = noise * weight
    out = img + noise[..., None]
    return np.clip(out, 0, 1)


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def apply_profile(img_uint8: np.ndarray, profile: dict, strength_scale: float = 1.0) -> np.ndarray:
    """Run the full retouch pipeline on a uint8 RGB image.

    Returns a uint8 RGB image.
    """
    p = {k: (v * strength_scale if isinstance(v, (int, float)) and not isinstance(v, bool) else v)
         for k, v in profile.items()}

    img = to_float(img_uint8)

    # 1. White balance first so subsequent color ops act on a corrected base.
    if p.get("white_balance_auto"):
        img = gentle_white_balance(
            img,
            strength=p.get("wb_strength", 0.0),
            protect_blue=p.get("protect_blue", False),
        )

    # 2. Tone: exposure -> highlights -> shadows -> contrast.
    img = auto_exposure(img, p.get("exposure", 0.0))
    img = highlight_recovery(img, p.get("highlight_recovery", 0.0))
    img = shadow_lift(img, p.get("shadow_lift", 0.0))
    img = contrast(img, p.get("contrast", 0.0))

    # 3. Color grading (very small amounts).
    img = warmth_tint(img, p.get("warmth", 0.0), p.get("tint", 0.0))
    img = saturation_vibrance(
        img,
        saturation=p.get("saturation", 0.0),
        vibrance=p.get("vibrance", 0.0),
        protect_skin=p.get("protect_skin", False),
        protect_blue=p.get("protect_blue", False),
    )

    # 4. Detail and grain last.
    img = clarity(img, p.get("clarity", 0.0))
    img = film_grain(img, p.get("grain", 0.0))

    return to_uint8(img)
