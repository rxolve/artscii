export type BoxStyle = 'unicode' | 'rounded' | 'ascii';

export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
}

export interface ClassDef {
  name: string;
  properties?: string[];
  methods?: string[];
}

export interface Relationship {
  from: string;
  to: string;
  label: string;
}

export interface Entity {
  name: string;
  attributes?: string[];
}

export interface GanttTask {
  label: string;
  start: number;
  duration: number;
}

export type DiagramInput =
  | { type: 'flowchart'; nodes: string[]; style?: BoxStyle }
  | { type: 'box'; title: string; lines: string[]; style?: BoxStyle }
  | { type: 'tree'; root: TreeNode }
  | { type: 'table'; headers: string[]; rows: string[][]; style?: BoxStyle }
  | { type: 'sequence'; actors: string[]; messages: SequenceMessage[] }
  | { type: 'timeline'; events: { label: string; description: string }[] }
  | { type: 'bar'; items: { label: string; value: number }[]; maxWidth?: number }
  | { type: 'class'; classes: ClassDef[]; style?: BoxStyle }
  | { type: 'er'; entities: Entity[]; relationships: Relationship[] }
  | { type: 'mindmap'; root: TreeNode }
  | { type: 'gantt'; tasks: GanttTask[]; unitLabel?: string };

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

export function renderSequence(actors: string[], messages: SequenceMessage[]): string {
  if (actors.length === 0) return '';
  const colSpacing = 15;
  const colPositions: Record<string, number> = {};
  let pos = 0;
  for (const actor of actors) {
    colPositions[actor] = pos;
    pos += Math.max(actor.length, colSpacing);
  }
  const totalWidth = pos;

  function makeLifeline(highlightCols?: Set<number>): string {
    const chars = Array(totalWidth).fill(' ');
    for (const actor of actors) {
      const col = colPositions[actor] + Math.floor(actor.length / 2);
      if (col < totalWidth) chars[col] = '│';
    }
    return chars.join('').replace(/\s+$/, '');
  }

  const out: string[] = [];

  // Header line
  let header = '';
  for (const actor of actors) {
    const p = colPositions[actor];
    while (header.length < p) header += ' ';
    header += actor;
  }
  out.push(header);

  // Initial lifelines
  out.push(makeLifeline());

  for (const msg of messages) {
    const fromCol = colPositions[msg.from] + Math.floor(msg.from.length / 2);
    const toCol = colPositions[msg.to] + Math.floor(msg.to.length / 2);
    const leftCol = Math.min(fromCol, toCol);
    const rightCol = Math.max(fromCol, toCol);
    const goingRight = toCol > fromCol;

    // Arrow line
    const chars = Array(totalWidth).fill(' ');
    // Draw lifelines for actors not involved in this arrow span
    for (const actor of actors) {
      const c = colPositions[actor] + Math.floor(actor.length / 2);
      if (c < leftCol || c > rightCol) {
        if (c < totalWidth) chars[c] = '│';
      }
    }

    // Draw arrow
    if (fromCol === toCol) {
      // Self-message
      chars[fromCol] = '│';
    } else {
      chars[fromCol] = goingRight ? '│' : '◀';
      chars[toCol] = goingRight ? '▶' : '│';
      for (let i = leftCol + 1; i < rightCol; i++) {
        chars[i] = '─';
      }
    }

    // Place label above the arrow
    const labelLine = Array(totalWidth).fill(' ');
    for (const actor of actors) {
      const c = colPositions[actor] + Math.floor(actor.length / 2);
      if (c < totalWidth) labelLine[c] = '│';
    }
    const labelPos = leftCol + Math.floor((rightCol - leftCol - msg.label.length) / 2);
    const lp = Math.max(leftCol + 1, labelPos);
    for (let i = 0; i < msg.label.length && lp + i < totalWidth; i++) {
      labelLine[lp + i] = msg.label[i];
    }
    out.push(labelLine.join('').replace(/\s+$/, ''));
    out.push(chars.join('').replace(/\s+$/, ''));
  }

  // Final lifelines
  out.push(makeLifeline());

  return out.join('\n');
}

