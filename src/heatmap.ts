export type HeatmapStyle = 'default' | 'ascii' | 'dot';

const BLOCK_CHARS = ' ░▒▓█';
const ASCII_CHARS = ' .oO#';
const DOT_CHARS = ' ·•●⬤';

export const HEATMAP_STYLES: HeatmapStyle[] = ['default', 'ascii', 'dot'];

export interface HeatmapOptions {
  rowLabels?: string[];
  colLabels?: string[];
  showValues?: boolean;
  style?: HeatmapStyle;
}

export function renderHeatmap(data: number[][], options: HeatmapOptions = {}): string {
  if (data.length === 0) return '';

  const { rowLabels, colLabels, showValues = false, style = 'default' } = options;

  const chars = style === 'ascii' ? ASCII_CHARS : style === 'dot' ? DOT_CHARS : BLOCK_CHARS;
  const maxIdx = chars.length - 1;

  const flat = data.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min;

  const labelWidth = rowLabels ? Math.max(...rowLabels.map((l) => l.length)) + 1 : 0;
  const lines: string[] = [];

  // Column labels
  if (colLabels) {
    const maxColLen = Math.max(...colLabels.map((l) => l.length));
    const cellWidth = showValues ? 4 : 1;
    for (let row = 0; row < maxColLen; row++) {
      const prefix = ' '.repeat(labelWidth);
      const cols = colLabels.map((l) => {
        const ch = row < l.length ? l[row] : ' ';
        return showValues ? ch.padEnd(cellWidth) : ch;
      }).join('');
      lines.push(prefix + cols);
    }
  }

  // Data rows
  for (let r = 0; r < data.length; r++) {
    const prefix = rowLabels ? rowLabels[r].padEnd(labelWidth) : '';
    const row = data[r].map((v) => {
      const idx = range === 0 ? Math.floor(maxIdx / 2) : Math.round(((v - min) / range) * maxIdx);
      const ch = chars[idx];
      if (showValues) return `${ch}${String(Math.round(v)).padStart(3)}`;
      return ch;
    }).join('');
    lines.push(prefix + row);
  }

  return lines.join('\n');
}
