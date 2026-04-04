import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { matchQuery, findById, filterByCategory, pickRandom, uniqueCategories } from './searchable.js';
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
  return matchQuery(entries, query);
}

export function getKaomojiById(id: string): KaomojiEntry | undefined {
  return findById(entries, id);
}

export function getKaomojiByCategory(category: string): KaomojiEntry[] {
  return filterByCategory(entries, category);
}

export function getRandomKaomoji(): KaomojiEntry {
  return pickRandom(entries);
}

export function listKaomojiCategories(): string[] {
  return uniqueCategories(entries);
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
