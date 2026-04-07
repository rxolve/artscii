import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { SIZE_LIMITS } from './constants.js';
import { matchQuery, findById, filterByCategory, pickRandom, uniqueCategories } from './searchable.js';
import type { ArtEntry, ArtResult, ArtSize } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTS_DIR = path.join(__dirname, '..', 'arts');

let entries: ArtEntry[] = [];

export function validateArt(content: string, size: ArtSize): boolean {
  const { width: maxW, height: maxH } = SIZE_LIMITS[size];
  const lines = content.replace(/\n$/, '').split('\n');
  if (lines.length > maxH) return false;
  return lines.every((line) => line.length <= maxW);
}

export async function loadIndex(): Promise<void> {
  const raw = await fs.readFile(path.join(ARTS_DIR, 'index.json'), 'utf-8');
  entries = JSON.parse(raw);

  for (const entry of entries) {
    const content = await fs.readFile(path.join(ARTS_DIR, entry.file), 'utf-8');
    if (!validateArt(content, entry.size)) {
      const { width: maxW, height: maxH } = SIZE_LIMITS[entry.size];
      console.warn(`[artscii] WARNING: "${entry.id}" exceeds ${entry.size}w spec (max ${maxW}x${maxH})`);
    }
  }
}

export async function readArt(entry: ArtEntry): Promise<string> {
  return fs.readFile(path.join(ARTS_DIR, entry.file), 'utf-8');
}

export function search(query: string): ArtEntry[] {
  return matchQuery(entries, query, (e, q) => e.description?.toLowerCase().includes(q) ?? false);
}

export function getById(id: string): ArtEntry | undefined {
  return findById(entries, id);
}

export function getByCategory(category: string): ArtEntry[] {
  return filterByCategory(entries, category);
}

export function getRandom(): ArtEntry {
  return pickRandom(entries);
}

export function listCategories(): string[] {
  return uniqueCategories(entries);
}

export function listAll(): ArtEntry[] {
  return entries;
}

export async function toResult(entry: ArtEntry): Promise<ArtResult> {
  const art = await readArt(entry);
  return {
    id: entry.id,
    name: entry.name,
    ...(entry.description && { description: entry.description }),
    category: entry.category,
    tags: entry.tags,
    size: entry.size,
    width: entry.width,
    height: entry.height,
    art,
  };
}
