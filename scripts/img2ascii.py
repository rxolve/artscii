#!/usr/bin/env python3
"""Single image to ASCII art converter."""

import argparse
import sys
from io import BytesIO
from urllib.request import urlopen

from PIL import Image, ImageOps

# Brightness ramp: light → dark
ASCII_RAMP = " .:-=+*#%@"


def image_to_ascii(
    img: Image.Image,
    width: int = 64,
    height: int = 32,
    invert: bool = False,
    contrast: bool = True,
    gamma: float = 1.0,
) -> str:
    """Convert a PIL Image to ASCII art string."""
    # Handle transparent PNGs: composite onto white background
    if img.mode in ("RGBA", "LA", "PA"):
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        bg.paste(img, mask=img.split()[-1])  # use alpha channel as mask
        img = bg
    gray = img.convert("L")

    # Auto-contrast: stretch histogram to full 0-255 range
    if contrast:
        gray = ImageOps.autocontrast(gray)

    # Fit within width x height, preserving aspect ratio.
    # Terminal characters are ~2x taller than wide, so double the effective width for ratio calc.
    orig_w, orig_h = gray.size
    aspect = orig_h / orig_w
    new_w = width
    new_h = int(new_w * aspect * 0.5)  # 0.5 compensates for character aspect ratio

    if new_h > height:
        new_h = height
        new_w = int(new_h / aspect * 2)

    gray = gray.resize((new_w, new_h))

    pixels = list(gray.getdata())
    ramp_len = len(ASCII_RAMP) - 1
    lines = []
    for y in range(new_h):
        row = ""
        for x in range(new_w):
            brightness = pixels[y * new_w + x]  # 0=black, 255=white
            if invert:
                brightness = 255 - brightness
            # Non-linear gamma mapping: gamma > 1 brightens midtones (more whitespace),
            # gamma < 1 darkens midtones (denser characters)
            normalized = (brightness / 255.0) ** gamma
            idx = int(normalized * ramp_len)
            row += ASCII_RAMP[idx]
        lines.append(row.rstrip())

    # Remove trailing empty lines
    while lines and not lines[-1].strip():
        lines.pop()

    return "\n".join(lines)


def load_image(source: str) -> Image.Image:
    """Load image from file path or URL."""
    if source.startswith(("http://", "https://")):
        data = urlopen(source).read()
        return Image.open(BytesIO(data))
    return Image.open(source)


def main():
    parser = argparse.ArgumentParser(description="Convert an image to ASCII art")
    parser.add_argument("source", help="Image file path or URL")
    parser.add_argument("--width", type=int, default=64, help="Max width in characters (default: 64)")
    parser.add_argument("--height", type=int, default=32, help="Max height in lines (default: 32)")
    parser.add_argument("--invert", action="store_true", help="Invert brightness (for light background images)")
    parser.add_argument("--no-contrast", action="store_true", help="Disable auto-contrast enhancement")
    parser.add_argument("--gamma", type=float, default=1.0, help="Gamma correction (>1 brighter midtones, <1 darker)")
    args = parser.parse_args()

    try:
        img = load_image(args.source)
    except Exception as e:
        print(f"Error loading image: {e}", file=sys.stderr)
        sys.exit(1)

    print(image_to_ascii(
        img,
        width=args.width,
        height=args.height,
        invert=args.invert,
        contrast=not args.no_contrast,
        gamma=args.gamma,
    ))


if __name__ == "__main__":
    main()
