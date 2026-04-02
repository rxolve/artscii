import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { loadIndex, search, getById, getByCategory, getRandom, listCategories, listAll, toResult } from './store.js';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) =>
  c.json({
    name: 'artscii',
    version: '0.1.0',
    endpoints: {
      search: 'GET /search?q={query}',
      art: 'GET /art/:id',
      random: 'GET /random',
      categories: 'GET /categories',
      category: 'GET /categories/:name',
      list: 'GET /list',
    },
  })
);

app.get('/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'query parameter "q" is required' }, 400);
  const results = search(q);
  const arts = await Promise.all(results.map(toResult));
  return c.json(arts);
});

app.get('/art/:id', async (c) => {
  const entry = getById(c.req.param('id'));
  if (!entry) return c.json({ error: 'not found' }, 404);
  return c.json(await toResult(entry));
});

app.get('/art/:id/raw', async (c) => {
  const entry = getById(c.req.param('id'));
  if (!entry) return c.text('not found', 404);
  const result = await toResult(entry);
  return c.text(result.art);
});

app.get('/random', async (c) => {
  return c.json(await toResult(getRandom()));
});

app.get('/categories', (c) => {
  return c.json(listCategories());
});

app.get('/categories/:name', async (c) => {
  const results = getByCategory(c.req.param('name'));
  if (results.length === 0) return c.json({ error: 'category not found' }, 404);
  const arts = await Promise.all(results.map(toResult));
  return c.json(arts);
});

app.get('/list', (c) => {
  return c.json(listAll().map(({ id, name, category, tags, width, height }) => ({ id, name, category, tags, width, height })));
});

async function main() {
  await loadIndex();
  const port = Number(process.env.PORT) || 3001;
  console.log(`artscii listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main();
