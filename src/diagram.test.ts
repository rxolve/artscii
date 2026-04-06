import { describe, it, expect } from 'vitest';
import {
  renderFlowchart,
  renderBox,
  renderTree,
  renderTable,
  renderSequence,
  renderTimeline,
  renderBar,
  renderDiagram,
  listDiagramTypes,
} from './diagram.js';

// --- renderFlowchart ---

describe('renderFlowchart', () => {
  it('returns empty string for empty nodes', () => {
    expect(renderFlowchart([])).toBe('');
  });

  it('renders single node without connector', () => {
    const out = renderFlowchart(['Start']);
    expect(out).toContain('Start');
    expect(out).not.toContain('▼');
  });

  it('renders multiple nodes with connectors', () => {
    const out = renderFlowchart(['A', 'B', 'C']);
    expect(out).toContain('A');
    expect(out).toContain('B');
    expect(out).toContain('C');
    expect(out).toContain('▼');
  });

  it('respects ascii style', () => {
    const out = renderFlowchart(['X'], 'ascii');
    expect(out).toContain('+');
    expect(out).toContain('-');
    expect(out).not.toContain('┌');
  });

  it('respects rounded style', () => {
    const out = renderFlowchart(['X'], 'rounded');
    expect(out).toContain('╭');
    expect(out).toContain('╯');
  });
});

// --- renderBox ---

describe('renderBox', () => {
  it('renders title and lines', () => {
    const out = renderBox('Title', ['line1', 'line2']);
    expect(out).toContain('Title');
    expect(out).toContain('line1');
    expect(out).toContain('line2');
    expect(out).toContain('├'); // separator
  });

  it('handles empty lines array', () => {
    const out = renderBox('Hello', []);
    expect(out).toContain('Hello');
    expect(out).toContain('┌');
    expect(out).toContain('└');
  });

  it('respects style', () => {
    const out = renderBox('T', ['L'], 'ascii');
    expect(out).toContain('+');
    expect(out).not.toContain('┌');
  });
});

// --- renderTree ---

describe('renderTree', () => {
  it('renders root only', () => {
    const out = renderTree({ label: 'root' });
    expect(out).toBe('root');
  });

  it('renders children', () => {
    const out = renderTree({
      label: 'src',
      children: [{ label: 'a.ts' }, { label: 'b.ts' }],
    });
    expect(out).toContain('src');
    expect(out).toContain('├── a.ts');
    expect(out).toContain('└── b.ts');
  });

  it('renders nested children', () => {
    const out = renderTree({
      label: 'root',
      children: [
        { label: 'dir', children: [{ label: 'file.ts' }] },
      ],
    });
    expect(out).toContain('root');
    expect(out).toContain('└── dir');
    expect(out).toContain('└── file.ts');
  });
});

// --- renderTable ---

describe('renderTable', () => {
  it('renders headers and rows', () => {
    const out = renderTable(['Name', 'Score'], [['A', '95'], ['B', '87']]);
    expect(out).toContain('Name');
    expect(out).toContain('Score');
    expect(out).toContain('A');
    expect(out).toContain('95');
    expect(out).toContain('┼'); // cross separator
  });

  it('handles empty rows', () => {
    const out = renderTable(['Col'], []);
    expect(out).toContain('Col');
    const lines = out.split('\n');
    expect(lines.length).toBe(4); // top border + header + separator + bottom border
  });

  it('handles missing cells gracefully', () => {
    const out = renderTable(['A', 'B'], [['x']]);
    expect(out).toContain('x');
  });

  it('respects ascii style', () => {
    const out = renderTable(['H'], [['D']], 'ascii');
    expect(out).toContain('+');
    expect(out).not.toContain('┌');
  });
});

// --- renderSequence ---

describe('renderSequence', () => {
  it('returns empty string for empty actors', () => {
    expect(renderSequence([], [])).toBe('');
  });

  it('renders actor headers and lifelines', () => {
    const out = renderSequence(['A', 'B'], []);
    expect(out).toContain('A');
    expect(out).toContain('B');
    expect(out).toContain('│');
  });

  it('renders right-pointing arrows', () => {
    const out = renderSequence(
      ['Client', 'Server'],
      [{ from: 'Client', to: 'Server', label: 'GET' }],
    );
    expect(out).toContain('▶');
    expect(out).toContain('GET');
    expect(out).toContain('─');
  });

  it('renders left-pointing arrows', () => {
    const out = renderSequence(
      ['Client', 'Server'],
      [{ from: 'Server', to: 'Client', label: '200' }],
    );
    expect(out).toContain('◀');
    expect(out).toContain('200');
  });

  it('renders multiple messages', () => {
    const out = renderSequence(
      ['A', 'B', 'C'],
      [
        { from: 'A', to: 'B', label: 'req' },
        { from: 'B', to: 'C', label: 'query' },
        { from: 'C', to: 'B', label: 'result' },
        { from: 'B', to: 'A', label: 'resp' },
      ],
    );
    expect(out).toContain('req');
    expect(out).toContain('query');
    expect(out).toContain('result');
    expect(out).toContain('resp');
  });
});

