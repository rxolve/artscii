#!/usr/bin/env python3
"""Batch download public domain images and convert to ASCII art."""

import json
import os
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request

from img2ascii import image_to_ascii, load_image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARTS_DIR = PROJECT_ROOT / "arts"
IMAGES_DIR = Path(__file__).resolve().parent / "images"
INDEX_PATH = ARTS_DIR / "index.json"

# Wikimedia Commons silhouette/icon images (public domain / CC BY, SVG→PNG renders)
# Black silhouettes on transparent bg → composited to white, then invert for ASCII
# Each entry: (id, name, category, tags, filename, url, invert)
SOURCES = [
    # --- animals ---
    ("cat", "Cat", "animals", ["cat", "pet", "animal", "cute"], "cat.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/500px-Cat_silhouette.svg.png", True),
    ("bird", "Bird", "animals", ["bird", "animal", "fly"], "bird.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Blackbird_Turdus_merula_female_silhouette.svg/500px-Blackbird_Turdus_merula_female_silhouette.svg.png", True),
    ("fish", "Fish", "animals", ["fish", "animal", "sea", "ocean", "water"], "fish.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Fish_icon_%28The_Noun_Project_27052%29.svg/500px-Fish_icon_%28The_Noun_Project_27052%29.svg.png", True),
    # --- nature ---
    ("tree", "Tree", "nature", ["tree", "nature", "forest", "plant"], "tree.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Silhouette_of_a_Tree.svg/500px-Silhouette_of_a_Tree.svg.png", True),
    ("mountain", "Mountain", "nature", ["mountain", "nature", "landscape"], "mountain.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Mountains.svg/500px-Mountains.svg.png", True),
    ("sun", "Sun", "nature", ["sun", "nature", "sky", "weather"], "sun.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Font_Awesome_5_solid_sun.svg/500px-Font_Awesome_5_solid_sun.svg.png", True),
    # --- objects ---
    ("coffee", "Coffee", "objects", ["coffee", "cup", "drink", "mug"], "coffee.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Cup-o-coffee-simple.svg/500px-Cup-o-coffee-simple.svg.png", True),
    ("book", "Book", "objects", ["book", "read", "library"], "book.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Black_book_icon.svg/500px-Black_book_icon.svg.png", True),
    # --- symbols ---
    ("heart", "Heart", "symbols", ["heart", "love", "symbol"], "heart.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Heart_font_awesome.svg/500px-Heart_font_awesome.svg.png", True),
    ("star", "Star", "symbols", ["star", "symbol", "sky", "night"], "star.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Black_Star.svg/500px-Black_Star.svg.png", True),
    # --- emoji ---
    ("smiley", "Smiley", "emoji", ["smiley", "happy", "face", "emoji"], "smiley.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Font_Awesome_5_solid_smile.svg/500px-Font_Awesome_5_solid_smile.svg.png", True),
    ("skull", "Skull", "emoji", ["skull", "death", "danger", "emoji"], "skull.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Font_Awesome_5_solid_skull-crossbones.svg/500px-Font_Awesome_5_solid_skull-crossbones.svg.png", True),
    ("ghost", "Ghost", "emoji", ["ghost", "spooky", "halloween", "emoji"], "ghost.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Font_Awesome_5_solid_ghost.svg/500px-Font_Awesome_5_solid_ghost.svg.png", True),
    ("alien", "Alien", "emoji", ["alien", "space", "ufo", "emoji"], "alien.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Alien01.svg/500px-Alien01.svg.png", True),
    ("angry", "Angry", "emoji", ["angry", "mad", "face", "emoji"], "angry.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Font_Awesome_5_solid_angry.svg/500px-Font_Awesome_5_solid_angry.svg.png", True),
    ("thumbsup", "Thumbs Up", "emoji", ["thumbsup", "like", "good", "emoji"], "thumbsup.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Font_Awesome_5_solid_thumbs-up.svg/500px-Font_Awesome_5_solid_thumbs-up.svg.png", True),
    ("fire", "Fire", "emoji", ["fire", "flame", "hot", "emoji"], "fire.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Font_Awesome_5_solid_fire.svg/500px-Font_Awesome_5_solid_fire.svg.png", True),
    ("lightning", "Lightning", "emoji", ["lightning", "bolt", "thunder", "emoji"], "lightning.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Font_Awesome_5_solid_bolt.svg/500px-Font_Awesome_5_solid_bolt.svg.png", True),
    ("poop", "Poop", "emoji", ["poop", "poo", "funny", "emoji"], "poop.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Font_Awesome_5_solid_poop.svg/500px-Font_Awesome_5_solid_poop.svg.png", True),
    ("masks", "Theater Masks", "emoji", ["masks", "theater", "drama", "emoji"], "masks.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Font_Awesome_5_solid_theater-masks.svg/500px-Font_Awesome_5_solid_theater-masks.svg.png", True),
]


