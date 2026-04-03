import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { loadIndex, search, getById, getByCategory, getRandom, listCategories, listAll, toResult, addArt, deleteArt } from './store.js';
import { MAX_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, MAX_DESCRIPTION_LENGTH } from './constants.js';
import { RATE_LIMIT_PER_MIN } from './constants.js';
import type { ArtWidth } from './types.js';

const app = new Hono();

app.use('*', cors());

function parseWidth(raw: string | undefined): ArtWidth {
  return raw === '32' ? 32 : 64;
}

// Rate limit: IP -> timestamps within the last minute
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < window);
  if (timestamps.length >= RATE_LIMIT_PER_MIN) {
    rateLimitMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
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
    ...(e.description && { description: e.description }),
    category: e.category,
    tags: e.tags,
    width: e.width,
    height: e.height,
    width32: e.width32,
    height32: e.height32,
  })));
});

app.post('/art', async (c) => {
  const ip = getClientIp(c);
  if (!checkRateLimit(ip)) return c.json({ error: 'Rate limit exceeded (5/min)' }, 429);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const { name, description, category, tags, art, art32 } = body;

  if (typeof name !== 'string' || !name.trim()) return c.json({ error: '"name" is required' }, 400);
  if (name.length > MAX_NAME_LENGTH) return c.json({ error: `"name" exceeds ${MAX_NAME_LENGTH} characters` }, 400);
  if (description !== undefined && typeof description !== 'string') return c.json({ error: '"description" must be a string' }, 400);
  if (typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) return c.json({ error: `"description" exceeds ${MAX_DESCRIPTION_LENGTH} characters` }, 400);
  if (typeof category !== 'string' || !category.trim()) return c.json({ error: '"category" is required' }, 400);
  if (category.length > MAX_NAME_LENGTH) return c.json({ error: `"category" exceeds ${MAX_NAME_LENGTH} characters` }, 400);
  if (!Array.isArray(tags)) return c.json({ error: '"tags" must be an array' }, 400);
  if (tags.length > MAX_TAGS) return c.json({ error: `Max ${MAX_TAGS} tags allowed` }, 400);
  if (tags.some((t: unknown) => typeof t !== 'string' || t.length > MAX_TAG_LENGTH)) {
    return c.json({ error: `Each tag must be a string of max ${MAX_TAG_LENGTH} chars` }, 400);
  }
  if (typeof art !== 'string' || !art.trim()) return c.json({ error: '"art" is required' }, 400);
  if (art32 !== undefined && typeof art32 !== 'string') return c.json({ error: '"art32" must be a string' }, 400);

  try {
    const entry = await addArt({ name: name.trim(), description: description?.trim(), category: category.trim().toLowerCase(), tags, art, art32 });
    const result = await toResult(entry);
    return c.json(result, 201);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return c.json({ error: e.message ?? 'Unknown error' }, (e.status as 400) ?? 500);
  }
});

app.delete('/art/:id', async (c) => {
  const ip = getClientIp(c);
  if (!checkRateLimit(ip)) return c.json({ error: 'Rate limit exceeded (5/min)' }, 429);

  const id = c.req.param('id');
  try {
    const deleted = await deleteArt(id);
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return c.json({ error: e.message ?? 'Unknown error' }, (e.status as 403) ?? 500);
  }
});

async function main() {
  await loadIndex();
  const port = Number(process.env.PORT) || 3001;
  console.log(`artscii listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main();
