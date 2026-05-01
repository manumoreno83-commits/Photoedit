# photo-retoucher

A small batch tool that applies subtle, Lightroom-style corrections to your
photos. It is a real pixel-editing pipeline built on Pillow, OpenCV, and
NumPy. It does **not** use generative AI: nothing in the image is invented,
redrawn, smoothed, or replaced.

## What it does

- Reads every photo from `input/` and writes a retouched copy to `output/`.
- Optionally writes a centered 9:16 crop for Instagram Stories to
  `output/story/`.
- Picks an editing profile automatically based on cheap image statistics, or
  you can force one from the CLI.
- Applies conservative tone, color, and local-contrast adjustments:
  - Lift exposure only when the photo is genuinely dark.
  - Recover bright highlights without crushing them.
  - Open shadows slightly.
  - Tame oversaturation, then add a touch of vibrance.
  - Very subtle clarity (mid-tone local contrast on luminance only).
  - Very subtle film grain.
  - Gentle white balance correction, blended with the original cast.

## What it does NOT do

- It does not use any image-generation model.
- It does not modify, smooth, or restructure faces, bodies, or skin.
- It does not redraw buildings, water, or sky.
- It does not apply heavy cinematic color grading.
- It does not push the ocean toward green/teal — the `sea` profile actively
  protects blue hues and skips auto white balance.
- It does not stretch or distort the image when cropping for Stories.

## Project layout

```
photo-retoucher/
  input/              <- drop your photos here
  output/             <- full-size retouched JPEGs
  output/story/       <- optional 9:16 crops
  src/
    main.py           <- CLI entry point
    editor.py         <- pixel-level retouch operations
    cropper.py        <- non-distorting 9:16 crop
    config.py         <- profile parameters
  requirements.txt
  README.md
```

## Install

Python 3.9+ is recommended.

```bash
cd photo-retoucher
python -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## How to run

1. Drop one or more photos into `photo-retoucher/input/`.
   Supported formats: `.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.webp`.
2. From the project root, run:

```bash
python src/main.py
```

3. You will get:
   - `output/<name>_edited.jpg` — full-size retouched image.
   - `output/story/<name>_story.jpg` — 9:16 Story crop (when enabled).

## CLI options

```
python src/main.py [--story true|false] [--profile auto|sea|travel|people|indoor|default] [--strength low|medium]
```

Defaults: `--story true --profile auto --strength low`.

Examples:

```bash
# Default behavior: auto-detect profile, generate stories, low strength.
python src/main.py

# Force the sea profile and skip story crops.
python src/main.py --profile sea --story false

# A bit stronger correction (still conservative).
python src/main.py --strength medium
```

## Profiles

- **auto** — pick one of the below from a quick analysis of the photo.
- **sea** — beach / ocean scenes. Preserves the original ocean color, no
  green/teal cast, minimal saturation movement.
- **travel** — architecture, streets. Preserves geometry, slight warmth,
  balanced contrast, clean highlights, no distortion.
- **people** — protects skin tones, no skin smoothing, gentle shadow lift,
  natural contrast.
- **indoor** — corrects mixed lighting slightly, neutralizes color cast,
  keeps realistic shadows.
- **default** — gentle global corrections only.

## How to change strength

`--strength low` (the default) multiplies every adjustment by `0.6`. Use
`--strength medium` for a slightly more pronounced look (still subtle). If
you want to fine-tune further, edit the values in `src/config.py` — every
adjustment is named, in plain numbers, and applied as written.

## Notes on realism

- All operations are deterministic pixel transforms (curves, channel
  scaling, LAB/HSV mixing, unsharp mask on luminance, additive grain).
- White balance corrections are bounded (per-channel gain capped between
  0.85 and 1.15) and blended with the original to avoid a clinical look.
- The `sea` profile sets `white_balance_auto: false` and `protect_blue: true`
  precisely to avoid the common green/teal shift.
- The `people` profile sets `protect_skin: true` to leave skin hues alone.
- Story crops are always sub-rectangles of the source — never upscaled,
  never stretched. When a face is detected the crop shifts so the face stays
  inside, biased toward the upper third for a portrait feel.
