import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, listAll, toResult, addArt, deleteArt } from './store.js';
import { MAX_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAGS } from './constants.js';
import type { ArtWidth } from './types.js';

const server = new McpServer({
  name: 'artscii',
  version: '0.1.0',
});

const widthSchema = z.enum(['64', '32']).default('64').describe('Art width: "64" (default) or "32" (compact)');

server.tool(
  'search',
  'Search ASCII art by keyword. Returns matching arts with content.',
  { query: z.string().describe('Search keyword (matches id, name, category, tags)'), width: widthSchema },
  async ({ query, width }) => {
    const w = Number(width) as ArtWidth;
    const results = search(query);
    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No ASCII art found for "${query}"` }] };
    }
    const arts = await Promise.all(results.map((e) => toResult(e, w)));
    const text = arts.map((a) => `--- ${a.name} (${a.id}) [${a.width}x${a.height}] ---\n${a.art}`).join('\n\n');
    return { content: [{ type: 'text', text }] };
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
    const items = listAll().map((e) => `${e.id} — ${e.name} [${e.category}] (64w: ${e.width}x${e.height}, 32w: ${e.width32}x${e.height32})`);
    return { content: [{ type: 'text', text: items.join('\n') }] };
  }
);

server.tool('categories', 'List all categories.', {}, async () => {
  const cats = listCategories();
  return { content: [{ type: 'text', text: cats.join(', ') }] };
});

server.tool(
  'submit',
  'Submit a new ASCII art. Art must fit within 64x32 chars (64w) and optionally 32x16 chars (32w).',
  {
    name: z.string().max(MAX_NAME_LENGTH).describe('Art name (max 30 chars)'),
    category: z.string().max(MAX_NAME_LENGTH).describe('Category (e.g. "animals", "nature")'),
    tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS).describe('Tags (max 5, each max 20 chars)'),
    art: z.string().describe('ASCII art content (max 64 chars wide, 32 lines tall)'),
    art32: z.string().optional().describe('Optional 32w compact variant (max 32 chars wide, 16 lines tall)'),
  },
  async ({ name, category, tags, art, art32 }) => {
    try {
      const entry = await addArt({ name, category: category.toLowerCase(), tags, art, art32 });
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

async function main() {
  await loadIndex();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