export function renderTimeline(events: { label: string; description: string }[]): string {
  if (events.length === 0) return '';
  const out: string[] = [];
  for (let i = 0; i < events.length; i++) {
    out.push(`● ${events[i].label}  ${events[i].description}`);
    if (i < events.length - 1) {
      out.push('│');
    }
  }
  return out.join('\n');
}

export function renderBar(items: { label: string; value: number }[], maxWidth: number = 20): string {
  if (items.length === 0) return '';
  const maxLabel = Math.max(...items.map((it) => it.label.length));
  const maxValue = Math.max(...items.map((it) => it.value), 1);
  const out: string[] = [];
  for (const item of items) {
    const barLen = Math.round((item.value / maxValue) * maxWidth);
    const bar = '█'.repeat(barLen);
    out.push(`${padRight(item.label, maxLabel)}  ${bar} ${item.value}`);
  }
  return out.join('\n');
}

export function renderClass(classes: ClassDef[], style: BoxStyle = 'unicode'): string {
  const c = BOX_CHARS[style];
  const out: string[] = [];
  for (let ci = 0; ci < classes.length; ci++) {
    const cls = classes[ci];
    const props = cls.properties ?? [];
    const methods = cls.methods ?? [];
    const maxLen = Math.max(
      cls.name.length,
      ...props.map((p) => p.length),
      ...methods.map((m) => m.length),
    );
    const inner = maxLen + 2;

    out.push(c.tl + c.t.repeat(inner) + c.tr);
    out.push(c.l + ' ' + padCenter(cls.name, inner - 2) + ' ' + c.r);

    if (props.length > 0 || methods.length > 0) {
      out.push(c.ml + c.t.repeat(inner) + c.mr);
      for (const p of props) {
        out.push(c.l + ' ' + padRight(p, inner - 2) + ' ' + c.r);
      }
    }
    if (methods.length > 0) {
      out.push(c.ml + c.t.repeat(inner) + c.mr);
      for (const m of methods) {
        out.push(c.l + ' ' + padRight(m, inner - 2) + ' ' + c.r);
      }
    }
    out.push(c.bl + c.b.repeat(inner) + c.br);

    if (ci < classes.length - 1) {
      const center = Math.floor((inner + 2) / 2);
      out.push(' '.repeat(center) + '▲');
      out.push(' '.repeat(center) + '│');
    }
  }
  return out.join('\n');
}

export function renderER(entities: Entity[], relationships: Relationship[]): string {
  const out: string[] = [];

  // Render each entity as a box
  const entityBoxes: Record<string, string[]> = {};
  for (const ent of entities) {
    const attrs = ent.attributes ?? [];
    const maxLen = Math.max(ent.name.length, ...attrs.map((a) => a.length));
    const inner = maxLen + 2;
    const lines: string[] = [];
    lines.push('┌' + '─'.repeat(inner) + '┐');
    lines.push('│' + ' ' + padCenter(ent.name, inner - 2) + ' ' + '│');
    if (attrs.length > 0) {
      lines.push('├' + '─'.repeat(inner) + '┤');
      for (const a of attrs) {
        lines.push('│' + ' ' + padRight(a, inner - 2) + ' ' + '│');
      }
    }
    lines.push('└' + '─'.repeat(inner) + '┘');
    entityBoxes[ent.name] = lines;
  }

  // Render entities side by side
  const maxHeight = Math.max(...Object.values(entityBoxes).map((b) => b.length));
  const widths: number[] = [];
  const orderedBoxes: string[][] = [];
  for (const ent of entities) {
    const box = entityBoxes[ent.name];
    const w = box[0].length;
    widths.push(w);
    // Pad to max height
    const padded = [...box];
    while (padded.length < maxHeight) padded.push(' '.repeat(w));
    orderedBoxes.push(padded);
  }

  const gap = '   ';
  for (let row = 0; row < maxHeight; row++) {
    out.push(orderedBoxes.map((b) => b[row]).join(gap));
  }

  // Render relationships below
  if (relationships.length > 0) {
    out.push('');
    for (const rel of relationships) {
      out.push(`  ${rel.from} ──${rel.label}── ${rel.to}`);
    }
  }

  return out.join('\n');
}

