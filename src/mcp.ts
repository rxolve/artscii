#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, listAll, toResult, addArt, deleteArt } from './store.js';
import { loadKaomoji, searchKaomoji, getRandomKaomoji, listKaomojiCategories, getKaomojiByCategory, toKaomojiResult } from './kaomoji.js';
import { MAX_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, MAX_DESCRIPTION_LENGTH } from './constants.js';
import { resolveImageInput, convertBothSizes } from './converter.js';
import type { ArtWidth } from './types.js';

const server = new McpServer({
  name: 'artscii',
  version: '0.1.0',
});

const widthSchema = z.enum(['64', '32']).default('64').describe('Art width: "64" (default) or "32" (compact)');

server.tool(
  'search',
  'Search ASCII art and kaomoji by keyword. Use type to filter results.',
  {
    query: z.string().describe('Search keyword (matches id, name, category, tags)'),
    type: z.enum(['art', 'kaomoji', 'all']).default('all').describe('Filter by type: "art", "kaomoji", or "all"'),
    width: widthSchema,
  },
  async ({ query, type, width }) => {
    const parts: string[] = [];

    if (type !== 'kaomoji') {
      const w = Number(width) as ArtWidth;
      const results = search(query);
      const arts = await Promise.all(results.map((e) => toResult(e, w)));
      const text = arts.map((a) => {
        const desc = a.description ? `\n${a.description}` : '';
        return `--- ${a.name} (${a.id}) [${a.width}x${a.height}] ---${desc}\n${a.art}`;
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
  { id: z.string().describe('Art ID (e.g. "cat", "sun", "heart")'), width: widthSchema },
  async ({ id, width }) => {
    const w = Number(width) as ArtWidth;
    const entry = getById(id);
    if (!entry) {
      return { content: [{ type: 'text', text: `ASCII art "${id}" not found` }] };
    }
    const result = await toResult(entry, w);
    return { content: [{ type: 'text', text: result.art }] };
  }
);

server.tool(
  'random',
  'Get a random ASCII art.',
  { width: widthSchema },
  async ({ width }) => {
    const w = Number(width) as ArtWidth;
    const result = await toResult(getRandom(), w);
    return { content: [{ type: 'text', text: `--- ${result.name} [${result.width}x${result.height}] ---\n${result.art}` }] };
  }
);

server.tool(
  'list',
  'List all available ASCII arts with metadata.',
  {},
  async () => {
    const items = listAll().map((e) => {
      const desc = e.description ? ` — ${e.description}` : '';
      return `${e.id} — ${e.name} [${e.category}] (64w: ${e.width}x${e.height}, 32w: ${e.width32}x${e.height32})${desc}`;
    });
    return { content: [{ type: 'text', text: items.join('\n') }] };
  }
);

server.tool('categories', 'List all categories.', {}, async () => {
  const cats = listCategories();
  return { content: [{ type: 'text', text: cats.join(', ') }] };
});

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
  'Submit a new ASCII art. Art must fit within 64x32 chars (64w) and optionally 32x16 chars (32w).',
  {
    name: z.string().max(MAX_NAME_LENGTH).describe('Art name (max 30 chars)'),
    description: z.string().max(MAX_DESCRIPTION_LENGTH).optional().describe('When to use this art (e.g. "Use when celebrating success")'),
    category: z.string().max(MAX_NAME_LENGTH).describe('Category (e.g. "animals", "nature")'),
    tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS).describe('Tags (max 5, each max 20 chars)'),
    art: z.string().describe('ASCII art content (max 64 chars wide, 32 lines tall)'),
    art32: z.string().optional().describe('Optional 32w compact variant (max 32 chars wide, 16 lines tall)'),
  },
  async ({ name, description, category, tags, art, art32 }) => {
    try {
      const entry = await addArt({ name, description, category: category.toLowerCase(), tags, art, art32 });
      return { content: [{ type: 'text', text: `Submitted "${entry.name}" as "${entry.id}" [${entry.width}x${entry.height}]` }] };
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
  'Convert an image (URL or base64) to ASCII art.',
  {
    url: z.string().url().optional().describe('Image URL to convert'),
    base64: z.string().optional().describe('Base64-encoded image data (with or without data URI prefix)'),
    invert: z.boolean().default(false).describe('Invert brightness'),
    contrast: z.boolean().default(true).describe('Apply auto-contrast'),
    gamma: z.number().min(0.1).max(5).default(1.0).describe('Gamma correction (>1 brighter, <1 darker)'),
    save: z.object({
      name: z.string().max(MAX_NAME_LENGTH),
      description: z.string().max(MAX_DESCRIPTION_LENGTH).optional(),
      category: z.string().max(MAX_NAME_LENGTH),
      tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS),
    }).optional().describe('Save the converted art to the store'),
  },
  async ({ url, base64, invert, contrast, gamma, save }) => {
    if (!url && !base64) {
      return { content: [{ type: 'text', text: 'Error: provide either "url" or "base64"' }], isError: true };
    }
    try {
      const source = (url ?? base64)!;
      const buf = await resolveImageInput(source);
      const result = await convertBothSizes(buf, { invert, contrast, gamma });

      let savedMsg = '';
      if (save) {
        const entry = await addArt({
          name: save.name,
          description: save.description,
          category: save.category.toLowerCase(),
          tags: save.tags,
          art: result.art64,
          art32: result.art32,
        });
        savedMsg = `\n\nSaved as "${entry.id}" [${entry.width}x${entry.height}]`;
      }

      const text = `--- 64w [${result.width64}x${result.height64}] ---\n${result.art64}\n\n--- 32w [${result.width32}x${result.height32}] ---\n${result.art32}${savedMsg}`;
      return { content: [{ type: 'text', text }] };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { content: [{ type: 'text', text: `Error: ${e.message ?? 'Conversion failed'}` }], isError: true };
    }
  }
);

async function main() {
  await Promise.all([loadIndex(), loadKaomoji()]);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
