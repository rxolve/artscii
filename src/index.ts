import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { loadIndex, search, getById, getByCategory, getRandom, listCategories, listAll, toResult, addArt, deleteArt } from './store.js';
import { loadKaomoji, searchKaomoji, getKaomojiById, getKaomojiByCategory, getRandomKaomoji, listKaomojiCategories, listAllKaomoji, toKaomojiResult } from './kaomoji.js';
import { MAX_NAME_LENGTH, MAX_TAG_LENGTH, MAX_TAGS, MAX_DESCRIPTION_LENGTH, CONVERT_RATE_LIMIT_PER_MIN, RATE_LIMIT_PER_MIN } from './constants.js';
import { resolveImageInput, convertBothSizes, ConvertInputError } from './converter.js';
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
    description: 'ASCII art & kaomoji search API. Use ?type=art|kaomoji to filter, ?width=32 for compact art.',
    endpoints: {
      search: 'GET /search?q={query}&type=art|kaomoji&width=64|32',
      art: 'GET /art/:id?width=64|32',
      artRaw: 'GET /art/:id/raw?width=64|32',
      random: 'GET /random?width=64|32',
      categories: 'GET /categories',
      category: 'GET /categories/:name?width=64|32',
      list: 'GET /list',
      convert: 'POST /convert { url?, base64?, invert?, contrast?, gamma?, save? }',
      kaomoji: 'GET /kaomoji?q={query}',
      kaomojiRandom: 'GET /kaomoji/random',
      kaomojiCategories: 'GET /kaomoji/categories',
      kaomojiCategory: 'GET /kaomoji/categories/:name',
    },
  })
);

app.get('/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'query parameter "q" is required' }, 400);
  const type = c.req.query('type');
  const w = parseWidth(c.req.query('width'));

  if (type === 'kaomoji') {
    return c.json(searchKaomoji(q).map(toKaomojiResult));
  }
  if (type === 'art') {
    const arts = await Promise.all(search(q).map((e) => toResult(e, w)));
    return c.json(arts);
  }
  // No type filter: return both
  const arts = await Promise.all(search(q).map((e) => toResult(e, w)));
  const kaomoji = searchKaomoji(q).map(toKaomojiResult);
  return c.json([...arts, ...kaomoji]);
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

// --- Kaomoji endpoints ---

app.get('/kaomoji', (c) => {
  const q = c.req.query('q');
  if (q) {
    return c.json(searchKaomoji(q).map(toKaomojiResult));
  }
  return c.json(listAllKaomoji().map(toKaomojiResult));
});

app.get('/kaomoji/random', (c) => {
  return c.json(toKaomojiResult(getRandomKaomoji()));
});

app.get('/kaomoji/categories', (c) => {
  return c.json(listKaomojiCategories());
});

app.get('/kaomoji/categories/:name', (c) => {
  const results = getKaomojiByCategory(c.req.param('name'));
  if (results.length === 0) return c.json({ error: 'category not found' }, 404);
  return c.json(results.map(toKaomojiResult));
});

// Separate rate limiter for convert (CPU-intensive)
const convertRateLimitMap = new Map<string, number[]>();

function checkConvertRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const timestamps = (convertRateLimitMap.get(ip) ?? []).filter((t) => now - t < window);
  if (timestamps.length >= CONVERT_RATE_LIMIT_PER_MIN) {
    convertRateLimitMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  convertRateLimitMap.set(ip, timestamps);
  return true;
}

app.post('/convert', async (c) => {
  const ip = getClientIp(c);
  if (!checkConvertRateLimit(ip)) return c.json({ error: 'Rate limit exceeded (3/min)' }, 429);

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

  const { url, base64, invert, contrast, gamma, save } = body;

  if (url !== undefined && typeof url !== 'string') return c.json({ error: '"url" must be a string' }, 400);
  if (base64 !== undefined && typeof base64 !== 'string') return c.json({ error: '"base64" must be a string' }, 400);
  if (!url && !base64) return c.json({ error: '"url" or "base64" is required' }, 400);
  if (invert !== undefined && typeof invert !== 'boolean') return c.json({ error: '"invert" must be a boolean' }, 400);
  if (contrast !== undefined && typeof contrast !== 'boolean') return c.json({ error: '"contrast" must be a boolean' }, 400);
  if (gamma !== undefined && (typeof gamma !== 'number' || gamma < 0.1 || gamma > 5)) return c.json({ error: '"gamma" must be a number between 0.1 and 5' }, 400);

  // Validate save fields upfront
  if (save && typeof save === 'object') {
    const { name, description, category, tags } = save as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) return c.json({ error: 'save.name is required' }, 400);
    if ((name as string).length > MAX_NAME_LENGTH) return c.json({ error: `save.name exceeds ${MAX_NAME_LENGTH} characters` }, 400);
    if (description !== undefined && typeof description !== 'string') return c.json({ error: 'save.description must be a string' }, 400);
    if (typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) return c.json({ error: `save.description exceeds ${MAX_DESCRIPTION_LENGTH} characters` }, 400);
    if (typeof category !== 'string' || !category.trim()) return c.json({ error: 'save.category is required' }, 400);
    if ((category as string).length > MAX_NAME_LENGTH) return c.json({ error: `save.category exceeds ${MAX_NAME_LENGTH} characters` }, 400);
    if (!Array.isArray(tags)) return c.json({ error: 'save.tags must be an array' }, 400);
    if ((tags as unknown[]).length > MAX_TAGS) return c.json({ error: `save.tags: max ${MAX_TAGS} tags allowed` }, 400);
    if ((tags as unknown[]).some((t) => typeof t !== 'string' || (t as string).length > MAX_TAG_LENGTH)) {
      return c.json({ error: `save.tags: each tag must be a string of max ${MAX_TAG_LENGTH} chars` }, 400);
    }
  }

  try {
    const source = (url ?? base64) as string;
    const buf = await resolveImageInput(source);
    const result = await convertBothSizes(buf, {
      invert: invert ?? false,
      contrast: contrast ?? true,
      gamma: gamma ?? 1.0,
    });

    // Optionally save to store
    if (save && typeof save === 'object') {
      const { name, description, category, tags } = save as {
        name: string;
        description?: string;
        category: string;
        tags: string[];
      };
      const entry = await addArt({
        name: name.trim(),
        description: description?.trim(),
        category: category.trim().toLowerCase(),
        tags,
        art: result.art64,
        art32: result.art32,
      });
      return c.json({ ...result, saved: { id: entry.id, name: entry.name } }, 201);
    }

    return c.json(result);
  } catch (err: unknown) {
    if (err instanceof ConvertInputError) {
      return c.json({ error: err.message }, 400);
    }
    const e = err as { status?: number; message?: string };
    return c.json({ error: e.message ?? 'Conversion failed' }, (e.status as 400) ?? 500);
  }
});

async function main() {
  await Promise.all([loadIndex(), loadKaomoji()]);
  const port = Number(process.env.PORT) || 3001;
  console.log(`artscii listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main();
