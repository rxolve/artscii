# artscii

ASCII art search API for AI agents. 10 silhouette-based arts in two sizes (64w / 32w), served via REST API and MCP.

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

All content endpoints accept `?width=32` for the compact variant (default: 64).

| Endpoint | Description |
|---|---|
| `GET /search?q={query}&width=64\|32` | Search by keyword |
| `GET /art/:id?width=64\|32` | Get art by ID (JSON) |
| `GET /art/:id/raw?width=64\|32` | Get raw ASCII text |
| `GET /random?width=64\|32` | Random art |
| `GET /categories` | List categories |
| `GET /categories/:name?width=64\|32` | Arts in category |
| `GET /list` | All arts with metadata |

### Example

```bash
# 64w (default)
curl http://localhost:3001/art/cat/raw

# 32w compact
curl 'http://localhost:3001/art/cat/raw?width=32'
```

Response (`GET /art/cat`):

```json
{
  "id": "cat",
  "name": "Cat",
  "category": "animals",
  "tags": ["cat", "pet", "animal", "cute"],
  "width": 58,
  "height": 29,
  "art": "..."
}
```

## MCP Server

Add to your MCP client config:

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

### Tools

| Tool | Parameters | Description |
|---|---|---|
| `search` | `query`, `width?` | Search arts by keyword |
| `get` | `id`, `width?` | Get art by ID |
| `random` | `width?` | Random art |
| `list` | — | List all arts with metadata |
| `categories` | — | List categories |

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

## Regenerating Arts

Arts are converted from public domain silhouette images using Pillow.

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
