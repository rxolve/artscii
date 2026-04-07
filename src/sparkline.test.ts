import { describe, it, expect } from 'vitest';
import { renderSparkline, SPARKLINE_STYLES } from './sparkline.js';

describe('renderSparkline', () => {
  it('returns empty string for empty array', () => {
    expect(renderSparkline([])).toBe('');
  });

  it('renders single value as max bar', () => {
    const result = renderSparkline([5]);
    expect(result).toBe('▄');
  });

  it('renders ascending values', () => {
    const result = renderSparkline([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result).toBe('▁▂▃▄▅▆▇█');
  });

  it('renders all-same values as middle bar', () => {
    const result = renderSparkline([5, 5, 5]);
    expect(result).toBe('▄▄▄');
  });

  it('handles negative values by shifting to 0', () => {
    const result = renderSparkline([-4, -2, 0, 2, 4]);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('▁');
    expect(result[4]).toBe('█');
  });

  it('supports width option for resampling', () => {
    const result = renderSparkline([0, 10], { width: 5 });
    expect(result).toHaveLength(5);
  });

  it('shows labels with min/max', () => {
    const result = renderSparkline([1, 5, 3], { labels: true });
    expect(result).toContain('min: 1');
    expect(result).toContain('max: 5');
  });

  it('supports ascii style', () => {
    const result = renderSparkline([0, 3, 7], { style: 'ascii' });
    expect(result).toContain('_');
    expect(result).toContain('@');
  });

  it('supports dot style', () => {
    const result = renderSparkline([0, 7], { style: 'dot' });
    expect(result).toHaveLength(2);
  });

  it('handles two identical values', () => {
    const result = renderSparkline([3, 3]);
    expect(result).toBe('▄▄');
  });

  it('handles large range', () => {
    const result = renderSparkline([0, 1000000]);
    expect(result[0]).toBe('▁');
    expect(result[1]).toBe('█');
  });

  it('handles float values', () => {
    const result = renderSparkline([0.1, 0.5, 0.9]);
    expect(result).toHaveLength(3);
  });

  it('lists all styles', () => {
    expect(SPARKLINE_STYLES).toHaveLength(3);
    for (const s of SPARKLINE_STYLES) {
      expect(typeof renderSparkline([1, 2, 3], { style: s })).toBe('string');
    }
  });

  it('width=1 returns single char', () => {
    const result = renderSparkline([1, 5, 3], { width: 1 });
    expect(result).toHaveLength(1);
  });
});
