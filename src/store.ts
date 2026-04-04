import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { SIZE_LIMITS, DEFAULT_SIZE, MAX_USER_ARTS } from './constants.js';
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
  size?: ArtSize;
  art: string;
}): Promise<ArtEntry> {
  const id = toSlug(input.name);
  if (!id) throw { status: 400, message: 'Invalid name: produces empty slug' };
  if (getById(id)) throw { status: 409, message: `Art "${id}" already exists` };

  const userCount = entries.filter((e) => e.userSubmitted).length;
  if (userCount >= MAX_USER_ARTS) throw { status: 507, message: `User art limit reached (${MAX_USER_ARTS})` };

  const size = input.size ?? DEFAULT_SIZE;
  if (!validateArt(input.art, size)) {
    const { width: maxW, height: maxH } = SIZE_LIMITS[size];
    throw { status: 400, message: `Art exceeds ${size}w spec (max ${maxW}x${maxH})` };
  }

  const { width, height } = measureArt(input.art);

  const dir = path.join(ARTS_DIR, input.category);
  await fs.mkdir(dir, { recursive: true });

  const file = `${input.category}/${id}.txt`;
  await fs.writeFile(path.join(ARTS_DIR, file), input.art, 'utf-8');

  const entry: ArtEntry = {
    id,
    name: input.name,
    ...(input.description && { description: input.description }),
    category: input.category,
    tags: input.tags,
    size,
    file,
    width,
    height,
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

  try { await fs.unlink(path.join(ARTS_DIR, entry.file)); } catch {}

  entries = entries.filter((e) => e.id !== id);
  await saveIndex();
  return entry;
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
