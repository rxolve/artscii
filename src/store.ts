import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import type { ArtEntry, ArtResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTS_DIR = path.join(__dirname, '..', 'arts');

let entries: ArtEntry[] = [];

export async function loadIndex(): Promise<void> {
  const raw = await fs.readFile(path.join(ARTS_DIR, 'index.json'), 'utf-8');
  entries = JSON.parse(raw);
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