def download_image(url: str, dest: Path) -> Path:
    """Download an image from URL to dest path."""
    req = Request(url, headers={"User-Agent": "artscii-converter/1.0"})
    data = urlopen(req, timeout=30).read()
    dest.write_bytes(data)
    return dest


def measure_art(text: str) -> tuple[int, int]:
    """Measure width and height of ASCII art text."""
    lines = text.split("\n")
    height = len(lines)
    width = max((len(line) for line in lines), default=0)
    return width, height


def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Load existing index
    with open(INDEX_PATH) as f:
        index = json.load(f)

    index_map = {entry["id"]: entry for entry in index}
    # Track insertion order: existing IDs first, then new ones appended
    ordered_ids = [entry["id"] for entry in index]

    for i, (art_id, name, category, tags, filename, url, invert) in enumerate(SOURCES):
        # Skip download if image already exists (use --force to re-download)
        img_path = IMAGES_DIR / f"{art_id}.png"
        if not img_path.exists() or "--force" in sys.argv:
            if i > 0:
                time.sleep(2)  # rate limit courtesy
            print(f"[{art_id}] Downloading...", end=" ", flush=True)
            try:
                download_image(url, img_path)
            except Exception as e:
                print(f"FAILED to download: {e}")
                continue
        else:
            print(f"[{art_id}] Cached...", end=" ", flush=True)

        print("Converting...", end=" ", flush=True)

        try:
            img = load_image(str(img_path))

            # 64w version (default)
            art_64 = image_to_ascii(img, width=64, height=32, invert=invert)
            # 32w version (compact)
            art_32 = image_to_ascii(img, width=32, height=16, invert=invert)
        except Exception as e:
            print(f"FAILED to convert: {e}")
            continue

        # Write ASCII art files
        out_dir = ARTS_DIR / category
        out_dir.mkdir(parents=True, exist_ok=True)

        stem = filename.removesuffix(".txt")
        out_path_64 = out_dir / filename
        out_path_32 = out_dir / f"{stem}.32w.txt"
        out_path_64.write_text(art_64 + "\n")
        out_path_32.write_text(art_32 + "\n")

        # Measure dimensions
        w64, h64 = measure_art(art_64)
        w32, h32 = measure_art(art_32)

        # Update or create index entry
        if art_id in index_map:
            entry = index_map[art_id]
        else:
            entry = {"id": art_id, "name": name, "category": category, "tags": tags,
                     "file": f"{category}/{filename}"}
            index_map[art_id] = entry
            ordered_ids.append(art_id)

        entry["name"] = name
        entry["tags"] = tags
        entry["width"] = w64
        entry["height"] = h64
        entry["file32"] = f"{category}/{stem}.32w.txt"
        entry["width32"] = w32
        entry["height32"] = h32

        print(f"OK (64w: {w64}x{h64}, 32w: {w32}x{h32})")

    # Write updated index preserving order
    updated_index = [index_map[aid] for aid in ordered_ids if aid in index_map]
    with open(INDEX_PATH, "w") as f:
        json.dump(updated_index, f, indent=2)
        f.write("\n")

    print(f"\nDone! {len(SOURCES)} arts processed. Index updated.")


if __name__ == "__main__":
    main()
