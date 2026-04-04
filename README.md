# artscii

ASCII art & kaomoji search API for AI agents. Built-in silhouette arts in two sizes (64w / 32w) and 79 curated kaomoji across 18 emotion categories, served via REST API and MCP.

```
              :%%:
      -+-    .%@@%.    -+-
      *@@%*--#@@@@#--*%@@*
      :%@@@@@#****#@@@@@%:
      .%@@*-...::...-*@@%.
.#%%%%%@#: :*%%@@%%*: :#@%%%%%#.
 -*@@@@%. +@@@@@@@@@@+ .%@@@@*-
   .+@@+ -@@@@@@@@@@@@- +@@+.
   .+@@+ -@@@@@@@@@@@@- +@@+.
 -*@@@@%. +@@@@@@@@@@+ .%@@@@*-
.#%%%%%@#: :*%%@@%%*: :#@%%%%%#.
      .%@@*-...::...-*@@%.
      :%@@@@@#****#@@@@@%:
      *@@%*--#@@@@#--*%@@*
      -+-    .%@@%.    -+-
              :%%:
```

## Quick Start

```bash
npm install
npm run build
npm run start    # REST API on :3001
```

## REST API

All content endpoints accept `?width=32` for the compact variant (default: 64). Search accepts `?type=art|kaomoji` to filter results.

| Endpoint | Description |
|---|---|
| `GET /search?q={query}&type=art\|kaomoji&width=64\|32` | Unified search (art + kaomoji) |
| `GET /art/:id?width=64\|32` | Get art by ID (JSON) |
| `GET /art/:id/raw?width=64\|32` | Get raw ASCII text |
| `GET /random?width=64\|32` | Random art |
| `GET /categories` | List art categories |
| `GET /categories/:name?width=64\|32` | Arts in category |
| `GET /list` | All arts with metadata |
| `POST /art` | Submit new art (JSON body) |
| `POST /convert` | Convert image to ASCII art |
| `DELETE /art/:id` | Delete user-submitted art |
| `GET /kaomoji?q={query}` | Search kaomoji (or list all) |
| `GET /kaomoji/random` | Random kaomoji |
| `GET /kaomoji/categories` | List kaomoji categories |
| `GET /kaomoji/categories/:name` | Kaomoji in category |

### Example

```bash
# ASCII art
curl http://localhost:3001/art/cat/raw
curl 'http://localhost:3001/art/cat/raw?width=32'

# Kaomoji
curl 'http://localhost:3001/kaomoji?q=happy'
curl http://localhost:3001/kaomoji/random

# Unified search (returns both art and kaomoji)
curl 'http://localhost:3001/search?q=cat'
curl 'http://localhost:3001/search?q=sad&type=kaomoji'
```

Response (`GET /kaomoji?q=bear`):

```json
[
  {
    "id": "k050",
    "type": "kaomoji",
    "name": "Bear",
    "category": "animals",
    "tags": ["cute", "creature", "animals"],
    "text": "ʕ•ᴥ•ʔ"
  }
]
```

### Submitting Art

```bash
curl -X POST http://localhost:3001/art \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Robot",
    "category": "objects",
    "tags": ["robot", "tech"],
    "art": "  [o_o]\n  /| |\\\n   d b"
  }'
```

Response: `201` with `ArtResult` JSON.

**Constraints:**
- `name`: max 30 chars
- `tags`: max 5, each max 20 chars
- `art`: max 64 chars wide, 32 lines tall
- `art32` (optional): max 32 chars wide, 16 lines tall
- Rate limit: 5 requests/min per IP
- Max 100 user-submitted arts total

**Errors:** `400` (validation), `409` (duplicate ID), `429` (rate limit), `507` (limit reached)

### Converting Images

Convert an image URL or base64 data to ASCII art at runtime (no Python required).

```bash
curl -X POST http://localhost:3001/convert \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com/photo.jpg"}'
```

Body parameters:

| Field | Type | Default | Description |
|---|---|---|---|
| `url` | string | — | Image URL (one of `url`/`base64` required) |
| `base64` | string | — | Base64 or data-URI encoded image |
| `invert` | boolean | `false` | Invert brightness |
| `contrast` | boolean | `true` | Apply auto-contrast |
| `gamma` | number | `1.0` | Gamma correction (>1 brighter, <1 darker) |
| `save` | object | — | Save result: `{ name, description?, category, tags }` |

