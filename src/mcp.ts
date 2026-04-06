#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, listAll, toResult, addArt, deleteArt } from './store.js';
import { loadKaomoji, searchKaomoji, getRandomKaomoji, listKaomojiCategories, getKaomojiByCategory, toKaomojiResult } from './kaomoji.js';
import { MAX_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, MAX_DESCRIPTION_LENGTH, SIZE_LIMITS, DEFAULT_SIZE } from './constants.js';
import { resolveImageInput } from './resolve.js';
import { convertImage } from './converter.js';
import { renderBanner, BANNER_FONTS } from './banner.js';
import { renderDiagram, listDiagramTypes, type TreeNode } from './diagram.js';
import { MAX_DIAGRAM_NODES, MAX_DIAGRAM_ROWS, MAX_TREE_DEPTH } from './constants.js';
import type { ArtSize } from './types.js';

const server = new McpServer({
  name: 'artscii',
  version: '0.3.0',
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
  'submit',
  'Submit a new ASCII art. Size tiers: 16w (16x8), 32w (32x16), 64w (64x32).',
  {
    name: z.string().max(MAX_NAME_LENGTH).describe('Art name (max 30 chars)'),
    description: z.string().max(MAX_DESCRIPTION_LENGTH).optional().describe('When to use this art'),
    category: z.string().max(MAX_NAME_LENGTH).describe('Category (e.g. "animals", "nature")'),
    tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS).describe('Tags (max 5, each max 20 chars)'),
    size: sizeSchema,
    art: z.string().describe('ASCII art content'),
  },
  async ({ name, description, category, tags, size, art }) => {
    try {
      const s = Number(size) as ArtSize;
      const entry = await addArt({ name, description, category: category.toLowerCase(), tags, size: s, art });
      return { content: [{ type: 'text', text: `Submitted "${entry.name}" as "${entry.id}" [${entry.size}w ${entry.width}x${entry.height}]` }] };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { content: [{ type: 'text', text: `Error: ${e.message ?? 'Unknown error'}` }], isError: true };
    }
  }
);

server.tool(
  'delete',
  'Delete a user-submitted ASCII art by ID. Built-in arts cannot be deleted.',
  { id: z.string().describe('Art ID to delete') },
  async ({ id }) => {
    try {
      const deleted = await deleteArt(id);
      if (!deleted) {
        return { content: [{ type: 'text', text: `Art "${id}" not found` }], isError: true };
      }
      return { content: [{ type: 'text', text: `Deleted "${deleted.name}" (${id})` }] };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { content: [{ type: 'text', text: `Error: ${e.message ?? 'Unknown error'}` }], isError: true };
    }
  }
);

server.tool(
  'convert',
  'Convert an image (URL or base64) to ASCII art at a specific size tier.',
  {
    url: z.string().url().optional().describe('Image URL to convert'),
    base64: z.string().optional().describe('Base64-encoded image data'),
    size: sizeSchema,
    invert: z.boolean().default(false).describe('Invert brightness'),
    contrast: z.boolean().default(true).describe('Apply auto-contrast'),
    gamma: z.number().min(0.1).max(5).default(1.0).describe('Gamma correction'),
    save: z.object({
      name: z.string().max(MAX_NAME_LENGTH),
      description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
      category: z.string().max(MAX_NAME_LENGTH),
      tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS),
    }).optional().describe('Save the converted art to the store'),
  },
  async ({ url, base64, size, invert, contrast, gamma, save }) => {
    if (!url && !base64) {
      return { content: [{ type: 'text', text: 'Error: provide either "url" or "base64"' }], isError: true };
    }
    try {
      const s = Number(size) as ArtSize;
      const { width: maxW, height: maxH } = SIZE_LIMITS[s];
      const source = (url ?? base64)!;
      const buf = await resolveImageInput(source);
      const art = await convertImage(buf, { width: maxW, height: maxH, invert, contrast, gamma });

      const lines = art.split('\n');
      const artWidth = Math.max(...lines.map((l) => l.length), 0);
      const artHeight = lines.length;

      let savedMsg = '';
      if (save) {
        const entry = await addArt({
          name: save.name,
          description: save.description,
          category: save.category.toLowerCase(),
          tags: save.tags,
          size: s,
          art,
        });
        savedMsg = `\n\nSaved as "${entry.id}" [${entry.size}w ${entry.width}x${entry.height}]`;
      }

      const text = `--- ${s}w [${artWidth}x${artHeight}] ---\n${art}${savedMsg}`;
      return { content: [{ type: 'text', text }] };
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

server.tool(
  'diagram',
  'Generate ASCII diagrams: flowcharts, boxes, trees, and tables. Use style to change border characters.',
  {
    type: z.enum(['flowchart', 'box', 'tree', 'table']).describe('Diagram type'),
    nodes: z.array(z.string()).max(MAX_DIAGRAM_NODES).optional().describe('Flowchart: list of step labels'),
    title: z.string().optional().describe('Box: title text'),
    lines: z.array(z.string()).optional().describe('Box: body lines'),
    root: z.lazy(() => treeNodeSchema).optional().describe('Tree: root node with label and optional children'),
    headers: z.array(z.string()).optional().describe('Table: column headers'),
    rows: z.array(z.array(z.string())).max(MAX_DIAGRAM_ROWS).optional().describe('Table: data rows'),
    style: z.enum(['unicode', 'rounded', 'ascii']).default('unicode').describe('Border style: unicode (default), rounded, or ascii'),
  },
  async ({ type, nodes, title, lines, root, headers, rows, style }) => {
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