export function renderMindmap(node: TreeNode, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
  const lines: string[] = [];
  if (isRoot) {
    lines.push(node.label);
  } else {
    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + node.label);
  }
  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const childIsLast = i === children.length - 1;
    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
    lines.push(renderMindmap(children[i], childPrefix, childIsLast, false));
  }
  return lines.join('\n');
}

export function renderGantt(tasks: GanttTask[], unitLabel: string = ''): string {
  if (tasks.length === 0) return '';
  const maxLabel = Math.max(...tasks.map((t) => t.label.length));
  const maxEnd = Math.max(...tasks.map((t) => t.start + t.duration));
  const barWidth = Math.min(maxEnd, 40);
  const scale = barWidth / maxEnd;

  const out: string[] = [];

  // Header with unit markers
  let header = ' '.repeat(maxLabel + 2);
  for (let i = 0; i <= maxEnd; i += Math.max(1, Math.ceil(maxEnd / 10))) {
    const pos = Math.round(i * scale);
    const label = String(i);
    while (header.length < maxLabel + 2 + pos) header += ' ';
    header += label;
  }
  if (unitLabel) header += ' ' + unitLabel;
  out.push(header);

  // Axis
  out.push(' '.repeat(maxLabel + 2) + '┼' + '─'.repeat(barWidth));

  for (const task of tasks) {
    const startPos = Math.round(task.start * scale);
    const endPos = Math.round((task.start + task.duration) * scale);
    const barLen = Math.max(endPos - startPos, 1);
    const line = padRight(task.label, maxLabel) + '  ' + ' '.repeat(startPos) + '█'.repeat(barLen);
    out.push(line);
  }

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
    case 'sequence':
      return renderSequence(input.actors, input.messages);
    case 'timeline':
      return renderTimeline(input.events);
    case 'bar':
      return renderBar(input.items, input.maxWidth);
    case 'class':
      return renderClass(input.classes, input.style);
    case 'er':
      return renderER(input.entities, input.relationships);
    case 'mindmap':
      return renderMindmap(input.root);
    case 'gantt':
      return renderGantt(input.tasks, input.unitLabel);
  }
}

export function listDiagramTypes() {
  return [
    { type: 'flowchart', description: 'Vertical flowchart with connected boxes', params: ['nodes', 'style?'] },
    { type: 'box', description: 'Single box with title and body lines', params: ['title', 'lines', 'style?'] },
    { type: 'tree', description: 'Hierarchical tree structure', params: ['root'] },
    { type: 'table', description: 'Text table with headers and rows', params: ['headers', 'rows', 'style?'] },
    { type: 'sequence', description: 'Sequence diagram showing actor message flow', params: ['actors', 'messages'] },
    { type: 'timeline', description: 'Vertical timeline of events', params: ['events'] },
    { type: 'bar', description: 'Horizontal bar chart', params: ['items', 'maxWidth?'] },
    { type: 'class', description: 'UML class diagram with properties and methods', params: ['classes', 'style?'] },
    { type: 'er', description: 'Entity-relationship diagram', params: ['entities', 'relationships'] },
    { type: 'mindmap', description: 'Horizontal mind map tree', params: ['root'] },
    { type: 'gantt', description: 'Gantt chart with task timelines', params: ['tasks', 'unitLabel?'] },
  ];
}
