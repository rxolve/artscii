import { describe, it, expect } from 'vitest';
import { renderAnimation, ANIMATION_TYPES, SPINNER_STYLE_NAMES, LIFE_STYLE_NAMES } from './animate.js';

describe('renderAnimation', () => {
  it('returns frame headers for all types', () => {
    for (const type of ANIMATION_TYPES) {
      const result = renderAnimation({ type, frames: 3 });
      expect(result).toContain('--- frame 1/');
      expect(result).toContain('--- frame 3/');
    }
  });

  it('lists all 8 animation types', () => {
    expect(ANIMATION_TYPES).toHaveLength(8);
  });
});

describe('typing', () => {
  it('reveals text progressively', () => {
    const result = renderAnimation({ type: 'typing', text: 'Hi', frames: 2 });
    expect(result).toContain('H');
    expect(result).toContain('Hi');
  });

  it('shows cursor during reveal', () => {
    const result = renderAnimation({ type: 'typing', text: 'Hello', frames: 2 });
    expect(result).toContain('\u2588');
  });

  it('last frame has no cursor', () => {
    const result = renderAnimation({ type: 'typing', text: 'Hi', frames: 5 });
    const frames = result.split('--- frame ');
    const lastFrame = frames[frames.length - 1];
    expect(lastFrame).toContain('Hi');
    expect(lastFrame).not.toContain('\u2588');
  });

  it('uses default text when none provided', () => {
    const result = renderAnimation({ type: 'typing', frames: 3 });
    expect(result).toContain('Hello');
  });
});

describe('matrix', () => {
  it('generates grid of correct dimensions', () => {
    const result = renderAnimation({ type: 'matrix', width: 20, height: 5, frames: 1 });
    const content = result.split('\n').slice(1); // skip header
    expect(content).toHaveLength(5);
    for (const line of content) {
      expect(line).toHaveLength(20);
    }
  });

  it('produces deterministic output with same seed', () => {
    const a = renderAnimation({ type: 'matrix', seed: 123, frames: 3 });
    const b = renderAnimation({ type: 'matrix', seed: 123, frames: 3 });
    expect(a).toBe(b);
  });

  it('produces different output with different seeds', () => {
    const a = renderAnimation({ type: 'matrix', seed: 1, frames: 3 });
    const b = renderAnimation({ type: 'matrix', seed: 2, frames: 3 });
    expect(a).not.toBe(b);
  });
});

describe('spinner', () => {
  it('renders all spinner styles', () => {
    for (const style of SPINNER_STYLE_NAMES) {
      const result = renderAnimation({ type: 'spinner', style, frames: 3 });
      expect(result).toContain('Loading...');
    }
  });

  it('uses custom text', () => {
    const result = renderAnimation({ type: 'spinner', text: 'Working', frames: 2 });
    expect(result).toContain('Working');
  });

  it('cycles through spinner characters', () => {
    const result = renderAnimation({ type: 'spinner', style: 'line', frames: 4 });
    expect(result).toContain('|');
    expect(result).toContain('/');
    expect(result).toContain('-');
    expect(result).toContain('\\');
  });
});

describe('fire', () => {
  it('generates correct dimensions', () => {
    const result = renderAnimation({ type: 'fire', width: 15, height: 8, frames: 1 });
    const content = result.split('\n').slice(1);
    expect(content).toHaveLength(8);
    for (const line of content) {
      expect(line).toHaveLength(15);
    }
  });

  it('bottom row has high heat characters', () => {
    const result = renderAnimation({ type: 'fire', width: 20, height: 6, frames: 5 });
    // After a few frames, bottom should have fire chars
    expect(result).toContain('@');
  });

  it('is deterministic with seed', () => {
    const a = renderAnimation({ type: 'fire', seed: 7, frames: 3 });
    const b = renderAnimation({ type: 'fire', seed: 7, frames: 3 });
    expect(a).toBe(b);
  });
});

describe('wave', () => {
  it('renders all text characters across frames', () => {
    const result = renderAnimation({ type: 'wave', text: 'ABC', frames: 4 });
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).toContain('C');
  });

  it('produces 5 rows (amplitude=2)', () => {
    const result = renderAnimation({ type: 'wave', text: 'Hi', frames: 1 });
    const content = result.split('\n').slice(1); // skip header
    expect(content).toHaveLength(5);
  });

  it('uses default text when none provided', () => {
    const result = renderAnimation({ type: 'wave', frames: 2 });
    // Wave distributes chars across rows, so check individual chars
    expect(result).toContain('H');
    expect(result).toContain('W');
    expect(result).toContain('!');
  });
});

describe('rain', () => {
  it('generates correct dimensions', () => {
    const result = renderAnimation({ type: 'rain', width: 25, height: 10, frames: 1 });
    const content = result.split('\n').slice(1);
    expect(content).toHaveLength(10);
    for (const line of content) {
      expect(line).toHaveLength(25);
    }
  });

  it('contains rain characters', () => {
    const result = renderAnimation({ type: 'rain', frames: 5 });
    const hasRain = ['|', ':', '.', "'"].some((c) => result.includes(c));
    expect(hasRain).toBe(true);
  });

  it('is deterministic with seed', () => {
    const a = renderAnimation({ type: 'rain', seed: 99, frames: 3 });
    const b = renderAnimation({ type: 'rain', seed: 99, frames: 3 });
    expect(a).toBe(b);
  });
});

describe('life', () => {
  it('renders all life styles', () => {
    for (const style of LIFE_STYLE_NAMES) {
      const result = renderAnimation({ type: 'life', style, frames: 3, width: 30, height: 15 });
      expect(result).toContain('--- frame 1/');
    }
  });

  it('generates correct dimensions', () => {
    const result = renderAnimation({ type: 'life', width: 20, height: 8, frames: 1 });
    const content = result.split('\n').slice(1);
    expect(content).toHaveLength(8);
    for (const line of content) {
      expect(line).toHaveLength(20);
    }
  });

  it('glider pattern produces live cells', () => {
    const result = renderAnimation({ type: 'life', style: 'glider', frames: 3, width: 20, height: 10 });
    expect(result).toContain('\u2588');
  });

  it('random is deterministic with seed', () => {
    const a = renderAnimation({ type: 'life', seed: 42, frames: 3 });
    const b = renderAnimation({ type: 'life', seed: 42, frames: 3 });
    expect(a).toBe(b);
  });
});

describe('bounce', () => {
  it('renders text inside a bordered box', () => {
    const result = renderAnimation({ type: 'bounce', text: 'Hi', frames: 3 });
    expect(result).toContain('+');
    expect(result).toContain('|');
    expect(result).toContain('Hi');
  });

  it('text moves between frames', () => {
    const result = renderAnimation({ type: 'bounce', text: 'X', frames: 5, width: 20, height: 10 });
    const frames = result.split(/--- frame \d+\/\d+ ---\n/).filter(Boolean);
    // Position should change between first and last frame
    expect(frames[0]).not.toBe(frames[frames.length - 1]);
  });

  it('handles multi-line text', () => {
    const result = renderAnimation({ type: 'bounce', text: 'AB\nCD', frames: 2, width: 20, height: 10 });
    expect(result).toContain('AB');
    expect(result).toContain('CD');
  });

  it('uses default text when none provided', () => {
    const result = renderAnimation({ type: 'bounce', frames: 2 });
    expect(result).toContain('( o_o)');
  });
});
