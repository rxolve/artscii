import { describe, it, expect } from 'vitest';
import { frame, FRAME_STYLES } from './frame.js';

describe('frame', () => {
  it('wraps single-line text with single border', () => {
    const result = frame('hello');
    const lines = result.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('┌───────┐');
    expect(lines[1]).toBe('│ hello │');
    expect(lines[2]).toBe('└───────┘');
  });

  it('wraps multi-line text', () => {
    const result = frame('hi\nthere');
    const lines = result.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe('│ hi    │');
    expect(lines[2]).toBe('│ there │');
  });

  it('supports double border', () => {
    const result = frame('ok', { style: 'double' });
    expect(result).toContain('╔');
    expect(result).toContain('║');
  });

  it('supports rounded border', () => {
    const result = frame('ok', { style: 'rounded' });
    expect(result).toContain('╭');
    expect(result).toContain('╯');
  });

  it('supports bold border', () => {
    const result = frame('ok', { style: 'bold' });
    expect(result).toContain('┏');
    expect(result).toContain('┛');
  });

  it('supports ascii border', () => {
    const result = frame('ok', { style: 'ascii' });
    expect(result).toContain('+');
    expect(result).toContain('|');
  });

  it('supports center alignment', () => {
    const result = frame('hi\nthere!', { align: 'center' });
    const lines = result.split('\n');
    expect(lines[1]).toBe('│   hi   │');
  });

  it('supports right alignment', () => {
    const result = frame('hi\nthere!', { align: 'right' });
    const lines = result.split('\n');
    expect(lines[1]).toBe('│     hi │');
  });

  it('supports custom padding', () => {
    const result = frame('x', { padding: 3 });
    const lines = result.split('\n');
    expect(lines[1]).toBe('│   x   │');
  });

  it('supports title', () => {
    const result = frame('content', { title: 'Title' });
    const lines = result.split('\n');
    expect(lines[0]).toContain('Title');
  });

  it('all styles are listed', () => {
    expect(FRAME_STYLES).toHaveLength(5);
    for (const s of FRAME_STYLES) {
      expect(typeof frame('test', { style: s })).toBe('string');
    }
  });
});
