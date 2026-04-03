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
    # --- animals (new) ---
    ("dog", "Dog", "animals", ["dog", "pet", "animal"], "dog.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Font_Awesome_5_solid_dog.svg/500px-Font_Awesome_5_solid_dog.svg.png", True),
    ("horse", "Horse", "animals", ["horse", "animal", "ride"], "horse.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Font_Awesome_5_solid_horse.svg/500px-Font_Awesome_5_solid_horse.svg.png", True),
    ("spider", "Spider", "animals", ["spider", "insect", "web"], "spider.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Font_Awesome_5_solid_spider.svg/500px-Font_Awesome_5_solid_spider.svg.png", True),
    ("dove", "Dove", "animals", ["dove", "bird", "peace"], "dove.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Font_Awesome_5_solid_dove.svg/500px-Font_Awesome_5_solid_dove.svg.png", True),
    ("dragon", "Dragon", "animals", ["dragon", "fantasy", "myth"], "dragon.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Font_Awesome_5_solid_dragon.svg/500px-Font_Awesome_5_solid_dragon.svg.png", True),
    ("frog", "Frog", "animals", ["frog", "animal", "amphibian"], "frog.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Font_Awesome_5_solid_frog.svg/500px-Font_Awesome_5_solid_frog.svg.png", True),
    ("hippo", "Hippo", "animals", ["hippo", "animal", "safari"], "hippo.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Font_Awesome_5_solid_hippo.svg/500px-Font_Awesome_5_solid_hippo.svg.png", True),
    ("crow", "Crow", "animals", ["crow", "bird", "raven"], "crow.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Font_Awesome_5_solid_crow.svg/500px-Font_Awesome_5_solid_crow.svg.png", True),
    ("kiwi-bird", "Kiwi Bird", "animals", ["kiwi", "bird", "animal"], "kiwi-bird.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Font_Awesome_5_solid_kiwi-bird.svg/500px-Font_Awesome_5_solid_kiwi-bird.svg.png", True),
    ("otter", "Otter", "animals", ["otter", "animal", "water"], "otter.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Font_Awesome_5_solid_otter.svg/500px-Font_Awesome_5_solid_otter.svg.png", True),
    # --- nature (new) ---
    ("moon", "Moon", "nature", ["moon", "night", "sky"], "moon.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Font_Awesome_5_solid_moon.svg/500px-Font_Awesome_5_solid_moon.svg.png", True),
    ("cloud", "Cloud", "nature", ["cloud", "sky", "weather"], "cloud.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Font_Awesome_5_solid_cloud.svg/500px-Font_Awesome_5_solid_cloud.svg.png", True),
    ("snowflake", "Snowflake", "nature", ["snowflake", "winter", "cold"], "snowflake.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Font_Awesome_5_solid_snowflake.svg/500px-Font_Awesome_5_solid_snowflake.svg.png", True),
    ("seedling", "Seedling", "nature", ["seedling", "plant", "grow"], "seedling.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Font_Awesome_5_solid_seedling.svg/500px-Font_Awesome_5_solid_seedling.svg.png", True),
    ("leaf", "Leaf", "nature", ["leaf", "plant", "autumn"], "leaf.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Font_Awesome_5_solid_leaf.svg/500px-Font_Awesome_5_solid_leaf.svg.png", True),
    ("water", "Water Drop", "nature", ["water", "drop", "rain"], "water.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Font_Awesome_5_solid_tint.svg/500px-Font_Awesome_5_solid_tint.svg.png", True),
    # --- food & drink (new) ---
    ("utensils", "Utensils", "food", ["utensils", "food", "eat", "dining"], "utensils.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Font_Awesome_5_solid_utensils.svg/500px-Font_Awesome_5_solid_utensils.svg.png", True),
    ("apple", "Apple", "food", ["apple", "fruit", "food"], "apple.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Font_Awesome_5_solid_apple-alt.svg/500px-Font_Awesome_5_solid_apple-alt.svg.png", True),
    ("beer", "Beer", "food", ["beer", "drink", "alcohol"], "beer.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Font_Awesome_5_solid_beer.svg/500px-Font_Awesome_5_solid_beer.svg.png", True),
    ("wine", "Wine Glass", "food", ["wine", "drink", "glass"], "wine.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Font_Awesome_5_solid_wine-glass.svg/500px-Font_Awesome_5_solid_wine-glass.svg.png", True),
    ("cake", "Birthday Cake", "food", ["cake", "birthday", "party"], "cake.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Font_Awesome_5_solid_birthday-cake.svg/500px-Font_Awesome_5_solid_birthday-cake.svg.png", True),
    ("cookie", "Cookie", "food", ["cookie", "snack", "sweet"], "cookie.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Font_Awesome_5_solid_cookie.svg/500px-Font_Awesome_5_solid_cookie.svg.png", True),
    # --- objects (new) ---
    ("drum", "Drum", "objects", ["drum", "music", "instrument"], "drum.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Font_Awesome_5_solid_drum.svg/500px-Font_Awesome_5_solid_drum.svg.png", True),
    ("camera", "Camera", "objects", ["camera", "photo", "picture"], "camera.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Font_Awesome_5_solid_camera.svg/500px-Font_Awesome_5_solid_camera.svg.png", True),
    ("laptop", "Laptop", "objects", ["laptop", "computer", "tech"], "laptop.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Font_Awesome_5_solid_laptop.svg/500px-Font_Awesome_5_solid_laptop.svg.png", True),
    ("key", "Key", "objects", ["key", "lock", "security"], "key.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Font_Awesome_5_solid_key.svg/500px-Font_Awesome_5_solid_key.svg.png", True),
    ("car", "Car", "objects", ["car", "vehicle", "drive"], "car.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Font_Awesome_5_solid_car.svg/500px-Font_Awesome_5_solid_car.svg.png", True),
    ("rocket", "Rocket", "objects", ["rocket", "space", "launch"], "rocket.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Font_Awesome_5_solid_rocket.svg/500px-Font_Awesome_5_solid_rocket.svg.png", True),
    ("plane", "Plane", "objects", ["plane", "airplane", "travel"], "plane.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Font_Awesome_5_solid_plane.svg/500px-Font_Awesome_5_solid_plane.svg.png", True),
    ("umbrella", "Umbrella", "objects", ["umbrella", "rain", "weather"], "umbrella.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Font_Awesome_5_solid_umbrella.svg/500px-Font_Awesome_5_solid_umbrella.svg.png", True),
    ("clock", "Clock", "objects", ["clock", "time", "watch"], "clock.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Font_Awesome_5_solid_clock.svg/500px-Font_Awesome_5_solid_clock.svg.png", True),
    ("home", "Home", "objects", ["home", "house", "building"], "home.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Font_Awesome_5_solid_home.svg/500px-Font_Awesome_5_solid_home.svg.png", True),
    ("crown", "Crown", "objects", ["crown", "king", "royal"], "crown.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Font_Awesome_5_solid_crown.svg/500px-Font_Awesome_5_solid_crown.svg.png", True),
    ("bell", "Bell", "objects", ["bell", "ring", "alert"], "bell.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Font_Awesome_5_solid_bell.svg/500px-Font_Awesome_5_solid_bell.svg.png", True),
    ("wrench", "Wrench", "objects", ["wrench", "tool", "fix"], "wrench.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Font_Awesome_5_solid_wrench.svg/500px-Font_Awesome_5_solid_wrench.svg.png", True),
    ("gift", "Gift", "objects", ["gift", "present", "box"], "gift.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Font_Awesome_5_solid_gift.svg/500px-Font_Awesome_5_solid_gift.svg.png", True),
    ("bicycle", "Bicycle", "objects", ["bicycle", "bike", "ride"], "bicycle.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Font_Awesome_5_solid_bicycle.svg/500px-Font_Awesome_5_solid_bicycle.svg.png", True),
    ("pen", "Pen", "objects", ["pen", "write", "draw"], "pen.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Font_Awesome_5_solid_pen.svg/500px-Font_Awesome_5_solid_pen.svg.png", True),
    ("headphones", "Headphones", "objects", ["headphones", "music", "audio"], "headphones.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Font_Awesome_5_solid_headphones.svg/500px-Font_Awesome_5_solid_headphones.svg.png", True),
    ("bomb", "Bomb", "objects", ["bomb", "explosive", "danger"], "bomb.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Font_Awesome_5_solid_bomb.svg/500px-Font_Awesome_5_solid_bomb.svg.png", True),
    # --- symbols (new) ---
    ("peace", "Peace", "symbols", ["peace", "symbol", "love"], "peace.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Font_Awesome_5_solid_peace.svg/500px-Font_Awesome_5_solid_peace.svg.png", True),
    ("yin-yang", "Yin Yang", "symbols", ["yin-yang", "balance", "zen"], "yin-yang.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Font_Awesome_5_solid_yin-yang.svg/500px-Font_Awesome_5_solid_yin-yang.svg.png", True),
    ("infinity", "Infinity", "symbols", ["infinity", "math", "forever"], "infinity.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Font_Awesome_5_solid_infinity.svg/500px-Font_Awesome_5_solid_infinity.svg.png", True),
    ("music", "Music Note", "symbols", ["music", "note", "sound"], "music.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Font_Awesome_5_solid_music.svg/500px-Font_Awesome_5_solid_music.svg.png", True),
    ("gem", "Gem", "symbols", ["gem", "diamond", "jewel"], "gem.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Font_Awesome_5_solid_gem.svg/500px-Font_Awesome_5_solid_gem.svg.png", True),
    ("anchor", "Anchor", "symbols", ["anchor", "sea", "nautical"], "anchor.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Font_Awesome_5_solid_anchor.svg/500px-Font_Awesome_5_solid_anchor.svg.png", True),
    ("shield", "Shield", "symbols", ["shield", "protect", "defense"], "shield.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Font_Awesome_5_solid_shield-alt.svg/500px-Font_Awesome_5_solid_shield-alt.svg.png", True),
    ("cross", "Cross", "symbols", ["cross", "plus", "medical"], "cross.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Font_Awesome_5_solid_cross.svg/500px-Font_Awesome_5_solid_cross.svg.png", True),
    ("globe", "Globe", "symbols", ["globe", "earth", "world"], "globe.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Font_Awesome_5_solid_globe-americas.svg/500px-Font_Awesome_5_solid_globe-americas.svg.png", True),
    # --- emoji (new) ---
    ("cry", "Crying", "emoji", ["cry", "sad", "tears", "emoji"], "cry.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Font_Awesome_5_solid_sad-cry.svg/500px-Font_Awesome_5_solid_sad-cry.svg.png", True),
    ("wink", "Wink", "emoji", ["wink", "face", "playful", "emoji"], "wink.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Font_Awesome_5_solid_grin-wink.svg/500px-Font_Awesome_5_solid_grin-wink.svg.png", True),
    ("laugh", "Laugh", "emoji", ["laugh", "lol", "face", "emoji"], "laugh.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Font_Awesome_5_solid_laugh.svg/500px-Font_Awesome_5_solid_laugh.svg.png", True),
    ("meh", "Meh", "emoji", ["meh", "neutral", "face", "emoji"], "meh.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Font_Awesome_5_solid_meh.svg/500px-Font_Awesome_5_solid_meh.svg.png", True),
    ("surprise", "Surprise", "emoji", ["surprise", "shocked", "face", "emoji"], "surprise.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Font_Awesome_5_solid_surprise.svg/500px-Font_Awesome_5_solid_surprise.svg.png", True),
    ("dizzy", "Dizzy", "emoji", ["dizzy", "spiral", "face", "emoji"], "dizzy.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Font_Awesome_5_solid_dizzy.svg/500px-Font_Awesome_5_solid_dizzy.svg.png", True),
    ("starry", "Starry Eyes", "emoji", ["starry", "amazed", "face", "emoji"], "starry.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Font_Awesome_5_solid_grin-stars.svg/500px-Font_Awesome_5_solid_grin-stars.svg.png", True),
    ("kiss", "Kiss", "emoji", ["kiss", "love", "face", "emoji"], "kiss.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Font_Awesome_5_solid_kiss-wink-heart.svg/500px-Font_Awesome_5_solid_kiss-wink-heart.svg.png", True),
    # --- people & body (new) ---
    ("fist", "Fist", "people", ["fist", "power", "punch"], "fist.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Font_Awesome_5_solid_fist-raised.svg/500px-Font_Awesome_5_solid_fist-raised.svg.png", True),
    ("hand-peace", "Peace Hand", "people", ["peace", "hand", "victory"], "hand-peace.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Font_Awesome_5_solid_hand-peace.svg/500px-Font_Awesome_5_solid_hand-peace.svg.png", True),
    ("running", "Running", "people", ["running", "sport", "exercise"], "running.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Font_Awesome_5_solid_running.svg/500px-Font_Awesome_5_solid_running.svg.png", True),
    ("walking", "Walking", "people", ["walking", "person", "stroll"], "walking.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Font_Awesome_5_solid_walking.svg/500px-Font_Awesome_5_solid_walking.svg.png", True),
    ("user", "User", "people", ["user", "person", "profile"], "user.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Font_Awesome_5_solid_user.svg/500px-Font_Awesome_5_solid_user.svg.png", True),
    ("child", "Child", "people", ["child", "kid", "baby"], "child.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Font_Awesome_5_solid_child.svg/500px-Font_Awesome_5_solid_child.svg.png", True),
    ("eye", "Eye", "people", ["eye", "see", "watch"], "eye.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Font_Awesome_5_solid_eye.svg/500px-Font_Awesome_5_solid_eye.svg.png", True),
    # --- tech & science (new) ---
    ("code", "Code", "tech", ["code", "programming", "dev"], "code.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Font_Awesome_5_solid_code.svg/500px-Font_Awesome_5_solid_code.svg.png", True),
    ("wifi", "WiFi", "tech", ["wifi", "internet", "signal"], "wifi.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Font_Awesome_5_solid_wifi.svg/500px-Font_Awesome_5_solid_wifi.svg.png", True),
    ("power", "Power", "tech", ["power", "on", "off"], "power.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Font_Awesome_5_solid_power-off.svg/500px-Font_Awesome_5_solid_power-off.svg.png", True),
    ("cog", "Cog", "tech", ["cog", "gear", "settings"], "cog.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Font_Awesome_5_solid_cog.svg/500px-Font_Awesome_5_solid_cog.svg.png", True),
    ("bug", "Bug", "tech", ["bug", "error", "debug"], "bug.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Font_Awesome_5_solid_bug.svg/500px-Font_Awesome_5_solid_bug.svg.png", True),
    ("terminal", "Terminal", "tech", ["terminal", "console", "cli"], "terminal.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Font_Awesome_5_solid_terminal.svg/500px-Font_Awesome_5_solid_terminal.svg.png", True),
    ("flask", "Flask", "tech", ["flask", "science", "lab"], "flask.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Font_Awesome_5_solid_flask.svg/500px-Font_Awesome_5_solid_flask.svg.png", True),
    ("atom", "Atom", "tech", ["atom", "science", "physics"], "atom.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Font_Awesome_5_solid_atom.svg/500px-Font_Awesome_5_solid_atom.svg.png", True),
    ("microscope", "Microscope", "tech", ["microscope", "science", "lab"], "microscope.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Font_Awesome_5_solid_microscope.svg/500px-Font_Awesome_5_solid_microscope.svg.png", True),
    ("plug", "Plug", "tech", ["plug", "electric", "power"], "plug.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Font_Awesome_5_solid_plug.svg/500px-Font_Awesome_5_solid_plug.svg.png", True),
    # --- sports & games (new) ---
    ("trophy", "Trophy", "sports", ["trophy", "winner", "award"], "trophy.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Font_Awesome_5_solid_trophy.svg/500px-Font_Awesome_5_solid_trophy.svg.png", True),
    ("flag", "Flag", "sports", ["flag", "finish", "goal"], "flag.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Font_Awesome_5_solid_flag.svg/500px-Font_Awesome_5_solid_flag.svg.png", True),
    ("soccer", "Soccer Ball", "sports", ["soccer", "football", "ball"], "soccer.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Font_Awesome_5_solid_futbol.svg/500px-Font_Awesome_5_solid_futbol.svg.png", True),
    ("basketball", "Basketball", "sports", ["basketball", "ball", "sport"], "basketball.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Font_Awesome_5_solid_basketball-ball.svg/500px-Font_Awesome_5_solid_basketball-ball.svg.png", True),
    ("chess", "Chess", "sports", ["chess", "game", "strategy"], "chess.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Font_Awesome_5_solid_chess.svg/500px-Font_Awesome_5_solid_chess.svg.png", True),
    ("dumbbell", "Dumbbell", "sports", ["dumbbell", "gym", "fitness"], "dumbbell.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Font_Awesome_5_solid_dumbbell.svg/500px-Font_Awesome_5_solid_dumbbell.svg.png", True),
    ("dice", "Dice", "sports", ["dice", "game", "random"], "dice.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Font_Awesome_5_solid_dice.svg/500px-Font_Awesome_5_solid_dice.svg.png", True),
    ("gamepad", "Gamepad", "sports", ["gamepad", "game", "controller"], "gamepad.txt",
     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Font_Awesome_5_solid_gamepad.svg/500px-Font_Awesome_5_solid_gamepad.svg.png", True),
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
