export type AnimationType = 'typing' | 'matrix' | 'spinner' | 'fire' | 'wave' | 'rain' | 'life' | 'bounce';

export const ANIMATION_TYPES: AnimationType[] = ['typing', 'matrix', 'spinner', 'fire', 'wave', 'rain', 'life', 'bounce'];

export const SPINNER_STYLE_NAMES = ['dots', 'line', 'circle', 'square', 'arrow', 'bounce', 'bar', 'braille'] as const;
export type SpinnerStyle = (typeof SPINNER_STYLE_NAMES)[number];

export const LIFE_STYLE_NAMES = ['random', 'glider', 'pulsar'] as const;
export type LifeStyle = (typeof LIFE_STYLE_NAMES)[number];

const DEFAULT_FRAMES = 10;
const DEFAULT_WIDTH = 40;
const DEFAULT_HEIGHT = 12;

// Seeded PRNG (mulberry32)
function createRng(seed: number): () => number {
  let t = seed | 0 || 1;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export interface AnimateOptions {
  type: AnimationType;
  text?: string;
  frames?: number;
  width?: number;
  height?: number;
  seed?: number;
  style?: string;
}

export function renderAnimation(options: AnimateOptions): string {
  let frames: string[];

  switch (options.type) {
    case 'typing':  frames = animateTyping(options);  break;
    case 'matrix':  frames = animateMatrix(options);  break;
    case 'spinner': frames = animateSpinner(options); break;
    case 'fire':    frames = animateFire(options);    break;
    case 'wave':    frames = animateWave(options);    break;
    case 'rain':    frames = animateRain(options);    break;
    case 'life':    frames = animateLife(options);    break;
    case 'bounce':  frames = animateBounce(options);  break;
  }

  return frames
    .map((f, i) => `--- frame ${i + 1}/${frames.length} ---\n${f}`)
    .join('\n\n');
}

// ── Typing ──────────────────────────────────────────────────────────────────

function animateTyping(opts: AnimateOptions): string[] {
  const text = opts.text || 'Hello, World!';
  const totalChars = text.length;
  const frameCount = Math.min(opts.frames || totalChars, totalChars);
  const charsPerFrame = Math.max(1, Math.ceil(totalChars / frameCount));
  const frames: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    const visible = Math.min((i + 1) * charsPerFrame, totalChars);
    const cursor = visible < totalChars ? '\u2588' : '';
    frames.push(text.slice(0, visible) + cursor);
  }

  if (frames[frames.length - 1] !== text) {
    frames.push(text);
  }

  return frames;
}

// ── Matrix ──────────────────────────────────────────────────────────────────

function animateMatrix(opts: AnimateOptions): string[] {
  const width = opts.width || DEFAULT_WIDTH;
  const height = opts.height || DEFAULT_HEIGHT;
  const frameCount = opts.frames || DEFAULT_FRAMES;
  const rng = createRng(opts.seed ?? 42);

  const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789';

  const streams: { pos: number; speed: number; length: number }[] = [];
  for (let x = 0; x < width; x++) {
    streams.push({
      pos: Math.floor(rng() * height * 2) - height,
      speed: 1 + Math.floor(rng() * 2),
      length: 3 + Math.floor(rng() * (height - 2)),
    });
  }

  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

    for (let x = 0; x < width; x++) {
      const s = streams[x];
      for (let i = 0; i < s.length; i++) {
        const y = s.pos - i;
        if (y >= 0 && y < height) {
          grid[y][x] = chars[Math.floor(rng() * chars.length)];
        }
      }
      s.pos += s.speed;
      if (s.pos - s.length > height) {
        s.pos = -Math.floor(rng() * height);
        s.length = 3 + Math.floor(rng() * (height - 2));
        s.speed = 1 + Math.floor(rng() * 2);
      }
    }

    frames.push(grid.map((row) => row.join('')).join('\n'));
  }

  return frames;
}

// ── Spinner ─────────────────────────────────────────────────────────────────

