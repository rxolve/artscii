import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { MAX_WIDTH, MAX_HEIGHT, COMPACT_WIDTH, COMPACT_HEIGHT, MAX_USER_ARTS } from './constants.js';
import type { ArtEntry, ArtResult, ArtWidth } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTS_DIR = path.join(__dirname, '..', 'arts');

let entries: ArtEntry[] = [];

export function validateArt(content: string, maxWidth: number, maxHeight: number): boolean {
  const lines = content.replace(/\n$/, '').split('\n');
  if (lines.length > maxHeight) return false;
  return lines.every((line) => line.length <= maxWidth);
}

export async function loadIndex(): Promise<void> {
  const raw = await fs.readFile(path.join(ARTS_DIR, 'index.json'), 'utf-8');
  entries = JSON.parse(raw);

  for (const entry of entries) {
    // Validate 64w
    const content = await fs.readFile(path.join(ARTS_DIR, entry.file), 'utf-8');
    if (!validateArt(content, MAX_WIDTH, MAX_HEIGHT)) {
      console.warn(`[artscii] WARNING: "${entry.id}" exceeds 64w spec (max ${MAX_WIDTH}x${MAX_HEIGHT})`);
    }

    // Validate 32w
    try {
      const compact = await fs.readFile(path.join(ARTS_DIR, entry.file32), 'utf-8');
      if (!validateArt(compact, COMPACT_WIDTH, COMPACT_HEIGHT)) {
        console.warn(`[artscii] WARNING: "${entry.id}" 32w exceeds spec (max ${COMPACT_WIDTH}x${COMPACT_HEIGHT})`);
      }
    } catch {
      console.warn(`[artscii] WARNING: "${entry.id}" missing 32w file: ${entry.file32}`);
    }
  }
}

export async function readArt(entry: ArtEntry, width: ArtWidth = 64): Promise<string> {
  const file = width === 32 ? entry.file32 : entry.file;
  return fs.readFile(path.join(ARTS_DIR, file), 'utf-8');
}

export function search(query: string): ArtEntry[] {
  const q = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.id.includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.category.includes(q) ||
      e.tags.some((t) => t.includes(q)) ||
      e.description?.toLowerCase().includes(q)
  );
}

export function getById(id: string): ArtEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function getByCategory(category: string): ArtEntry[] {
  return entries.filter((e) => e.category === category);
}

export function getRandom(): ArtEntry {
  return entries[Math.floor(Math.random() * entries.length)];
}

export function listCategories(): string[] {
  return [...new Set(entries.map((e) => e.category))];
}

export function listAll(): ArtEntry[] {
  return entries;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function measureArt(content: string): { width: number; height: number } {
  const lines = content.replace(/\n$/, '').split('\n');
  const height = lines.length;
  const width = Math.max(...lines.map((l) => l.length));
  return { width, height };
}

export async function saveIndex(): Promise<void> {
  await fs.writeFile(path.join(ARTS_DIR, 'index.json'), JSON.stringify(entries, null, 2) + '\n', 'utf-8');
}

export async function addArt(input: {
  name: string;
  description?: string;
  category: string;
  tags: string[];
  art: string;
  art32?: string;
}): Promise<ArtEntry> {
  const id = toSlug(input.name);
  if (!id) throw { status: 400, message: 'Invalid name: produces empty slug' };
  if (getById(id)) throw { status: 409, message: `Art "${id}" already exists` };

  const userCount = entries.filter((e) => e.userSubmitted).length;
  if (userCount >= MAX_USER_ARTS) throw { status: 507, message: `User art limit reached (${MAX_USER_ARTS})` };

  if (!validateArt(input.art, MAX_WIDTH, MAX_HEIGHT)) {
    throw { status: 400, message: `Art exceeds 64w spec (max ${MAX_WIDTH}x${MAX_HEIGHT})` };
  }

  const { width, height } = measureArt(input.art);

  let width32 = 0;
  let height32 = 0;
  if (input.art32) {
    if (!validateArt(input.art32, COMPACT_WIDTH, COMPACT_HEIGHT)) {
      throw { status: 400, message: `art32 exceeds 32w spec (max ${COMPACT_WIDTH}x${COMPACT_HEIGHT})` };
    }
    const m = measureArt(input.art32);
    width32 = m.width;
    height32 = m.height;
  }

  const dir = path.join(ARTS_DIR, input.category);
  await fs.mkdir(dir, { recursive: true });

  const file = `${input.category}/${id}.txt`;
  await fs.writeFile(path.join(ARTS_DIR, file), input.art, 'utf-8');

  const file32 = `${input.category}/${id}.32w.txt`;
  if (input.art32) {
    await fs.writeFile(path.join(ARTS_DIR, file32), input.art32, 'utf-8');
  }

  const entry: ArtEntry = {
    id,
    name: input.name,
    ...(input.description && { description: input.description }),
    category: input.category,
    tags: input.tags,
    file,
    width,
    height,
    file32,
    width32,
    height32,
    userSubmitted: true,
  };

  entries.push(entry);
  await saveIndex();
  return entry;
}

export async function deleteArt(id: string): Promise<ArtEntry | null> {
  const entry = getById(id);
  if (!entry) return null;
  if (!entry.userSubmitted) throw { status: 403, message: 'Cannot delete built-in art' };

  // Delete files
  try { await fs.unlink(path.join(ARTS_DIR, entry.file)); } catch {}
  try { await fs.unlink(path.join(ARTS_DIR, entry.file32)); } catch {}

  entries = entries.filter((e) => e.id !== id);
  await saveIndex();
  return entry;
}

export async function toResult(entry: ArtEntry, width: ArtWidth = 64): Promise<ArtResult> {
  const art = await readArt(entry, width);
  const w = width === 32 ? entry.width32 : entry.width;
  const h = width === 32 ? entry.height32 : entry.height;
  return {
    id: entry.id,
    name: entry.name,
    ...(entry.description && { description: entry.description }),
    category: entry.category,
    tags: entry.tags,
    width: w,
    height: h,
    art,
  };
}
