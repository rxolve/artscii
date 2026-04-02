import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, listAll, toResult } from './store.js';
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

async function main() {
  await loadIndex();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
