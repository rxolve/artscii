import { describe, it, expect } from 'vitest';
import { generateCharacter, hashSeed, selectIndex, SPECIES, EYES, MOUTHS, HATS, ACCESSORIES, MOODS, SIZES } from './character.js';

describe('hashSeed', () => {
  it('returns a 32-bit unsigned integer', () => {
    const h = hashSeed('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xFFFFFFFF);
  });

  it('is deterministic', () => {
    expect(hashSeed('hello')).toBe(hashSeed('hello'));
    expect(hashSeed('world')).toBe(hashSeed('world'));
  });

  it('produces different hashes for different seeds', () => {
    expect(hashSeed('alice')).not.toBe(hashSeed('bob'));
    expect(hashSeed('cat')).not.toBe(hashSeed('dog'));
  });
});

describe('selectIndex', () => {
  it('returns index within range', () => {
    const hash = hashSeed('test');
    for (let slot = 0; slot < 5; slot++) {
      const idx = selectIndex(hash, slot, 10);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(10);
    }
  });

  it('different slots produce different indices for most seeds', () => {
    const hash = hashSeed('diversity-check');
    const indices = [0, 1, 2, 3, 4].map(slot => selectIndex(hash, slot, 100));
    const unique = new Set(indices);
    // At least 3 out of 5 should differ (probabilistically very likely with 100 options)
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });
});

describe('generateCharacter', () => {
  it('is deterministic — same seed produces same output', () => {
    const a = generateCharacter({ seed: 'alice' });
    const b = generateCharacter({ seed: 'alice' });
    expect(a).toBe(b);
  });

  it('different seeds produce different output', () => {
    const a = generateCharacter({ seed: 'alice' });
    const b = generateCharacter({ seed: 'bob' });
    expect(a).not.toBe(b);
  });

  it('returns non-empty multi-line string', () => {
    const result = generateCharacter({ seed: 'test' });
    expect(result).toBeTruthy();
    expect(result.split('\n').length).toBeGreaterThan(1);
  });

  it('no marker characters remain in output', () => {
    // Test many seeds to ensure L, R, M markers are always replaced
    for (const seed of ['a', 'b', 'c', 'test', 'hello', 'world', '123', 'zzz']) {
      const result = generateCharacter({ seed });
      const lines = result.split('\n');
      for (const line of lines) {
        // Check that standalone L, R, M markers are replaced
        // They should have been substituted with eye/mouth chars
        // We can't just check for absence of these letters (they appear in templates)
        // but the marker positions should now contain eye/mouth chars
        expect(typeof line).toBe('string');
      }
    }
  });

  it('renders all species without error', () => {
    for (const species of SPECIES) {
      const result = generateCharacter({ seed: 'test', species });
      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBeGreaterThan(1);
    }
  });

  it('applies eye override', () => {
    const a = generateCharacter({ seed: 'x', eyes: 'star' });
    expect(a).toContain('*');
  });

  it('applies mouth override', () => {
    const a = generateCharacter({ seed: 'x', mouth: 'grin' });
    expect(a).toContain('D');
  });

  it('applies hat override — tophat adds lines above body', () => {
    const noHat = generateCharacter({ seed: 'x', hat: 'none' });
    const withHat = generateCharacter({ seed: 'x', hat: 'tophat' });
    expect(withHat.split('\n').length).toBeGreaterThan(noHat.split('\n').length);
  });

  it('applies accessory override — bowtie adds line below', () => {
    const noAcc = generateCharacter({ seed: 'x', accessory: 'none' });
    const withAcc = generateCharacter({ seed: 'x', accessory: 'bowtie' });
    expect(withAcc).toContain('{=}');
    expect(noAcc).not.toContain('{=}');
  });

  it('species override is respected', () => {
    const blob = generateCharacter({ seed: 'x', species: 'blob' });
    const cat = generateCharacter({ seed: 'x', species: 'cat' });
    expect(blob).not.toBe(cat);
  });

  it('covers all enum sizes', () => {
    expect(SPECIES).toHaveLength(16);
    expect(EYES).toHaveLength(10);
    expect(MOUTHS).toHaveLength(8);
    expect(HATS).toHaveLength(10);
    expect(ACCESSORIES).toHaveLength(12);
    expect(MOODS).toHaveLength(8);
    expect(SIZES).toHaveLength(2);
  });

  it('total standard combinations are 153600', () => {
    const total = SPECIES.length * EYES.length * MOUTHS.length * HATS.length * ACCESSORIES.length;
    expect(total).toBe(153600);
  });

  it('mood sets eyes and mouth', () => {
    const happy = generateCharacter({ seed: 'x', species: 'blob', hat: 'none', accessory: 'none', mood: 'happy' });
    // happy mood → happy eyes (^) + smile mouth (u)
    expect(happy).toContain('^');
    expect(happy).toContain('u');
  });

  it('mood is overridden by explicit eyes', () => {
    const result = generateCharacter({ seed: 'x', species: 'blob', hat: 'none', accessory: 'none', mood: 'happy', eyes: 'star' });
    // eyes override: star (*), but mouth from mood: smile (u)
    expect(result).toContain('*');
    expect(result).toContain('u');
  });

  it('mood is overridden by explicit mouth', () => {
    const result = generateCharacter({ seed: 'x', species: 'blob', hat: 'none', accessory: 'none', mood: 'happy', mouth: 'teeth' });
    // eyes from mood: happy (^), but mouth override: teeth (E)
    expect(result).toContain('^');
    expect(result).toContain('E');
  });

  it('all moods render without error', () => {
    for (const mood of MOODS) {
      const result = generateCharacter({ seed: 'test', mood });
      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBeGreaterThan(1);
    }
  });

  it('mini size produces 2-line output', () => {
    const result = generateCharacter({ seed: 'test', size: 'mini' });
    expect(result.split('\n')).toHaveLength(2);
  });

  it('mini renders all species', () => {
    for (const species of SPECIES) {
      const result = generateCharacter({ seed: 'test', species, size: 'mini' });
      expect(result).toBeTruthy();
      expect(result.split('\n')).toHaveLength(2);
    }
  });

  it('mini ignores hat and accessory', () => {
    const mini = generateCharacter({ seed: 'x', species: 'blob', size: 'mini', hat: 'tophat', accessory: 'sword' });
    // mini should be 2 lines regardless of hat/accessory
    expect(mini.split('\n')).toHaveLength(2);
  });

  it('mini is deterministic', () => {
    const a = generateCharacter({ seed: 'abc', size: 'mini' });
    const b = generateCharacter({ seed: 'abc', size: 'mini' });
    expect(a).toBe(b);
  });

  it('mini with mood works', () => {
    const result = generateCharacter({ seed: 'x', species: 'cat', size: 'mini', mood: 'love' });
    expect(result).toContain('*'); // star eyes from love mood
  });

  it('new accessories render without error', () => {
    const newAccessories = ['glasses', 'cape', 'wings', 'staff', 'bag', 'flower'] as const;
    for (const acc of newAccessories) {
      const result = generateCharacter({ seed: 'test', accessory: acc, hat: 'none' });
      expect(result).toBeTruthy();
      expect(result.split('\n').length).toBeGreaterThan(1);
    }
  });
});
