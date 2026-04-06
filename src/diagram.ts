export type BoxStyle = 'unicode' | 'rounded' | 'ascii';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

export type DiagramInput =
  | { type: 'flowchart'; nodes: string[]; style?: BoxStyle }
  | { type: 'box'; title: string; lines: string[]; style?: BoxStyle }
  | { type: 'tree'; root: TreeNode }
  | { type: 'table'; headers: string[]; rows: string[][]; style?: BoxStyle };

interface BoxChars {
  tl: string; t: string; tr: string;
  l: string; r: string;
  bl: string; b: string; br: string;
  ml: string; mr: string;
  mt: string; mb: string;
  cross: string;
}

const BOX_CHARS: Record<BoxStyle, BoxChars> = {
  unicode: { tl: '┌', t: '─', tr: '┐', l: '│', r: '│', bl: '└', b: '─', br: '┘', ml: '├', mr: '┤', mt: '┬', mb: '┴', cross: '┼' },
  rounded: { tl: '╭', t: '─', tr: '╮', l: '│', r: '│', bl: '╰', b: '─', br: '╯', ml: '├', mr: '┤', mt: '┬', mb: '┴', cross: '┼' },
  ascii:   { tl: '+', t: '-', tr: '+', l: '|', r: '|', bl: '+', b: '-', br: '+', ml: '+', mr: '+', mt: '+', mb: '+', cross: '+' },
};

function padCenter(text: string, width: number): string {
  const gap = width - text.length;
  if (gap <= 0) return text.slice(0, width);
  const left = Math.floor(gap / 2);
  return ' '.repeat(left) + text + ' '.repeat(gap - left);
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

function wrapBox(lines: string[], style: BoxStyle, width: number): string[] {
  const c = BOX_CHARS[style];
  const inner = width - 2;
  const out: string[] = [];
  out.push(c.tl + c.t.repeat(inner) + c.tr);
  for (const line of lines) {
    out.push(c.l + padRight(line, inner) + c.r);
  }
  out.push(c.bl + c.b.repeat(inner) + c.br);
  return out;
}

export function renderFlowchart(nodes: string[], style: BoxStyle = 'unicode'): string {
  if (nodes.length === 0) return '';
  const c = BOX_CHARS[style];
  const maxLen = Math.max(...nodes.map((n) => n.length));
  const boxWidth = maxLen + 4; // 2 padding + 2 border
  const inner = boxWidth - 2;
  const centerCol = Math.floor(boxWidth / 2);

  const out: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    // box
    out.push(c.tl + c.t.repeat(inner) + c.tr);
    out.push(c.l + ' ' + padCenter(nodes[i], inner - 2) + ' ' + c.r);
    out.push(c.bl + c.b.repeat(Math.floor((inner - 1) / 2)) + (i < nodes.length - 1 ? c.mt : c.b) + c.b.repeat(inner - Math.floor((inner - 1) / 2) - 1) + c.br);

    // connector
    if (i < nodes.length - 1) {
      out.push(' '.repeat(centerCol) + c.l);
      out.push(' '.repeat(centerCol) + '\u25BC');
    }
  }
  return out.join('\n');
}

export function renderBox(title: string, lines: string[], style: BoxStyle = 'unicode'): string {
  const c = BOX_CHARS[style];
  const contentWidth = Math.max(title.length, ...lines.map((l) => l.length));
  const inner = contentWidth + 2; // 1 padding each side
  const out: string[] = [];

  out.push(c.tl + c.t.repeat(inner) + c.tr);
  out.push(c.l + ' ' + padCenter(title, inner - 2) + ' ' + c.r);
  out.push(c.ml + c.t.repeat(inner) + c.mr);
  for (const line of lines) {
    out.push(c.l + ' ' + padRight(line, inner - 2) + ' ' + c.r);
  }
  out.push(c.bl + c.b.repeat(inner) + c.br);
  return out.join('\n');
}

export function renderTree(node: TreeNode, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
  const lines: string[] = [];
  if (isRoot) {
    lines.push(node.label);
  } else {
    lines.push(prefix + (isLast ? '\u2514\u2500\u2500 ' : '\u251C\u2500\u2500 ') + node.label);
  }
  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const childIsLast = i === children.length - 1;
    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '\u2502   ');
    lines.push(renderTree(children[i], childPrefix, childIsLast, false));
  }
  return lines.join('\n');
}

export function renderTable(headers: string[], rows: string[][], style: BoxStyle = 'unicode'): string {
  const c = BOX_CHARS[style];
  const colCount = headers.length;
  const colWidths: number[] = headers.map((h) => h.length);
  for (const row of rows) {
    for (let i = 0; i < colCount; i++) {
      const cell = row[i] ?? '';
      colWidths[i] = Math.max(colWidths[i], cell.length);
    }
  }

  const makeSep = (left: string, mid: string, right: string, fill: string) =>
    left + colWidths.map((w) => fill.repeat(w + 2)).join(mid) + right;

  const makeRow = (cells: string[]) =>
    c.l + cells.map((cell, i) => ' ' + padRight(cell, colWidths[i]) + ' ').join(c.l) + c.l;

  const out: string[] = [];
  out.push(makeSep(c.tl, c.mt, c.tr, c.t));
  out.push(makeRow(headers));
  out.push(makeSep(c.ml, c.cross, c.mr, c.t));
  for (const row of rows) {
    const cells = headers.map((_, i) => row[i] ?? '');
    out.push(makeRow(cells));
  }
  out.push(makeSep(c.bl, c.mb, c.br, c.b));
  return out.join('\n');
}

export function renderDiagram(input: DiagramInput): string {
  switch (input.type) {
    case 'flowchart':
      return renderFlowchart(input.nodes, input.style);
    case 'box':
      return renderBox(input.title, input.lines, input.style);
    case 'tree':
      return renderTree(input.root);
    case 'table':
      return renderTable(input.headers, input.rows, input.style);
  }
}

export function listDiagramTypes() {
  return [
    { type: 'flowchart', description: 'Vertical flowchart with connected boxes', params: ['nodes', 'style?'] },
    { type: 'box', description: 'Single box with title and body lines', params: ['title', 'lines', 'style?'] },
    { type: 'tree', description: 'Hierarchical tree structure', params: ['root'] },
    { type: 'table', description: 'Text table with headers and rows', params: ['headers', 'rows', 'style?'] },
  ];
}