const SPINNER_CHARS: Record<SpinnerStyle, string[]> = {
  dots:    ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line:    ['|', '/', '-', '\\'],
  circle:  ['◐', '◓', '◑', '◒'],
  square:  ['◰', '◳', '◲', '◱'],
  arrow:   ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce:  ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
  bar:     ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[====]', '[ ===]', '[  ==]', '[   =]'],
  braille: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
};

function animateSpinner(opts: AnimateOptions): string[] {
  const style = (opts.style || 'dots') as SpinnerStyle;
  const chars = SPINNER_CHARS[style] || SPINNER_CHARS.dots;
  const text = opts.text || 'Loading...';
  const frameCount = opts.frames || chars.length;

  const frames: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push(`${chars[i % chars.length]} ${text}`);
  }
  return frames;
}

// ── Fire ────────────────────────────────────────────────────────────────────

function animateFire(opts: AnimateOptions): string[] {
  const width = opts.width || DEFAULT_WIDTH;
  const height = opts.height || DEFAULT_HEIGHT;
  const frameCount = opts.frames || DEFAULT_FRAMES;
  const rng = createRng(opts.seed ?? 42);

  const palette = ' .:-=+*#%@';
  const maxHeat = palette.length - 1;

  const buffer: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    // Bottom row = max heat source
    for (let x = 0; x < width; x++) {
      buffer[height - 1][x] = maxHeat;
    }

    // Propagate upward with random decay
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.max(0, Math.min(width - 1, x + Math.floor(rng() * 3) - 1));
        const decay = Math.floor(rng() * 2);
        buffer[y][x] = Math.max(0, buffer[y + 1][srcX] - decay);
      }
    }

    frames.push(buffer.map((row) => row.map((v) => palette[v]).join('')).join('\n'));
  }

  return frames;
}

// ── Wave ────────────────────────────────────────────────────────────────────

function animateWave(opts: AnimateOptions): string[] {
  const text = opts.text || 'Hello, World!';
  const frameCount = opts.frames || DEFAULT_FRAMES;
  const amplitude = 2;
  const totalRows = amplitude * 2 + 1;

  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    const phase = (f / frameCount) * Math.PI * 2;
    const lines: string[] = Array(totalRows).fill('');

    for (let i = 0; i < text.length; i++) {
      const offset = Math.round(Math.sin(phase + (i / text.length) * Math.PI * 2) * amplitude);
      const targetRow = amplitude + offset;

      for (let row = 0; row < totalRows; row++) {
        lines[row] += row === targetRow ? text[i] : ' ';
      }
    }

    frames.push(lines.join('\n'));
  }

  return frames;
}

// ── Rain ────────────────────────────────────────────────────────────────────

function animateRain(opts: AnimateOptions): string[] {
  const width = opts.width || DEFAULT_WIDTH;
  const height = opts.height || DEFAULT_HEIGHT;
  const frameCount = opts.frames || DEFAULT_FRAMES;
  const rng = createRng(opts.seed ?? 42);

  const dropChars = ['|', ':', '.', "'"];
  const splashChars = ['*', '\u00b7', '\u00b0'];
  const dropCount = Math.max(1, Math.floor(width * 0.3));

  const drops: { x: number; y: number; speed: number; char: string }[] = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push({
      x: Math.floor(rng() * width),
      y: Math.floor(rng() * height),
      speed: 1 + Math.floor(rng() * 2),
      char: dropChars[Math.floor(rng() * dropChars.length)],
    });
  }

  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

    for (const drop of drops) {
      if (drop.y >= 0 && drop.y < height) {
        grid[drop.y][drop.x] = drop.char;
        if (drop.y > 0) grid[drop.y - 1][drop.x] = '.';
      }

      if (drop.y === height - 1) {
        const splash = splashChars[Math.floor(rng() * splashChars.length)];
        if (drop.x > 0) grid[height - 1][drop.x - 1] = splash;
        if (drop.x < width - 1) grid[height - 1][drop.x + 1] = splash;
      }

      drop.y += drop.speed;
      if (drop.y >= height) {
        drop.y = -Math.floor(rng() * 3);
        drop.x = Math.floor(rng() * width);
        drop.speed = 1 + Math.floor(rng() * 2);
      }
    }

    frames.push(grid.map((row) => row.join('')).join('\n'));
  }

  return frames;
}

