# artscii

ASCII art & kaomoji search API for AI agents. Each art is sized to its minimum identifiable tier (16w / 32w / 64w), plus 90 curated kaomoji across 22 emotion categories. Served via REST API and MCP.

```
     .::-::.         .:-::.
  .=#%@@@@@%#=:  .=*%@@@@@%#+:
 -%@@@@@@@@@@@%*+%@@@@@@@@@@@%+
.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*
.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=
 =@@@@@@@@@@@@@@@@@@@@@@@@@@@@*
  -#@@@@@@@@@@@@@@@@@@@@@@@@%=
    =%@@@@@@@@@@@@@@@@@@@@%*.
      =#@@@@@@@@@@@@@@@@%+.
        =#@@@@@@@@@@@@%+.
          -#@@@@@@@@%+.
            -#@@@@%=.
              -*#=
```

## Size Tiers

Each art is stored at its **minimum identifiable size** — the smallest tier where the art is still clearly recognizable.

| Tier | Max Width | Max Height | Use Case |
|------|-----------|------------|----------|
| 16w | 16 chars | 8 lines | Simple icons (heart, star, arrows) |
| 32w | 32 chars | 16 lines | Animal silhouettes, emoji, nature |
| 64w | 64 chars | 32 lines | Detailed scenes (rare) |

## Quick Start

```bash
npm install
npm run build
npm run start    # REST API on :3001
```

## REST API

Search accepts `?type=art|kaomoji` to filter results.

| Endpoint | Description |
|---|---|
| `GET /search?q={query}&type=art\|kaomoji` | Unified search (art + kaomoji) |
| `GET /art/:id` | Get art by ID (JSON) |
| `GET /art/:id/raw` | Get raw ASCII text |
| `GET /random` | Random art |
| `GET /categories` | List art categories |
| `GET /categories/:name` | Arts in category |
| `GET /list` | All arts with metadata |
| `POST /art` | Submit new art |
| `POST /convert` | Convert image to ASCII art |
| `DELETE /art/:id` | Delete user-submitted art |
| `GET /kaomoji?q={query}` | Search kaomoji (or list all) |
| `GET /kaomoji/random` | Random kaomoji |
| `GET /kaomoji/categories` | List kaomoji categories |
| `GET /kaomoji/categories/:name` | Kaomoji in category |

### Example

```bash
curl http://localhost:3001/art/heart/raw
curl 'http://localhost:3001/kaomoji?q=happy'
curl 'http://localhost:3001/search?q=cat'
```

### Submitting Art

```bash
curl -X POST http://localhost:3001/art \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Robot",
    "category": "objects",
    "tags": ["robot", "tech"],
    "size": 16,
    "art": " [o_o]\n /| |\\\n  d b"
  }'
```

**Constraints:**
- `size`: 16 (default), 32, or 64
- `name`: max 30 chars
- `tags`: max 5, each max 20 chars
- Art must fit within the declared size tier
- Rate limit: 5 requests/min per IP
- Max 100 user-submitted arts total

### Converting Images

```bash
curl -X POST http://localhost:3001/convert \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com/icon.png", "size": 16}'
```

| Field | Type | Default | Description |
|---|---|---|---|
| `url` | string | — | Image URL (one of `url`/`base64` required) |
| `base64` | string | — | Base64 or data-URI encoded image |
| `size` | number | `16` | Size tier: 16, 32, or 64 |
| `invert` | boolean | `false` | Invert brightness |
| `contrast` | boolean | `true` | Apply auto-contrast |
| `gamma` | number | `1.0` | Gamma correction |
| `save` | object | — | Save result: `{ name, description?, category, tags }` |

Rate limit: 3 requests/min per IP.

### Deleting Art

```bash
curl -X DELETE http://localhost:3001/art/robot
```

## MCP Server

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

### Tools

| Tool | Parameters | Description |
|---|---|---|
| `search` | `query`, `type?` | Unified search (art + kaomoji) |
| `kaomoji` | `query?`, `category?` | Get kaomoji by emotion/keyword |
| `get` | `id` | Get art by ID |
| `random` | — | Random art |
| `list` | — | List all arts with metadata |
| `categories` | — | List art categories |
| `submit` | `name`, `category`, `tags`, `size?`, `art` | Submit new art |
| `convert` | `url?`, `base64?`, `size?`, `invert?`, `contrast?`, `gamma?`, `save?` | Convert image to ASCII art |
| `delete` | `id` | Delete user-submitted art |

## Kaomoji

90 curated kaomoji across 22 emotion/situation categories. Data sourced from [kao.moji](https://github.com/bnookala/kao.moji) (MIT).

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
| + 14 more | celebrate, greeting, hug, surprised, sleepy, nervous, wink, magic, laughing, determined, eating, dancing, hopeful, jealous |

## License

MIT
