# artscii

[![npm](https://img.shields.io/npm/v/artscii)](https://www.npmjs.com/package/artscii)

ASCII art & kaomoji for AI agents, CLI tools, and chatbots.
101 built-in arts + 100 kaomoji, searchable via MCP or REST API.

```
     .::-::.         .:-::.        --- apple (16w) ---
  .=#%@@@@@%#=:  .=*%@@@@@%#+:           +:
 -%@@@@@@@@@@@%*+%@@@@@@@@@@@%+      :--:#*.--:
.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-    -#@@@@#%@@@@%=
-@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*   :@@@%****+#%@@@:
.%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@=   -@%%%+*@@+*@%%@-
 =@@@@@@@@@@@@@@@@@@@@@@@@@@@@*     *@@%+*+#=#%@@#
  -#@@@@@@@@@@@@@@@@@@@@@@@@%=       +%@@@#@@@@%+
    =%@@@@@@@@@@@@@@@@@@@@%*.         .-+**=*+=.
      =#@@@@@@@@@@@@@@@@%+.
        =#@@@@@@@@@@@@%+.    ʕ•ᴥ•ʔ  (◕‿◕)  (╯°□°)╯︵ ┻━┻
          -#@@@@@@@@%+.
            -#@@@@%=.
              -*#=
```

## Use Cases

**Give your CLI personality.** Replace boring spinners with ASCII art loading screens, success badges, or error illustrations.

```javascript
import { execSync } from 'child_process';
// npx artscii runs the MCP server — or just fetch from the REST API:
const art = await fetch('http://localhost:3001/art/trophy/raw').then(r => r.text());
console.log(art); // 16w trophy on build success
```

**Make chatbots expressive.** Discord/Slack bots can react with kaomoji that match the mood — no custom emoji uploads needed.

```javascript
const res = await fetch('http://localhost:3001/kaomoji?q=celebrate');
const [first] = await res.json();
bot.reply(`Deploy complete! ${first.text}`); // Deploy complete! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
```

**Add visuals to AI agents without wasting tokens.** A 16w art is only 8 lines — far cheaper than describing an image in natural language.

```json
{
  "mcpServers": {
    "artscii": { "command": "npx", "args": ["-y", "artscii"] }
  }
}
```

> "Show me a cat" → MCP `search("cat")` → returns 32w cat silhouette + `ฅ•ω•ฅ` kaomoji

## Install

**Claude Code** — one command:
```bash
claude mcp add artscii -- npx -y artscii
```

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{ "mcpServers": { "artscii": { "command": "npx", "args": ["-y", "artscii"] } } }
```

**Cursor** — add to `.cursor/mcp.json`:
```json
{ "mcpServers": { "artscii": { "command": "npx", "args": ["-y", "artscii"] } } }
```

**VS Code** — search `@mcp artscii` in Extensions panel, or add to `settings.json`:
```json
{ "mcp": { "servers": { "artscii": { "command": "npx", "args": ["-y", "artscii"] } } } }
```

**REST API** — `npx artscii` starts the server on `:3001`

## MCP Tools

| Tool | Parameters | Description |
|---|---|---|
| `search` | `query`, `type?` | Search art + kaomoji. `type`: `"art"`, `"kaomoji"`, or `"all"` |
| `kaomoji` | `query?`, `category?` | Get kaomoji by emotion. Omit for random |
| `get` | `id` | Get art by ID |
| `random` | — | Random art |
| `list` | — | List all arts |
| `categories` | — | List categories |
| `submit` | `name`, `category`, `tags`, `size?`, `art` | Submit new art |
| `convert` | `url?`, `base64?`, `size?`, ... | Convert image to ASCII |
| `delete` | `id` | Delete user-submitted art |

## REST API

| Endpoint | Description |
|---|---|
| `GET /search?q={query}&type=art\|kaomoji` | Unified search |
| `GET /art/:id` | Art by ID (JSON) |
| `GET /art/:id/raw` | Raw ASCII text |
| `GET /random` | Random art |
| `GET /categories` | List categories |
| `GET /categories/:name` | Arts in category |
| `GET /list` | All arts metadata |
| `POST /art` | Submit art |
| `POST /convert` | Image → ASCII |
| `DELETE /art/:id` | Delete user art |
| `GET /kaomoji?q={query}` | Search kaomoji |
| `GET /kaomoji/random` | Random kaomoji |
| `GET /kaomoji/categories` | Kaomoji categories |
| `GET /kaomoji/categories/:name` | Kaomoji by category |

### Submit Art

```bash
curl -X POST http://localhost:3001/art \
  -H 'Content-Type: application/json' \
  -d '{"name":"Robot","category":"objects","tags":["robot","tech"],"size":16,"art":" [o_o]\n /| |\\\n  d b"}'
```

### Convert Image

```bash
curl -X POST http://localhost:3001/convert \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/icon.png","size":16}'
```

| Field | Type | Default | Description |
|---|---|---|---|
| `url` / `base64` | string | — | Image source (one required) |
| `size` | 16 / 32 / 64 | 16 | Size tier |
| `invert` | boolean | false | Invert brightness |
| `contrast` | boolean | true | Auto-contrast |
| `gamma` | number | 1.0 | Gamma correction |
| `save` | object | — | `{ name, category, tags }` to persist |

## Size Tiers

Each art is stored at its minimum identifiable size.

| Tier | Dimensions | For |
|------|-----------|-----|
| **16w** | 16 x 8 | Icons, symbols, simple shapes |
| **32w** | 32 x 16 | Animal silhouettes, emoji |
| **64w** | 64 x 32 | Detailed scenes (rare) |

## Kaomoji

90 curated entries across 22 categories. Source: [kao.moji](https://github.com/bnookala/kao.moji) (MIT).

| Category | Examples |
|---|---|
| happy | `(◕‿◕)` `◉‿◉` `(≧◡≦)` |
| sad | `(ಥ﹏ಥ)` `╥﹏╥` `(;﹏;)` |
| angry | `ಠ_ಠ` `(¬_¬)` `눈_눈` |
| love | `♡＾▽＾♡` `(•ө•)♡` `✿♥‿♥✿` |
| confused | `¯\_(ツ)_/¯` `◔_◔` `(・・?)` |
| animals | `ʕ•ᴥ•ʔ` `ฅ•ω•ฅ` `(•ㅅ•)` |
| table-flip | `(╯°□°)╯︵ ┻━┻` `┬─┬ノ(ಠ_ಠノ)` |
| + 15 more | excited, greeting, celebrate, hug, surprised, sleepy, nervous, wink, magic, laughing, determined, eating, dancing, hopeful, jealous |

## License

MIT. Art icons from [game-icons.net](https://game-icons.net) (CC BY 3.0, Lorc & Delapouite).
