"""Profile parameters for the photo retoucher.

All values are intentionally conservative. Each profile holds the *base*
adjustments; the strength multiplier in main.py scales them down further
for the "low" preset.
"""

from __future__ import annotations

INPUT_DIR = "input"
OUTPUT_DIR = "output"
STORY_DIR = "output/story"

SUPPORTED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")

JPEG_QUALITY = 95
STORY_ASPECT = (9, 16)

STRENGTH_SCALES = {
    "low": 0.6,
    "medium": 1.0,
}


# Each profile is a flat dict of named adjustments understood by editor.py.
# Values are deltas/multipliers around 0 or 1; keep them small.
PROFILES = {
    "default": {
        "exposure": 0.04,          # lift shadows of dark images only
        "highlight_recovery": 0.18,
        "shadow_lift": 0.10,
        "saturation": -0.04,        # tame oversaturation slightly
        "vibrance": 0.03,
        "clarity": 0.06,
        "warmth": 0.0,
        "tint": 0.0,
        "contrast": 0.02,
        "grain": 0.012,
        "white_balance_auto": True,
        "wb_strength": 0.35,
    },
    "sea": {
        "exposure": 0.03,
        "highlight_recovery": 0.22,
        "shadow_lift": 0.08,
        "saturation": -0.06,        # avoid green/teal cast
        "vibrance": 0.0,
        "clarity": 0.05,
        "warmth": 0.01,             # tiny warmth, never cool
        "tint": 0.0,
        "contrast": 0.02,
        "grain": 0.010,
        "white_balance_auto": False,  # do not push the ocean toward green
        "wb_strength": 0.0,
        "protect_blue": True,
    },
    "travel": {
        "exposure": 0.04,
        "highlight_recovery": 0.18,
        "shadow_lift": 0.08,
        "saturation": -0.02,
        "vibrance": 0.04,
        "clarity": 0.08,
        "warmth": 0.03,
        "tint": 0.0,
        "contrast": 0.04,
        "grain": 0.012,
        "white_balance_auto": True,
        "wb_strength": 0.30,
    },
    "people": {
        "exposure": 0.03,
        "highlight_recovery": 0.15,
        "shadow_lift": 0.12,
        "saturation": -0.03,
        "vibrance": 0.02,
        "clarity": 0.03,            # very subtle, do not crunch skin
        "warmth": 0.015,
        "tint": 0.0,
        "contrast": 0.02,
        "grain": 0.010,
        "white_balance_auto": True,
        "wb_strength": 0.25,
        "protect_skin": True,
    },
    "indoor": {
        "exposure": 0.05,
        "highlight_recovery": 0.10,
        "shadow_lift": 0.10,
        "saturation": -0.05,
        "vibrance": 0.02,
        "clarity": 0.05,
        "warmth": -0.01,            # neutralize tungsten cast slightly
        "tint": 0.0,
        "contrast": 0.03,
        "grain": 0.010,
        "white_balance_auto": True,
        "wb_strength": 0.55,        # stronger WB to fix mixed lighting
    },
}


def get_profile(name: str) -> dict:
    return PROFILES.get(name, PROFILES["default"]).copy()
