import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { loadIndex, search, getById, getRandom, listCategories, toResult } from './store.js';

const server = new McpServer({
  name: 'artscii',
  version: '0.1.0',
});

server.tool('search', 'Search ASCII art by keyword', { query: z.string() }, async ({ query }) => {
  const results = search(query);
  if (results.length === 0) {
    return { content: [{ type: 'text', text: `No ASCII art found for "${query}"` }] };
  }
  const arts = await Promise.all(results.map(toResult));
  const text = arts.map((a) => `--- ${a.name} (${a.id}) ---\n${a.art}`).join('\n\n');
  return { content: [{ type: 'text', text }] };
});

server.tool('get', 'Get ASCII art by ID', { id: z.string() }, async ({ id }) => {
  const entry = getById(id);
  if (!entry) {
    return { content: [{ type: 'text', text: `ASCII art "${id}" not found` }] };
  }
  const result = await toResult(entry);
  return { content: [{ type: 'text', text: result.art }] };
});

server.tool('random', 'Get a random ASCII art', {}, async () => {
  const result = await toResult(getRandom());
  return { content: [{ type: 'text', text: `--- ${result.name} ---\n${result.art}` }] };
});

server.tool('categories', 'List all categories', {}, async () => {
  const cats = listCategories();
  return { content: [{ type: 'text', text: cats.join(', ') }] };
});

async function main() {
  await loadIndex();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