Response returns `art64`, `art32` and their dimensions. With `save`, also returns `saved: { id, name }` (status `201`).

Rate limit: 3 requests/min per IP.

### Deleting Art

```bash
curl -X DELETE http://localhost:3001/art/robot
```

- `204`: deleted
- `403`: cannot delete built-in art
- `404`: not found

## MCP Server

Add to your MCP client config:

```json
{
  "mcpServers": {
    "artscii": {
      "command": "npx",
      "args": ["-y", "artscii"]
    }
  }
}
```

<details>
<summary>Local development (from source)</summary>

```json
{
  "mcpServers": {
    "artscii": {
      "command": "npx",
      "args": ["tsx", "src/mcp.ts"],
      "cwd": "/path/to/artscii"
    }
  }
}
```

</details>

### Tools

| Tool | Parameters | Description |
|---|---|---|
| `search` | `query`, `type?`, `width?` | Unified search (art + kaomoji). `type`: `"art"`, `"kaomoji"`, or `"all"` |
| `kaomoji` | `query?`, `category?` | Get kaomoji by emotion/keyword. Omit both for random |
| `get` | `id`, `width?` | Get art by ID |
| `random` | `width?` | Random art |
| `list` | — | List all arts with metadata |
| `categories` | — | List art categories |
| `submit` | `name`, `category`, `tags`, `art`, `art32?` | Submit new art |
| `convert` | `url?`, `base64?`, `invert?`, `contrast?`, `gamma?`, `save?` | Convert image to ASCII art |
| `delete` | `id` | Delete user-submitted art |

`width` accepts `"64"` (default) or `"32"` (compact).

## Available Arts

| ID | Category | 64w | 32w |
|---|---|---|---|
| cat | animals | 58x29 | 29x15 |
| bird | animals | 64x21 | 32x10 |
| fish | animals | 62x23 | 31x11 |
| tree | nature | 53x32 | 26x16 |
| mountain | nature | 64x14 | 32x7 |
| sun | nature | 63x32 | 32x16 |
| coffee | objects | 62x25 | 31x12 |
| book | objects | 58x25 | 29x13 |
| heart | symbols | 64x30 | 32x15 |
| star | symbols | 64x30 | 32x15 |

## Kaomoji

79 curated kaomoji across 18 emotion/situation categories. Data sourced from [kao.moji](https://github.com/bnookala/kao.moji) (MIT).

| Category | Examples |
|---|---|
| happy | `(◕‿◕)` `◉‿◉` `(≧◡≦)` |
| sad | `(ಥ﹏ಥ)` `╥﹏╥` `(;﹏;)` |
| angry | `ಠ_ಠ` `(¬_¬)` `눈_눈` |
| love | `♡＾▽＾♡` `(•ө•)♡` `✿♥‿♥✿` |
| confused | `¯\_(ツ)_/¯` `◔_◔` `(・・?)` |
| excited | `(≧∀≦)` `ヽ(>∀<☆)ノ` `(ง •̀_•́)ง` |
| animals | `ʕ•ᴥ•ʔ` `ฅ•ω•ฅ` `(•ㅅ•)` |
| table-flip | `(╯°□°)╯︵ ┻━┻` `┬─┬ノ(ಠ_ಠノ)` |
| celebrate | `(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧` `(＾＾)ｂ` |
| + 9 more | greeting, hug, surprised, sleepy, nervous, wink, magic, laughing, determined |

## Image Conversion

### Runtime (Node.js / sharp)

The `POST /convert` endpoint and MCP `convert` tool handle image-to-ASCII conversion at runtime — no Python needed. Just `npm install` and go.

### Batch (Python / Pillow)

The original batch scripts are still available for regenerating the built-in arts:

```bash
pip3 install Pillow
npm run convert          # download + convert all 10 arts
```

Single image conversion:

```bash
python3 scripts/img2ascii.py <image-or-url> --width 64 --height 32
python3 scripts/img2ascii.py photo.jpg --width 32 --height 16 --invert --gamma 1.2
```

Options: `--width`, `--height`, `--invert`, `--no-contrast`, `--gamma`

## License

MIT
