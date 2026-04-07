# artscii

[![npm](https://img.shields.io/npm/v/artscii)](https://www.npmjs.com/package/artscii)

ASCII art, kaomoji, diagrams, text styling & image conversion — all in one MCP server for AI agents.

101 built-in arts + 100 kaomoji + 11 diagram types + sparklines + heatmaps + calendars + text composition + Unicode text styles + progress bars + box frames + image-to-ASCII (with braille mode).

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
| `search` | `query?`, `type?`, `random?`, `mode?` | Search art + kaomoji. Omit query to list all. `random: true` for random entry. `mode: "categories"` to list categories |
| `kaomoji` | `query?`, `category?` | Get kaomoji by emotion. Omit for random |
| `get` | `id` | Get art by ID |
| `banner` | `text`, `font?` | Render large ASCII text (FIGlet) |
| `style` | `text`, `style` | Unicode text transforms (8 styles) |
| `frame` | `text`, `style?`, `padding?`, `align?`, `title?` | Draw box/frame around text |
| `progress` | `percent?`, `items?`, `width?`, `style?` | ASCII progress bars |
| `sparkline` | `values`, `width?`, `labels?`, `style?` | Inline sparkline chart (3 styles) |
| `heatmap` | `data`, `rowLabels?`, `colLabels?`, `showValues?`, `style?` | 2D heatmap grid (3 styles) |
| `calendar` | `year`, `month`, `highlight?`, `firstDayOfWeek?` | ASCII monthly calendar |
| `compose` | `blocks`, `mode?`, `gap?`, `align?`, `separator?` | Combine text blocks side-by-side or stacked |
| `convert` | `url?`, `base64?`, `mode?`, `size?`, ... | Image → ASCII (with braille mode) |
| `diagram` | `type`, ... | Generate ASCII diagrams (11 types) |

## Text Styling

Transform text using 8 Unicode styles — no images, just characters.

| Style | Example |
|---|---|
| `bubble` | `ⓗⓔⓛⓛⓞ` |
| `fullwidth` | `ｈｅｌｌｏ` |
| `bold` | `𝐡𝐞𝐥𝐥𝐨` |
| `italic` | `𝘩𝘦𝘭𝘭𝘰` |
| `monospace` | `𝚑𝚎𝚕𝚕𝚘` |
| `smallcaps` | `ʜᴇʟʟᴏ` |
| `upsidedown` | `oʃʃǝɥ` |
| `strikethrough` | `h̶e̶l̶l̶o̶` |

## Box Frames

Draw borders around any text with 5 styles:

```
┌───────┐   ╔═══════╗   ╭───────╮   ┏━━━━━━━┓   +-------+
│ hello │   ║ hello ║   │ hello │   ┃ hello ┃   | hello |
└───────┘   ╚═══════╝   ╰───────╯   ┗━━━━━━━┛   +-------+
 single      double      rounded       bold        ascii
```

Options: `padding`, `align` (left/center/right), `title` in top border.

## Progress Bars

Single or multiple bars with 5 visual styles:

```
████████████░░░░░░░░ 60%           block (default)
▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 60%         shade
[============        ] 60%         arrow
●●●●●●●●●●●●○○○○○○○○ 60%         dot
[############--------] 60%         ascii
```

Multi-bar mode with labels:

```
CPU    ████████████████░░░░ 80%
Memory █████████░░░░░░░░░░░ 45%
Disk   ██████████████░░░░░░ 70%
```

## Sparklines

Inline sparkline charts from numeric values with 3 styles:

```
▁▂▃▄▅▆▇█▇▅▃▁   default (block)
_.-~=*#@*~-._   ascii
⠀⡀⣀⣄⣤⣦⣶⣷⣿⣷⣶⣤⣀   dot (braille)
```

Options: `width` (auto-scale), `labels` (show min/max), `style`.

## Heatmaps

2D grid visualization with 5 intensity levels and 3 styles:

```
 ░▒▓█   default (blocks)
 .oO#   ascii
 ·•●⬤   dot
```

Options: `rowLabels`, `colLabels`, `showValues`, `style`.

## Calendar

ASCII monthly calendar with highlight support:

```
   January 2025
Su Mo Tu We Th Fr Sa
          *1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 20 21 22 23 24 25
26 27 28 29 30 31
* 15
```

Options: `highlight` (dates to mark), `firstDayOfWeek` (0=Sunday, 1=Monday).

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
