#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, listAll, toResult } from './store.js';
import { loadKaomoji, searchKaomoji, getRandomKaomoji, listKaomojiCategories, getKaomojiByCategory, toKaomojiResult } from './kaomoji.js';
import { SIZE_LIMITS, DEFAULT_SIZE } from './constants.js';
import { resolveImageInput } from './resolve.js';
import { convertImage } from './converter.js';
import { renderBanner, BANNER_FONTS } from './banner.js';
import { renderDiagram, listDiagramTypes, type TreeNode } from './diagram.js';
import { styleText, TEXT_STYLES } from './style.js';
import { frame, FRAME_STYLES } from './frame.js';
import { renderProgress, renderMultiProgress, PROGRESS_STYLES } from './progress.js';
import { MAX_DIAGRAM_NODES, MAX_DIAGRAM_ROWS, MAX_TREE_DEPTH, MAX_SEQUENCE_ACTORS, MAX_SEQUENCE_MESSAGES, MAX_TIMELINE_EVENTS, MAX_BAR_ITEMS, MAX_BAR_WIDTH } from './constants.js';
import type { ArtSize } from './types.js';

const server = new McpServer({
  name: 'artscii',
  version: '0.5.0',
});

const sizeSchema = z.enum(['16', '32', '64']).default(String(DEFAULT_SIZE) as '16').describe('Art size tier: "16" (simple, default), "32" (medium), "64" (detailed)');

server.tool(
  'search',
  'Search ASCII art and kaomoji by keyword. Use type to filter results.',
  {
    query: z.string().describe('Search keyword (matches id, name, category, tags)'),
    type: z.enum(['art', 'kaomoji', 'all']).default('all').describe('Filter by type: "art", "kaomoji", or "all"'),
  },
  async ({ query, type }) => {
    const parts: string[] = [];

    if (type !== 'kaomoji') {
      const results = search(query);
      const arts = await Promise.all(results.map((e) => toResult(e)));
      const text = arts.map((a) => {
        const desc = a.description ? `\n${a.description}` : '';
        return `--- ${a.name} (${a.id}) [${a.size}w ${a.width}x${a.height}] ---${desc}\n${a.art}`;
      }).join('\n\n');
      if (text) parts.push(text);
    }

    if (type !== 'art') {
      const kaomoji = searchKaomoji(query);
      const text = kaomoji.map((k) => `${k.text}  — ${k.name} [${k.category}]`).join('\n');
      if (text) parts.push(text);
    }

    if (parts.length === 0) {
      return { content: [{ type: 'text', text: `No results found for "${query}"` }] };
    }
    return { content: [{ type: 'text', text: parts.join('\n\n') }] };
  }
);

server.tool(
  'get',
  'Get ASCII art by ID.',
  { id: z.string().describe('Art ID (e.g. "cat", "sun", "heart")') },
  async ({ id }) => {
    const entry = getById(id);
    if (!entry) {
      return { content: [{ type: 'text', text: `ASCII art "${id}" not found` }] };
    }
    const result = await toResult(entry);
    return { content: [{ type: 'text', text: result.art }] };
  }
);

server.tool(
  'random',
  'Get a random ASCII art.',
  {},
  async () => {
    const result = await toResult(getRandom());
    return { content: [{ type: 'text', text: `--- ${result.name} [${result.size}w ${result.width}x${result.height}] ---\n${result.art}` }] };
  }
);

server.tool(
  'list',
  'List all available ASCII arts with metadata.',
  {},
  async () => {
    const items = listAll().map((e) => {
      const desc = e.description ? ` — ${e.description}` : '';
      return `${e.id} — ${e.name} [${e.category}] (${e.size}w: ${e.width}x${e.height})${desc}`;
    });
    return { content: [{ type: 'text', text: items.join('\n') }] };
  }
);

server.tool('categories', 'List all categories.', {}, async () => {
  const cats = listCategories();
  return { content: [{ type: 'text', text: cats.join(', ') }] };
});

