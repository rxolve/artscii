export type SparklineStyle = 'default' | 'ascii' | 'dot';

const BLOCK_CHARS = '▁▂▃▄▅▆▇█';
const ASCII_CHARS = '_.-~=*#@';
const DOT_CHARS = '⠀⡀⣀⣄⣤⣦⣶⣷⣿';

export const SPARKLINE_STYLES: SparklineStyle[] = ['default', 'ascii', 'dot'];

export interface SparklineOptions {
  width?: number;
  labels?: boolean;
  style?: SparklineStyle;
}

export function renderSparkline(values: number[], options: SparklineOptions = {}): string {
  if (values.length === 0) return '';

  const { width, labels = false, style = 'default' } = options;

  const chars = style === 'ascii' ? ASCII_CHARS : style === 'dot' ? DOT_CHARS : BLOCK_CHARS;
  const maxIdx = chars.length - 1;

  // Resample if width is specified and differs from values length
  let data = values;
  if (width && width > 0 && width !== values.length) {
    data = [];
    for (let i = 0; i < width; i++) {
      const pos = (i / (width - 1 || 1)) * (values.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(lo + 1, values.length - 1);
      const t = pos - lo;
      data.push(values[lo] * (1 - t) + values[hi] * t);
    }
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const spark = data.map((v) => {
    if (range === 0) return chars[Math.floor(maxIdx / 2)];
    const normalized = (v - min) / range;
    const idx = Math.round(normalized * maxIdx);
    return chars[idx];
  }).join('');

  if (labels) {
    return `${spark} (min: ${min}, max: ${max})`;
  }

  return spark;
}
