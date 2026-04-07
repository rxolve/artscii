import { describe, it, expect } from 'vitest';
import { compose } from './compose.js';

describe('compose', () => {
  it('returns empty string for no blocks', () => {
    expect(compose([])).toBe('');
  });

  it('returns single block unchanged', () => {
    expect(compose(['hello'])).toBe('hello');
  });

  it('stacks blocks vertically', () => {
    const result = compose(['AAA', 'BBB'], { mode: 'vertical', gap: 0 });
    expect(result).toBe('AAA\nBBB');
  });

  it('stacks with gap', () => {
    const result = compose(['AAA', 'BBB'], { mode: 'vertical', gap: 2 });
    const lines = result.split('\n');
    expect(lines).toEqual(['AAA', '', '', 'BBB']);
  });

  it('stacks with separator', () => {
    const result = compose(['AAA', 'BBB'], { mode: 'vertical', separator: '---' });
    expect(result).toBe('AAA\n---\nBBB');
  });

  it('places blocks side by side', () => {
    const result = compose(['AB', 'CD'], { mode: 'horizontal', gap: 1 });
    expect(result).toBe('AB CD');
  });

  it('handles multi-line horizontal blocks', () => {
    const result = compose(['A\nB', 'C\nD'], { mode: 'horizontal', gap: 1 });
    const lines = result.split('\n');
    expect(lines[0]).toBe('A C');
    expect(lines[1]).toBe('B D');
  });

  it('pads shorter blocks in horizontal (top align)', () => {
    const result = compose(['A', 'X\nY\nZ'], { mode: 'horizontal', gap: 1 });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('A X');
  });

  it('aligns middle', () => {
    const result = compose(['M', 'X\nY\nZ'], { mode: 'horizontal', gap: 1, align: 'middle' });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1].trimEnd()).toBe('M Y');
  });

  it('aligns bottom', () => {
    const result = compose(['B', 'X\nY\nZ'], { mode: 'horizontal', gap: 1, align: 'bottom' });
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('B Z');
  });
});