// ── Life (Conway's Game of Life) ────────────────────────────────────────────

function animateLife(opts: AnimateOptions): string[] {
  const width = opts.width || 30;
  const height = opts.height || 15;
  const frameCount = opts.frames || DEFAULT_FRAMES;
  const rng = createRng(opts.seed ?? 42);
  const style = opts.style || 'random';

  let grid: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  if (style === 'glider') {
    const cy = Math.floor(height / 4);
    const cx = Math.floor(width / 4);
    for (const [dy, dx] of [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]]) {
      if (cy + dy < height && cx + dx < width) grid[cy + dy][cx + dx] = true;
    }
  } else if (style === 'pulsar') {
    const cy = Math.floor(height / 2);
    const cx = Math.floor(width / 2);
    const offsets = [
      [-6, -4], [-6, -3], [-6, -2], [-6, 2], [-6, 3], [-6, 4],
      [-4, -6], [-3, -6], [-2, -6], [-4, -1], [-3, -1], [-2, -1],
      [-4, 1], [-3, 1], [-2, 1], [-4, 6], [-3, 6], [-2, 6],
      [-1, -4], [-1, -3], [-1, -2], [-1, 2], [-1, 3], [-1, 4],
      [1, -4], [1, -3], [1, -2], [1, 2], [1, 3], [1, 4],
      [2, -6], [3, -6], [4, -6], [2, -1], [3, -1], [4, -1],
      [2, 1], [3, 1], [4, 1], [2, 6], [3, 6], [4, 6],
      [6, -4], [6, -3], [6, -2], [6, 2], [6, 3], [6, 4],
    ];
    for (const [dy, dx] of offsets) {
      const y = cy + dy, x = cx + dx;
      if (y >= 0 && y < height && x >= 0 && x < width) grid[y][x] = true;
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x] = rng() < 0.3;
      }
    }
  }

  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    frames.push(grid.map((row) => row.map((c) => (c ? '\u2588' : ' ')).join('')).join('\n'));

    const next: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (grid[(y + dy + height) % height][(x + dx + width) % width]) n++;
          }
        }
        next[y][x] = grid[y][x] ? n === 2 || n === 3 : n === 3;
      }
    }
    grid = next;
  }

  return frames;
}

// ── Bounce ──────────────────────────────────────────────────────────────────

function animateBounce(opts: AnimateOptions): string[] {
  const text = opts.text || '( o_o)';
  const lines = text.split('\n');
  const textW = Math.max(...lines.map((l) => l.length));
  const textH = lines.length;

  const width = Math.max((opts.width || DEFAULT_WIDTH), textW + 4);
  const height = Math.max((opts.height || DEFAULT_HEIGHT), textH + 4);
  const frameCount = opts.frames || DEFAULT_FRAMES;

  const innerW = width - 2;
  const innerH = height - 2;
  const maxX = innerW - textW;
  const maxY = innerH - textH;

  let x = 1, y = 1, dx = 1, dy = 1;
  const hBorder = '+' + '-'.repeat(innerW) + '+';
  const frames: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    const rows: string[] = [hBorder];

    for (let row = 0; row < innerH; row++) {
      const lineIdx = row - y;
      if (lineIdx >= 0 && lineIdx < textH) {
        const line = lines[lineIdx];
        const pad = x;
        rows.push('|' + ' '.repeat(pad) + line + ' '.repeat(Math.max(0, innerW - pad - line.length)) + '|');
      } else {
        rows.push('|' + ' '.repeat(innerW) + '|');
      }
    }

    rows.push(hBorder);
    frames.push(rows.join('\n'));

    x += dx;
    y += dy;
    if (x <= 0 || x >= maxX) { dx = -dx; x = Math.max(0, Math.min(maxX, x + dx)); }
    if (y <= 0 || y >= maxY) { dy = -dy; y = Math.max(0, Math.min(maxY, y + dy)); }
  }

  return frames;
}
