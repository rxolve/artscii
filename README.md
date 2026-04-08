# artscii

[![npm](https://img.shields.io/npm/v/artscii)](https://www.npmjs.com/package/artscii)

ASCII art, kaomoji, diagrams, charts & image conversion — all in one MCP server for AI agents.

101 built-in arts + 100 kaomoji + 11 diagram types + charts (progress, sparkline, heatmap) + box frames + FIGlet banners + image-to-ASCII (with braille mode). 9 focused tools.

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

## MCP Tools

| Tool | Parameters | Description |
|---|---|---|
| `search` | `query?`, `type?`, `random?`, `mode?` | Search art + kaomoji. Omit query to list all |
| `get` | `id` | Get art by ID |
| `kaomoji` | `query?`, `category?` | Get kaomoji by emotion. Omit for random |
| `banner` | `text`, `font?` | Render large ASCII text (FIGlet, 5 fonts) |
| `frame` | `text`, `style?`, `padding?`, `align?`, `title?` | Draw box/frame around text (5 styles) |
| `chart` | `type`, ... | Data visualization: progress, sparkline, heatmap |
| `compose` | `blocks`, `mode?`, `gap?`, `align?` | Combine text blocks side-by-side or stacked |
| `convert` | `url?`, `base64?`, `mode?`, `size?`, ... | Image → ASCII (ascii or braille mode) |
| `diagram` | `type`, ... | Generate ASCII diagrams (11 types) |

## Box Frames

Draw borders around any text with 5 styles:

```
┌───────┐   ╔═══════╗   ╭───────╮   ┏━━━━━━━┓   +-------+
│ hello │   ║ hello ║   │ hello │   ┃ hello ┃   | hello |
└───────┘   ╚═══════╝   ╰───────╯   ┗━━━━━━━┛   +-------+
 single      double      rounded       bold        ascii
```

Options: `padding`, `align` (left/center/right), `title` in top border.

## Charts

Unified `chart` tool with 3 types: **progress**, **sparkline**, **heatmap**.

```
Progress:   ███████████████░░░░░ 75%
Sparkline:  ▁▂▃▄▅▆▇█▇▅▃▁
Heatmap:     A B C
           X ░▒█
           Y ▓░▒
```

## Compose

Combine multiple text blocks horizontally (side-by-side) or vertically (stacked):

```
┌───┐ ┌───┐         ┌───┐
│ A │ │ B │         │ A │
└───┘ └───┘         └───┘
 horizontal          ---
                    ┌───┐
                    │ B │
                    └───┘
                    vertical
```

Options: `gap`, `align` (top/middle/bottom), `separator` (vertical mode).

## Image Conversion

Convert images (URL or base64) to ASCII art. Two render modes:

- **`ascii`** — character ramp (` .:-=+*#%@`), classic look
- **`braille`** — Unicode braille dots (⠿), 8x resolution per character

Options: `size` (16/32/64), `invert`, `contrast`, `gamma`, `threshold` (braille).

## Diagrams

11 diagram types with `unicode`, `rounded`, and `ascii` border styles.

| Type | Required fields | Output |
|---|---|---|
| `flowchart` | `nodes` | Vertical flow with `│` `▼` connectors |
| `box` | `title`, `lines` | Title + separator + body |
| `tree` | `root` (`{label, children?}`) | `├──` `└──` hierarchy |
| `table` | `headers`, `rows` | Column-aligned grid |
| `sequence` | `actors`, `messages` | Actor lifelines with arrows |
| `timeline` | `events` | Vertical `●` `│` event list |
| `bar` | `items`, `maxWidth?` | Horizontal `█` bar chart |
| `class` | `classes` | UML class with properties/methods |
| `er` | `entities`, `relationships` | Entity-relationship diagram |
| `mindmap` | `root` | Horizontal mind map tree |
| `gantt` | `tasks`, `unitLabel?` | Gantt chart with timelines |

```
┌─────────┐    ╭──────────╮    ┌──────┬───────┐    src
│  Start  │    │  Status  │    │ Name │ Score │    ├── index.ts
└────┬────┘    ├──────────┤    ├──────┼───────┤    └── diagram.ts
     │         │ Line 1   │    │ A    │ 95    │
     ▼         │ Line 2   │    │ B    │ 87    │
┌─────────┐    ╰──────────╯    └──────┴───────┘
│   End   │
└─────────┘
 flowchart       box              table              tree
```

### Class Diagram

```json
{ "type": "class", "classes": [
  { "name": "Animal", "properties": ["+ name: string"], "methods": ["+ speak(): void"] },
  { "name": "Dog", "properties": ["+ breed: string"], "methods": ["+ bark(): void"] }
]}
```

```
┌──────────────────┐
│      Animal       │
├──────────────────┤
│ + name: string   │
├──────────────────┤
│ + speak(): void  │
└──────────────────┘
         ▲
         │
┌──────────────────┐
│       Dog         │
├──────────────────┤
│ + breed: string  │
├──────────────────┤
│ + bark(): void   │
└──────────────────┘
```

### Gantt Chart

```json
{ "type": "gantt", "tasks": [
  { "label": "Design", "start": 0, "duration": 3 },
  { "label": "Develop", "start": 2, "duration": 5 },
  { "label": "Test", "start": 5, "duration": 3 }
], "unitLabel": "weeks" }
```

```
            0   2   4   6   8 weeks
            ┼────────────────────
Design      ████████
Develop         █████████████████
Test                 ████████████
```

## Banner

Render text as large ASCII art using FIGlet fonts: `Standard`, `Small`, `Slant`, `Big`, `Mini`.

## Size Tiers

Each art is stored at its minimum identifiable size.

| Tier | Dimensions | For |
|------|-----------|-----|
| **16w** | 16 x 8 | Icons, symbols, simple shapes |
| **32w** | 32 x 16 | Animal silhouettes, emoji |
| **64w** | 64 x 32 | Detailed scenes (rare) |

## Kaomoji

100 curated entries across 26 categories. Source: [kao.moji](https://github.com/bnookala/kao.moji) (MIT).

| Category | Examples |
|---|---|
| happy | `(◕‿◕)` `◉‿◉` `(≧◡≦)` |
| sad | `(ಥ﹏ಥ)` `╥﹏╥` `(;﹏;)` |
| angry | `ಠ_ಠ` `(¬_¬)` `눈_눈` |
| love | `♡＾▽＾♡` `(•ө•)♡` `✿♥‿♥✿` |
| confused | `¯\_(ツ)_/¯` `◔_◔` `(・・?)` |
| animals | `ʕ•ᴥ•ʔ` `ฅ•ω•ฅ` `(•ㅅ•)` |
| table-flip | `(╯°□°)╯︵ ┻━┻` `┬─┬ノ(ಠ_ಠノ)` |
| + 19 more | excited, greeting, celebrate, hug, surprised, sleepy, nervous, wink, magic, laughing, determined, eating, dancing, hopeful, jealous, ... |

## License

MIT. Art icons from [game-icons.net](https://game-icons.net) (CC BY 3.0, Lorc & Delapouite).
