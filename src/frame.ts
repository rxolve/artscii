export type FrameStyle = 'single' | 'double' | 'rounded' | 'bold' | 'ascii';

const BORDERS: Record<FrameStyle, { tl: string; tr: string; bl: string; br: string; h: string; v: string }> = {
  single:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  bold:    { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  ascii:   { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
};

export const FRAME_STYLES: FrameStyle[] = ['single', 'double', 'rounded', 'bold', 'ascii'];

export type Alignment = 'left' | 'center' | 'right';

function pad(text: string, width: number, align: Alignment): string {
  const gap = width - text.length;
  if (gap <= 0) return text;
  if (align === 'center') {
    const left = Math.floor(gap / 2);
    return ' '.repeat(left) + text + ' '.repeat(gap - left);
  }
  if (align === 'right') return ' '.repeat(gap) + text;
  return text + ' '.repeat(gap);
}

export interface FrameOptions {
  style?: FrameStyle;
  padding?: number;
  align?: Alignment;
  title?: string;
}

export function frame(text: string, options: FrameOptions = {}): string {
  const { style = 'single', padding = 1, align = 'left', title } = options;
  const b = BORDERS[style];
  const lines = text.split('\n');
  const contentWidth = Math.max(
    ...lines.map((l) => l.length),
    title ? title.length + 2 : 0,
  );
  const innerWidth = contentWidth + padding * 2;

  const hBar = b.h.repeat(innerWidth);
  const topBar = title
    ? b.h + ` ${title} ` + b.h.repeat(Math.max(0, innerWidth - title.length - 3))
    : hBar;

  const out: string[] = [];
  out.push(b.tl + topBar + b.tr);

  for (const line of lines) {
    const padded = pad(line, contentWidth, align);
    out.push(b.v + ' '.repeat(padding) + padded + ' '.repeat(padding) + b.v);
  }

  out.push(b.bl + hBar + b.br);
  return out.join('\n');
}
