export type ProgressStyle = 'block' | 'shade' | 'arrow' | 'dot' | 'ascii';

const STYLES: Record<ProgressStyle, { filled: string; empty: string; left: string; right: string }> = {
  block: { filled: '█', empty: '░', left: '', right: '' },
  shade: { filled: '▓', empty: '░', left: '', right: '' },
  arrow: { filled: '=', empty: ' ', left: '[', right: ']' },
  dot:   { filled: '●', empty: '○', left: '', right: '' },
  ascii: { filled: '#', empty: '-', left: '[', right: ']' },
};

export const PROGRESS_STYLES: ProgressStyle[] = ['block', 'shade', 'arrow', 'dot', 'ascii'];

export interface ProgressOptions {
  percent: number;
  width?: number;
  style?: ProgressStyle;
  showPercent?: boolean;
  label?: string;
}

export function renderProgress(options: ProgressOptions): string {
  const { percent, width = 20, style = 'block', showPercent = true, label } = options;
  const clamped = Math.max(0, Math.min(100, percent));
  const s = STYLES[style];

  const filledLen = Math.round((clamped / 100) * width);
  const emptyLen = width - filledLen;
  const bar = s.left + s.filled.repeat(filledLen) + s.empty.repeat(emptyLen) + s.right;

  const parts: string[] = [];
  if (label) parts.push(label);
  parts.push(bar);
  if (showPercent) parts.push(`${Math.round(clamped)}%`);

  return parts.join(' ');
}

export interface MultiProgressItem {
  label: string;
  percent: number;
}

export function renderMultiProgress(
  items: MultiProgressItem[],
  width: number = 20,
  style: ProgressStyle = 'block',
): string {
  const maxLabel = Math.max(...items.map((it) => it.label.length));
  return items.map((item) => {
    const padded = item.label + ' '.repeat(maxLabel - item.label.length);
    return renderProgress({ percent: item.percent, width, style, showPercent: true, label: padded });
  }).join('\n');
}
