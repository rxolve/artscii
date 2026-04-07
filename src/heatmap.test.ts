import { describe, it, expect } from 'vitest';
import { renderHeatmap, HEATMAP_STYLES } from './heatmap.js';

describe('renderHeatmap', () => {
  it('returns empty string for empty data', () => {
    expect(renderHeatmap([])).toBe('');
  });

  it('renders 1x1 grid', () => {
    const result = renderHeatmap([[5]]);
    expect(result).toBe('▒');
  });

  it('renders 2x2 grid with range', () => {
    const result = renderHeatmap([[0, 10], [5, 3]]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0][0]).toBe(' '); // min value
    expect(lines[0][1]).toBe('█'); // max value
  });

  it('renders all-same values as middle intensity', () => {
    const result = renderHeatmap([[3, 3], [3, 3]]);
    expect(result).toContain('▒');
  });

  it('supports row labels', () => {
    const result = renderHeatmap([[1, 2], [3, 4]], { rowLabels: ['A', 'B'] });
    const lines = result.split('\n');
    expect(lines[0]).toMatch(/^A/);
    expect(lines[1]).toMatch(/^B/);
  });

  it('supports column labels', () => {
    const result = renderHeatmap([[1, 2]], { colLabels: ['X', 'Y'] });
    const lines = result.split('\n');
    expect(lines[0]).toContain('X');
    expect(lines[0]).toContain('Y');
  });

  it('supports showValues', () => {
    const result = renderHeatmap([[10, 20]], { showValues: true });
    expect(result).toContain('10');
    expect(result).toContain('20');
  });

  it('supports ascii style', () => {
    const result = renderHeatmap([[0, 10]], { style: 'ascii' });
    expect(result).toContain(' ');
    expect(result).toContain('#');
  });

  it('supports dot style', () => {
    const result = renderHeatmap([[0, 10]], { style: 'dot' });
    expect(result).toContain('⬤');
  });

  it('lists all styles', () => {
    expect(HEATMAP_STYLES).toHaveLength(3);
    for (const s of HEATMAP_STYLES) {
      expect(typeof renderHeatmap([[1, 2]], { style: s })).toBe('string');
    }
  });

  it('handles negative values', () => {
    const result = renderHeatmap([[-10, 0, 10]]);
    const lines = result.split('\n');
    expect(lines[0][0]).toBe(' ');
    expect(lines[0][2]).toBe('█');
  });
});
