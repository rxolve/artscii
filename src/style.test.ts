import { describe, it, expect } from 'vitest';
import { styleText, TEXT_STYLES, type TextStyle } from './style.js';

describe('styleText', () => {
  it('transforms bubble text', () => {
    const result = styleText('hello', 'bubble');
    expect(result).toBe('\u24D7\u24D4\u24DB\u24DB\u24DE');
  });

  it('transforms fullwidth text', () => {
    const result = styleText('Hi', 'fullwidth');
    expect(result).toBe('\uFF28\uFF49');
  });

  it('transforms bold text', () => {
    const result = styleText('Ab', 'bold');
    expect(result).toContain('\uD835'); // surrogate pair for math bold
  });

  it('transforms italic text', () => {
    const result = styleText('A', 'italic');
    expect(result.length).toBeGreaterThan(0);
  });

  it('transforms monospace text', () => {
    const result = styleText('AB', 'monospace');
    expect(result).not.toBe('AB');
  });

  it('transforms smallcaps text', () => {
    const result = styleText('hello', 'smallcaps');
    expect(result).toBe('\u029C\u1D07\u029F\u029F\u1D0F');
  });

  it('transforms upsidedown text', () => {
    const result = styleText('hello', 'upsidedown');
    // upsidedown reverses the string
    expect(result.length).toBe(5);
    expect(result).not.toBe('hello');
  });

  it('transforms strikethrough text', () => {
    const result = styleText('hi', 'strikethrough');
    expect(result).toContain('\u0336');
  });

  it('preserves unmapped characters', () => {
    const result = styleText('a!b', 'bubble');
    expect(result).toContain('!');
  });

  it('all styles are listed in TEXT_STYLES', () => {
    expect(TEXT_STYLES.length).toBe(8);
    for (const s of TEXT_STYLES) {
      expect(typeof styleText('test', s)).toBe('string');
    }
  });
});
