import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import type { KaomojiEntry, KaomojiResult } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KAOMOJI_PATH = path.join(__dirname, '..', 'arts', 'kaomoji', 'kaomoji.json');

let entries: KaomojiEntry[] = [];

export async function loadKaomoji(): Promise<void> {
  const raw = await fs.readFile(KAOMOJI_PATH, 'utf-8');
  const parsed: Omit<KaomojiEntry, 'type'>[] = JSON.parse(raw);
  entries = parsed.map((e) => ({ ...e, type: 'kaomoji' as const }));
}

export function searchKaomoji(query: string): KaomojiEntry[] {
  const q = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.id.includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.category.includes(q) ||
      e.tags.some((t) => t.includes(q))
  );
}

export function getKaomojiById(id: string): KaomojiEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function getKaomojiByCategory(category: string): KaomojiEntry[] {
  return entries.filter((e) => e.category === category);
}

export function getRandomKaomoji(): KaomojiEntry {
  return entries[Math.floor(Math.random() * entries.length)];
}

export function listKaomojiCategories(): string[] {
  return [...new Set(entries.map((e) => e.category))];
}

export function listAllKaomoji(): KaomojiEntry[] {
  return entries;
}

export function toKaomojiResult(entry: KaomojiEntry): KaomojiResult {
  return {
    id: entry.id,
    type: 'kaomoji',
    name: entry.name,
    category: entry.category,
    tags: entry.tags,
    text: entry.text,
  };
}
