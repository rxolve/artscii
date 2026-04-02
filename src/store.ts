import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { MAX_WIDTH, MAX_HEIGHT } from './constants.js';
import type { ArtEntry, ArtResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTS_DIR = path.join(__dirname, '..', 'arts');

let entries: ArtEntry[] = [];

export function validateArt(content: string): boolean {
  const lines = content.replace(/\n$/, '').split('\n');
  if (lines.length > MAX_HEIGHT) return false;
  return lines.every((line) => line.length <= MAX_WIDTH);
}

export async function loadIndex(): Promise<void> {
  const raw = await fs.readFile(path.join(ARTS_DIR, 'index.json'), 'utf-8');
  entries = JSON.parse(raw);

  for (const entry of entries) {
    const content = await fs.readFile(path.join(ARTS_DIR, entry.file), 'utf-8');
    const lines = content.replace(/\n$/, '').split('\n');
    const width = Math.max(...lines.map((l: string) => l.length));
    const height = lines.length;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      console.warn(
        `[artscii] WARNING: "${entry.id}" exceeds 64w spec (${width}x${height}, max ${MAX_WIDTH}x${MAX_HEIGHT})`
      );
    }
  }
}

export async function readArt(entry: ArtEntry): Promise<string> {
  return fs.readFile(path.join(ARTS_DIR, entry.file), 'utf-8');
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

export async function toResult(entry: ArtEntry): Promise<ArtResult> {
  const art = await readArt(entry);
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    tags: entry.tags,
    art,
  };
}
