import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { loadIndex, search, getById, getByCategory, getRandom, listCategories, listAll, toResult } from './store.js';
import type { ArtWidth } from './types.js';

const app = new Hono();

app.use('*', cors());

function parseWidth(raw: string | undefined): ArtWidth {
  return raw === '32' ? 32 : 64;
}

app.get('/', (c) =>
  c.json({
    name: 'artscii',
    version: '0.1.0',
    description: 'ASCII art search API. Use ?width=32 for compact variant.',
    endpoints: {
      search: 'GET /search?q={query}&width=64|32',
      art: 'GET /art/:id?width=64|32',
      artRaw: 'GET /art/:id/raw?width=64|32',
      random: 'GET /random?width=64|32',
      categories: 'GET /categories',
      category: 'GET /categories/:name?width=64|32',
      list: 'GET /list',
    },
  })
);

app.get('/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'query parameter "q" is required' }, 400);
  const w = parseWidth(c.req.query('width'));
  const results = search(q);
  const arts = await Promise.all(results.map((e) => toResult(e, w)));
  return c.json(arts);
});

app.get('/art/:id', async (c) => {
  const entry = getById(c.req.param('id'));
  if (!entry) return c.json({ error: 'not found' }, 404);
  const w = parseWidth(c.req.query('width'));
  return c.json(await toResult(entry, w));
});

app.get('/art/:id/raw', async (c) => {
  const entry = getById(c.req.param('id'));
  if (!entry) return c.text('not found', 404);
  const w = parseWidth(c.req.query('width'));
  const result = await toResult(entry, w);
  return c.text(result.art);
});

app.get('/random', async (c) => {
  const w = parseWidth(c.req.query('width'));
  return c.json(await toResult(getRandom(), w));
});

app.get('/categories', (c) => {
  return c.json(listCategories());
});

app.get('/categories/:name', async (c) => {
  const results = getByCategory(c.req.param('name'));
  if (results.length === 0) return c.json({ error: 'category not found' }, 404);
  const w = parseWidth(c.req.query('width'));
  const arts = await Promise.all(results.map((e) => toResult(e, w)));
  return c.json(arts);
});

app.get('/list', (c) => {
  return c.json(listAll().map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    tags: e.tags,
    width: e.width,
    height: e.height,
    width32: e.width32,
    height32: e.height32,
  })));
});

async function main() {
  await loadIndex();
  const port = Number(process.env.PORT) || 3001;
  console.log(`artscii listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main();
