import { describe, it, expect } from 'vitest';
import { matchQuery, findById, filterByCategory, pickRandom, uniqueCategories } from './searchable.js';

const entries = [
  { id: 'cat', name: 'Cat', category: 'animals', tags: ['pet', 'feline'] },
  { id: 'dog', name: 'Dog', category: 'animals', tags: ['pet', 'canine'] },
  { id: 'sun', name: 'Sun', category: 'nature', tags: ['star', 'bright'] },
  { id: 'moon', name: 'Moon', category: 'nature', tags: ['night'] },
];

describe('matchQuery', () => {
  it('matches by id', () => {
    const results = matchQuery(entries, 'cat');
    expect(results.map((e) => e.id)).toContain('cat');
  });

  it('matches by name (case-insensitive)', () => {
    const results = matchQuery(entries, 'DOG');
    expect(results.map((e) => e.id)).toContain('dog');
  });

  it('matches by category', () => {
    const results = matchQuery(entries, 'animals');
    expect(results).toHaveLength(2);
  });

  it('matches by tag', () => {
    const results = matchQuery(entries, 'feline');
    expect(results.map((e) => e.id)).toEqual(['cat']);
  });

  it('returns empty for no match', () => {
    expect(matchQuery(entries, 'zzz')).toEqual([]);
  });

  it('uses extraMatch when provided', () => {
    const results = matchQuery(entries, 'bright', (e, q) => e.tags.includes(q));
    expect(results.map((e) => e.id)).toContain('sun');
  });
});

describe('findById', () => {
  it('finds existing entry', () => {
    expect(findById(entries, 'sun')?.name).toBe('Sun');
  });

  it('returns undefined for missing id', () => {
    expect(findById(entries, 'nope')).toBeUndefined();
  });
});

describe('filterByCategory', () => {
  it('filters matching category', () => {
    const results = filterByCategory(entries, 'nature');
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.category === 'nature')).toBe(true);
  });

  it('returns empty for missing category', () => {
    expect(filterByCategory(entries, 'food')).toEqual([]);
  });
});

describe('pickRandom', () => {
  it('returns an element from the array', () => {
    const item = pickRandom(entries);
    expect(entries).toContain(item);
  });

  it('throws on empty array', () => {
    expect(() => pickRandom([])).toThrow('No entries available');
  });
});

describe('uniqueCategories', () => {
  it('returns unique categories', () => {
    const cats = uniqueCategories(entries);
    expect(cats.sort()).toEqual(['animals', 'nature']);
  });
});