server.tool(
  'banner',
  'Render text as a large ASCII banner using FIGlet fonts. Great for CLI headers, welcome messages, and titles.',
  {
    text: z.string().max(50).describe('Text to render (max 50 chars)'),
    font: z.enum(BANNER_FONTS).default('Standard').describe('Font: Standard (default), Small (compact), Slant (italic), Big (bold), Mini (minimal)'),
  },
  async ({ text, font }) => {
    const banner = renderBanner(text, font);
    return { content: [{ type: 'text', text: banner }] };
  }
);

server.tool(
  'kaomoji',
  'Get a kaomoji (Japanese text emoticon) by emotion or keyword. Perfect for inline text expressions.',
  {
    query: z.string().optional().describe('Emotion or keyword (e.g. "happy", "sad", "cat", "shrug"). Omit for random.'),
    category: z.string().optional().describe('Filter by category (e.g. "happy", "animals", "table-flip")'),
  },
  async ({ query, category }) => {
    if (!query && !category) {
      const k = getRandomKaomoji();
      return { content: [{ type: 'text', text: `${k.text}  — ${k.name}` }] };
    }

    let results = query ? searchKaomoji(query) : [];
    if (category) {
      const byCategory = getKaomojiByCategory(category);
      results = results.length > 0
        ? results.filter((r) => r.category === category)
        : byCategory;
    }

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No kaomoji found. Categories: ${listKaomojiCategories().join(', ')}` }] };
    }

    const text = results.map((k) => `${k.text}  — ${k.name} [${k.category}]`).join('\n');
    return { content: [{ type: 'text', text }] };
  }
);

server.tool(
  'style',
  `Style text using Unicode transforms. Styles: ${TEXT_STYLES.join(', ')}.`,
  {
    text: z.string().max(200).describe('Text to style (max 200 chars)'),
    style: z.enum(TEXT_STYLES as [string, ...string[]]).describe('Style to apply'),
  },
  async ({ text, style }) => {
    const styled = styleText(text, style as any);
    return { content: [{ type: 'text', text: styled }] };
  }
);

server.tool(
  'frame',
  `Draw a box/frame around text. Styles: ${FRAME_STYLES.join(', ')}.`,
  {
    text: z.string().max(2000).describe('Text to frame (supports multi-line)'),
    style: z.enum(FRAME_STYLES as [string, ...string[]]).default('single').describe('Border style'),
    padding: z.number().min(0).max(10).default(1).describe('Inner padding (spaces)'),
    align: z.enum(['left', 'center', 'right']).default('left').describe('Text alignment'),
    title: z.string().max(50).optional().describe('Optional title in the top border'),
  },
  async ({ text, style, padding, align, title }) => {
    const result = frame(text, { style: style as any, padding, align: align as any, title });
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'progress',
  `Render ASCII progress bars. Styles: ${PROGRESS_STYLES.join(', ')}.`,
  {
    percent: z.number().min(0).max(100).optional().describe('Completion percentage (0-100). Use for single bar.'),
    items: z.array(z.object({
      label: z.string(),
      percent: z.number().min(0).max(100),
    })).max(20).optional().describe('Multiple labeled progress bars'),
    width: z.number().min(5).max(50).default(20).describe('Bar width in characters'),
    style: z.enum(PROGRESS_STYLES as [string, ...string[]]).default('block').describe('Visual style'),
    label: z.string().max(30).optional().describe('Label for single bar'),
    showPercent: z.boolean().default(true).describe('Show percentage number'),
  },
  async ({ percent, items, width, style, label, showPercent }) => {
    if (items && items.length > 0) {
      const result = renderMultiProgress(items, width, style as any);
      return { content: [{ type: 'text', text: result }] };
    }
    if (percent === undefined) {
      return { content: [{ type: 'text', text: 'Error: provide "percent" or "items"' }], isError: true };
    }
    const result = renderProgress({ percent, width, style: style as any, showPercent, label });
    return { content: [{ type: 'text', text: result }] };
  }
);

server.tool(
  'convert',
  'Convert an image (URL or base64) to ASCII art. Modes: "ascii" (character ramp) or "braille" (2x4 dot grid, higher fidelity).',
  {
    url: z.string().url().optional().describe('Image URL to convert'),
    base64: z.string().optional().describe('Base64-encoded image data'),
    size: sizeSchema,
    mode: z.enum(['ascii', 'braille']).default('ascii').describe('Render mode: "ascii" (character ramp) or "braille" (Unicode dots, 8x resolution)'),
    invert: z.boolean().default(false).describe('Invert brightness'),
    contrast: z.boolean().default(true).describe('Apply auto-contrast'),
    gamma: z.number().min(0.1).max(5).default(1.0).describe('Gamma correction'),
    threshold: z.number().min(0).max(1).default(0.5).describe('Braille mode: brightness threshold for dot activation (0-1)'),
  },
  async ({ url, base64, size, mode, invert, contrast, gamma, threshold }) => {
    if (!url && !base64) {
      return { content: [{ type: 'text', text: 'Error: provide either "url" or "base64"' }], isError: true };
    }
    try {
      const s = Number(size) as ArtSize;
      const { width: maxW, height: maxH } = SIZE_LIMITS[s];
      const source = (url ?? base64)!;
      const buf = await resolveImageInput(source);
      const art = await convertImage(buf, { width: maxW, height: maxH, mode, invert, contrast, gamma, threshold });

      const lines = art.split('\n');
      const artWidth = Math.max(...lines.map((l) => l.length), 0);
      const artHeight = lines.length;

      return { content: [{ type: 'text', text: `--- ${s}w [${artWidth}x${artHeight}] ---\n${art}` }] };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { content: [{ type: 'text', text: `Error: ${e.message ?? 'Conversion failed'}` }], isError: true };
    }
  }
);

const treeNodeSchema: z.ZodType<TreeNode> = z.object({
  label: z.string(),
  children: z.lazy(() => treeNodeSchema.array()).optional(),
});

function validateTreeDepth(node: TreeNode, depth: number): boolean {
  if (depth > MAX_TREE_DEPTH) return false;
  for (const child of node.children ?? []) {
    if (!validateTreeDepth(child, depth + 1)) return false;
  }
  return true;
}

const classDefSchema = z.object({
  name: z.string(),
  properties: z.array(z.string()).optional(),
  methods: z.array(z.string()).optional(),
});

const entitySchema = z.object({
  name: z.string(),
  attributes: z.array(z.string()).optional(),
});

const relationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string(),
});

const ganttTaskSchema = z.object({
  label: z.string(),
  start: z.number().min(0),
  duration: z.number().min(1),
});

server.tool(
  'diagram',
  'Generate ASCII diagrams: flowcharts, boxes, trees, tables, sequence, timeline, bar, class, ER, mindmap, and gantt.',
  {
    type: z.enum(['flowchart', 'box', 'tree', 'table', 'sequence', 'timeline', 'bar', 'class', 'er', 'mindmap', 'gantt']).describe('Diagram type'),
    nodes: z.array(z.string()).max(MAX_DIAGRAM_NODES).optional().describe('Flowchart: list of step labels'),
    title: z.string().optional().describe('Box: title text'),
    lines: z.array(z.string()).optional().describe('Box: body lines'),
    root: z.lazy(() => treeNodeSchema).optional().describe('Tree/Mindmap: root node with label and optional children'),
    headers: z.array(z.string()).optional().describe('Table: column headers'),
    rows: z.array(z.array(z.string())).max(MAX_DIAGRAM_ROWS).optional().describe('Table: data rows'),
    style: z.enum(['unicode', 'rounded', 'ascii']).default('unicode').describe('Border style: unicode (default), rounded, or ascii'),
    actors: z.array(z.string()).max(MAX_SEQUENCE_ACTORS).optional().describe('Sequence: list of actor names'),
    messages: z.array(z.object({ from: z.string(), to: z.string(), label: z.string() })).max(MAX_SEQUENCE_MESSAGES).optional().describe('Sequence: messages between actors'),
    events: z.array(z.object({ label: z.string(), description: z.string() })).max(MAX_TIMELINE_EVENTS).optional().describe('Timeline: list of events with label and description'),
    items: z.array(z.object({ label: z.string(), value: z.number() })).max(MAX_BAR_ITEMS).optional().describe('Bar: list of items with label and numeric value'),
    maxWidth: z.number().min(1).max(MAX_BAR_WIDTH).optional().describe('Bar: maximum bar width in characters (default 20)'),
    classes: z.array(classDefSchema).max(MAX_DIAGRAM_NODES).optional().describe('Class: list of classes with name, properties, methods'),
    entities: z.array(entitySchema).max(MAX_DIAGRAM_NODES).optional().describe('ER: list of entities with name and attributes'),
    relationships: z.array(relationshipSchema).max(MAX_SEQUENCE_MESSAGES).optional().describe('ER: relationships between entities (from, to, label like "1:N")'),
    tasks: z.array(ganttTaskSchema).max(MAX_DIAGRAM_ROWS).optional().describe('Gantt: tasks with label, start position, and duration'),
    unitLabel: z.string().optional().describe('Gantt: label for time units (e.g. "weeks", "sprints")'),
  },
  async ({ type, nodes, title, lines, root, headers, rows, style, actors, messages, events, items, maxWidth, classes, entities, relationships, tasks, unitLabel }) => {
    try {
      let input;
      switch (type) {
        case 'flowchart':
          if (!nodes || nodes.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "nodes" is required for flowchart' }], isError: true };
          }
          input = { type: 'flowchart' as const, nodes, style };
          break;
        case 'box':
          if (!title) {
            return { content: [{ type: 'text', text: 'Error: "title" is required for box' }], isError: true };
          }
          input = { type: 'box' as const, title, lines: lines ?? [], style };
          break;
        case 'tree':
          if (!root) {
            return { content: [{ type: 'text', text: 'Error: "root" is required for tree' }], isError: true };
          }
          if (!validateTreeDepth(root, 1)) {
            return { content: [{ type: 'text', text: `Error: tree depth exceeds maximum of ${MAX_TREE_DEPTH}` }], isError: true };
          }
          input = { type: 'tree' as const, root };
          break;
        case 'table':
          if (!headers || headers.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "headers" is required for table' }], isError: true };
          }
          input = { type: 'table' as const, headers, rows: rows ?? [], style };
          break;
        case 'sequence':
          if (!actors || actors.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "actors" is required for sequence' }], isError: true };
          }
          if (!messages || messages.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "messages" is required for sequence' }], isError: true };
          }
          for (const msg of messages) {
            if (!actors.includes(msg.from)) {
              return { content: [{ type: 'text', text: `Error: actor "${msg.from}" not in actors list` }], isError: true };
            }
            if (!actors.includes(msg.to)) {
              return { content: [{ type: 'text', text: `Error: actor "${msg.to}" not in actors list` }], isError: true };
            }
          }
          input = { type: 'sequence' as const, actors, messages };
          break;
        case 'timeline':
          if (!events || events.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "events" is required for timeline' }], isError: true };
          }
          input = { type: 'timeline' as const, events };
          break;
        case 'bar':
          if (!items || items.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "items" is required for bar' }], isError: true };
          }
          input = { type: 'bar' as const, items, maxWidth };
          break;
        case 'class':
          if (!classes || classes.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "classes" is required for class diagram' }], isError: true };
          }
          input = { type: 'class' as const, classes, style };
          break;
        case 'er':
          if (!entities || entities.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "entities" is required for ER diagram' }], isError: true };
          }
          input = { type: 'er' as const, entities, relationships: relationships ?? [] };
          break;
        case 'mindmap':
          if (!root) {
            return { content: [{ type: 'text', text: 'Error: "root" is required for mindmap' }], isError: true };
          }
          if (!validateTreeDepth(root, 1)) {
            return { content: [{ type: 'text', text: `Error: tree depth exceeds maximum of ${MAX_TREE_DEPTH}` }], isError: true };
          }
          input = { type: 'mindmap' as const, root };
          break;
        case 'gantt':
          if (!tasks || tasks.length === 0) {
            return { content: [{ type: 'text', text: 'Error: "tasks" is required for gantt chart' }], isError: true };
          }
          input = { type: 'gantt' as const, tasks, unitLabel };
          break;
      }
      const diagram = renderDiagram(input);
      return { content: [{ type: 'text', text: diagram }] };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { content: [{ type: 'text', text: `Error: ${e.message ?? 'Diagram generation failed'}` }], isError: true };
    }
  }
);

async function main() {
  await Promise.all([loadIndex(), loadKaomoji()]);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
