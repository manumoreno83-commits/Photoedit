"""Batch photo retoucher CLI.

Drop images into ./input and run:

    python src/main.py

Edited full-size copies appear in ./output. Story (9:16) versions appear in
./output/story when --story is enabled (default).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

# Allow running from project root or src/.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from editor import apply_profile
from cropper import story_crop


# ---------------------------------------------------------------------------
# Scene detection
# ---------------------------------------------------------------------------

def detect_profile(img_rgb: np.ndarray) -> str:
    """Pick a profile from cheap image statistics.

    Order of checks matters: people first, then sea, then indoor, then travel,
    then default.
    """
    h, w = img_rgb.shape[:2]
    # Downscale for speed.
    small = cv2.resize(img_rgb, (min(640, w), int(min(640, w) * h / w)))

    # 1. People: face detector.
    try:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        cascade = cv2.CascadeClassifier(cascade_path)
        if not cascade.empty():
            gray = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)
            faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(40, 40))
            if len(faces) >= 1:
                return "people"
    except Exception:
        pass

    hsv = cv2.cvtColor(small, cv2.COLOR_RGB2HSV)
    h_chan, s_chan, v_chan = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    blue_mask = (h_chan >= 95) & (h_chan <= 130) & (s_chan > 40)
    blue_ratio = float(blue_mask.mean())

    # 2. Sea/beach: a lot of blue (sky+ocean) plus a sand/skin band.
    sand_mask = (h_chan >= 10) & (h_chan <= 30) & (s_chan > 30) & (v_chan > 120)
    sand_ratio = float(sand_mask.mean())
    if blue_ratio > 0.30 and sand_ratio > 0.05:
        return "sea"
    if blue_ratio > 0.45:
        # Mostly sky/water -> still treat as sea.
        return "sea"

    # 3. Indoor: low overall brightness + warm color cast or low blue.
    mean_v = float(v_chan.mean()) / 255.0
    warm_mask = ((h_chan <= 25) | (h_chan >= 160)) & (s_chan > 30)
    warm_ratio = float(warm_mask.mean())
    if mean_v < 0.45 and blue_ratio < 0.15 and warm_ratio > 0.20:
        return "indoor"

    # 4. Travel/architecture: enough edges suggests buildings/structures.
    gray = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 80, 160)
    edge_density = float((edges > 0).mean())
    if edge_density > 0.08:
        return "travel"

    return "default"


# ---------------------------------------------------------------------------
# IO
# ---------------------------------------------------------------------------

def read_image(path: Path) -> np.ndarray:
    """Read an image as RGB uint8 with EXIF orientation honored."""
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB":
            im = im.convert("RGB")
        return np.array(im)


def write_image(path: Path, img_rgb: np.ndarray) -> None:
    Image.fromarray(img_rgb).save(path, format="JPEG", quality=config.JPEG_QUALITY,
                                  optimize=True, progressive=True)


def list_inputs(input_dir: Path) -> list[Path]:
    return sorted(
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in config.SUPPORTED_EXTENSIONS
    )


# ---------------------------------------------------------------------------
# Per-image work
# ---------------------------------------------------------------------------

def process_one(
    src: Path,
    out_dir: Path,
    story_dir: Path,
    profile_name: str,
    strength_scale: float,
    make_story: bool,
) -> dict:
    img = read_image(src)

    chosen = profile_name
    if profile_name == "auto":
        chosen = detect_profile(img)

    profile = config.get_profile(chosen)
    edited = apply_profile(img, profile, strength_scale=strength_scale)

    stem = src.stem
    edited_path = out_dir / f"{stem}_edited.jpg"
    write_image(edited_path, edited)

    story_path = None
    if make_story:
        cropped = story_crop(edited)
        story_path = story_dir / f"{stem}_story.jpg"
        write_image(story_path, cropped)

    return {
        "src": src.name,
        "profile": chosen,
        "edited": str(edited_path),
        "story": str(story_path) if story_path else None,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_bool(s: str) -> bool:
    return s.strip().lower() in ("1", "true", "yes", "y", "on")


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="photo-retoucher",
        description="Batch realistic photo retouching (Lightroom-style, no AI generation).",
    )
    p.add_argument("--story", default="true",
                   help="Generate 9:16 story versions: true/false (default true).")
    p.add_argument("--profile", default="auto",
                   choices=["auto", "sea", "travel", "people", "indoor", "default"],
                   help="Editing profile (default auto).")
    p.add_argument("--strength", default="low",
                   choices=["low", "medium"],
                   help="Adjustment strength (default low).")
    p.add_argument("--input", default=None,
                   help="Override input directory.")
    p.add_argument("--output", default=None,
                   help="Override output directory.")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)

    project_root = Path(__file__).resolve().parent.parent
    input_dir = Path(args.input) if args.input else project_root / config.INPUT_DIR
    output_dir = Path(args.output) if args.output else project_root / config.OUTPUT_DIR
    story_dir = output_dir / "story"

    output_dir.mkdir(parents=True, exist_ok=True)
    story_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"Input directory not found: {input_dir}", file=sys.stderr)
        return 2

    files = list_inputs(input_dir)
    if not files:
        print(f"No images found in {input_dir} (extensions: {', '.join(config.SUPPORTED_EXTENSIONS)})")
        return 0

    make_story = parse_bool(args.story)
    strength_scale = config.STRENGTH_SCALES[args.strength]

    print(f"Processing {len(files)} image(s) | profile={args.profile} | strength={args.strength} | story={make_story}")

    failures = 0
    for i, src in enumerate(files, 1):
        try:
            result = process_one(
                src=src,
                out_dir=output_dir,
                story_dir=story_dir,
                profile_name=args.profile,
                strength_scale=strength_scale,
                make_story=make_story,
            )
            tag = result["profile"]
            extra = f" + story" if result["story"] else ""
            print(f"  [{i}/{len(files)}] {result['src']} -> {Path(result['edited']).name} ({tag}){extra}")
        except Exception as e:  # keep the batch going on any single failure
            failures += 1
            print(f"  [{i}/{len(files)}] {src.name} FAILED: {e}", file=sys.stderr)

    if failures:
        print(f"Done with {failures} failure(s).")
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
