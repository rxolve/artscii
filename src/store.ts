import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { MAX_WIDTH, MAX_HEIGHT, COMPACT_WIDTH, COMPACT_HEIGHT } from './constants.js';
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
      e.tags.some((t) => t.includes(q))
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

export async function toResult(entry: ArtEntry, width: ArtWidth = 64): Promise<ArtResult> {
  const art = await readArt(entry, width);
  const w = width === 32 ? entry.width32 : entry.width;
  const h = width === 32 ? entry.height32 : entry.height;
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    tags: entry.tags,
    width: w,
    height: h,
    art,
  };
}
