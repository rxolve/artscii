import { describe, it, expect } from 'vitest';
import { renderProgress, renderMultiProgress, PROGRESS_STYLES } from './progress.js';

describe('renderProgress', () => {
  it('renders 50% with block style', () => {
    const result = renderProgress({ percent: 50, width: 10, style: 'block' });
    expect(result).toBe('█████░░░░░ 50%');
  });

  it('renders 100%', () => {
    const result = renderProgress({ percent: 100, width: 10, style: 'block' });
    expect(result).toBe('██████████ 100%');
  });

  it('renders 0%', () => {
    const result = renderProgress({ percent: 0, width: 10, style: 'block' });
    expect(result).toBe('░░░░░░░░░░ 0%');
  });

  it('clamps negative values', () => {
    const result = renderProgress({ percent: -10, width: 10, style: 'block' });
    expect(result).toContain('0%');
  });

  it('clamps values over 100', () => {
    const result = renderProgress({ percent: 150, width: 10, style: 'block' });
    expect(result).toContain('100%');
  });

  it('supports arrow style', () => {
    const result = renderProgress({ percent: 50, width: 10, style: 'arrow' });
    expect(result).toContain('[');
    expect(result).toContain('=');
    expect(result).toContain(']');
  });

  it('supports ascii style', () => {
    const result = renderProgress({ percent: 50, width: 10, style: 'ascii' });
    expect(result).toContain('#');
    expect(result).toContain('-');
  });

  it('supports dot style', () => {
    const result = renderProgress({ percent: 50, width: 10, style: 'dot' });
    expect(result).toContain('●');
    expect(result).toContain('○');
  });

  it('supports shade style', () => {
    const result = renderProgress({ percent: 50, width: 10, style: 'shade' });
    expect(result).toContain('▓');
  });

  it('hides percent when showPercent is false', () => {
    const result = renderProgress({ percent: 50, width: 10, showPercent: false });
    expect(result).not.toContain('%');
  });

  it('shows label', () => {
    const result = renderProgress({ percent: 75, width: 10, label: 'Upload' });
    expect(result).toContain('Upload');
  });

  it('all styles are listed', () => {
    expect(PROGRESS_STYLES).toHaveLength(5);
    for (const s of PROGRESS_STYLES) {
      expect(typeof renderProgress({ percent: 50, style: s })).toBe('string');
    }
  });
});

describe('renderMultiProgress', () => {
  it('renders multiple bars', () => {
    const result = renderMultiProgress([
      { label: 'CPU', percent: 80 },
      { label: 'Memory', percent: 45 },
    ], 10, 'block');
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('CPU');
    expect(lines[1]).toContain('Memory');
    expect(lines[0]).toContain('80%');
    expect(lines[1]).toContain('45%');
  });

  it('aligns labels', () => {
    const result = renderMultiProgress([
      { label: 'A', percent: 50 },
      { label: 'Long', percent: 50 },
    ], 10);
    const lines = result.split('\n');
    // "A   " should be padded to match "Long"
    expect(lines[0].indexOf('█')).toBe(lines[1].indexOf('█'));
  });
});
