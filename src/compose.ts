export type ComposeMode = 'horizontal' | 'vertical';
export type ComposeAlign = 'top' | 'middle' | 'bottom';

export interface ComposeOptions {
  mode?: ComposeMode;
  gap?: number;
  align?: ComposeAlign;
  separator?: string;
}

export function compose(blocks: string[], options: ComposeOptions = {}): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0];

  const { mode = 'horizontal', gap = 1, align = 'top', separator } = options;

  if (mode === 'vertical') {
    if (separator) {
      return blocks.join('\n' + separator + '\n');
    }
    const spacer = '\n' + '\n'.repeat(gap);
    return blocks.join(spacer);
  }

  // Horizontal mode
  const split = blocks.map((b) => b.split('\n'));
  const widths = split.map((lines) => Math.max(...lines.map((l) => l.length), 0));
  const maxHeight = Math.max(...split.map((lines) => lines.length));
  const gapStr = ' '.repeat(gap);

  // Pad each block to maxHeight with alignment
  const padded = split.map((lines, i) => {
    const w = widths[i];
    const normalized = lines.map((l) => l.padEnd(w));
    const diff = maxHeight - normalized.length;
    const empty = ' '.repeat(w);

    if (diff === 0) return normalized;

    let topPad = 0;
    if (align === 'middle') topPad = Math.floor(diff / 2);
    else if (align === 'bottom') topPad = diff;
    const bottomPad = diff - topPad;

    return [
      ...Array(topPad).fill(empty),
      ...normalized,
      ...Array(bottomPad).fill(empty),
    ];
  });

  const result: string[] = [];
  for (let row = 0; row < maxHeight; row++) {
    result.push(padded.map((lines) => lines[row]).join(gapStr));
  }

  return result.join('\n');
}