// --- renderTimeline ---

describe('renderTimeline', () => {
  it('returns empty string for empty events', () => {
    expect(renderTimeline([])).toBe('');
  });

  it('renders single event without connector', () => {
    const out = renderTimeline([{ label: 'Q1', description: 'Start' }]);
    expect(out).toBe('● Q1  Start');
    expect(out).not.toContain('│');
  });

  it('renders multiple events with connectors', () => {
    const out = renderTimeline([
      { label: 'Q1', description: 'Plan' },
      { label: 'Q2', description: 'Build' },
      { label: 'Q3', description: 'Ship' },
    ]);
    const lines = out.split('\n');
    expect(lines).toEqual([
      '● Q1  Plan',
      '│',
      '● Q2  Build',
      '│',
      '● Q3  Ship',
    ]);
  });
});

// --- renderBar ---

describe('renderBar', () => {
  it('returns empty string for empty items', () => {
    expect(renderBar([])).toBe('');
  });

  it('renders bars proportional to values', () => {
    const out = renderBar([
      { label: 'A', value: 100 },
      { label: 'B', value: 50 },
    ]);
    expect(out).toContain('█');
    expect(out).toContain('100');
    expect(out).toContain('50');
    // A should have more blocks than B
    const lines = out.split('\n');
    const aBlocks = (lines[0].match(/█/g) ?? []).length;
    const bBlocks = (lines[1].match(/█/g) ?? []).length;
    expect(aBlocks).toBeGreaterThan(bBlocks);
  });

  it('respects maxWidth parameter', () => {
    const out = renderBar([{ label: 'X', value: 100 }], 10);
    const blocks = (out.match(/█/g) ?? []).length;
    expect(blocks).toBe(10);
  });

  it('aligns labels', () => {
    const out = renderBar([
      { label: 'Short', value: 10 },
      { label: 'Very Long', value: 20 },
    ]);
    const lines = out.split('\n');
    // Both lines should start their bars at the same position
    const barStart0 = lines[0].indexOf('█');
    const barStart1 = lines[1].indexOf('█');
    expect(barStart0).toBe(barStart1);
  });

  it('handles zero values', () => {
    const out = renderBar([
      { label: 'A', value: 0 },
      { label: 'B', value: 10 },
    ]);
    expect(out).toContain('0');
    expect(out).toContain('10');
  });
});

// --- renderDiagram (dispatcher) ---

describe('renderDiagram', () => {
  it('dispatches flowchart', () => {
    const out = renderDiagram({ type: 'flowchart', nodes: ['A'] });
    expect(out).toContain('A');
    expect(out).toContain('┌');
  });

  it('dispatches box', () => {
    const out = renderDiagram({ type: 'box', title: 'T', lines: ['L'] });
    expect(out).toContain('T');
    expect(out).toContain('L');
  });

  it('dispatches tree', () => {
    const out = renderDiagram({ type: 'tree', root: { label: 'root' } });
    expect(out).toBe('root');
  });

  it('dispatches table', () => {
    const out = renderDiagram({ type: 'table', headers: ['H'], rows: [['D']] });
    expect(out).toContain('H');
    expect(out).toContain('D');
  });

  it('dispatches sequence', () => {
    const out = renderDiagram({
      type: 'sequence',
      actors: ['A', 'B'],
      messages: [{ from: 'A', to: 'B', label: 'hi' }],
    });
    expect(out).toContain('▶');
  });

  it('dispatches timeline', () => {
    const out = renderDiagram({
      type: 'timeline',
      events: [{ label: 'Q1', description: 'Start' }],
    });
    expect(out).toContain('●');
  });

  it('dispatches bar', () => {
    const out = renderDiagram({
      type: 'bar',
      items: [{ label: 'X', value: 10 }],
    });
    expect(out).toContain('█');
  });
});

// --- listDiagramTypes ---

describe('listDiagramTypes', () => {
  it('returns all 7 types', () => {
    const types = listDiagramTypes();
    expect(types).toHaveLength(7);
    const names = types.map((t) => t.type);
    expect(names).toEqual(['flowchart', 'box', 'tree', 'table', 'sequence', 'timeline', 'bar']);
  });

  it('each type has description and params', () => {
    for (const t of listDiagramTypes()) {
      expect(t.description).toBeTruthy();
      expect(Array.isArray(t.params)).toBe(true);
    }
  });
});
