import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANIM_DIR = path.join(__dirname, '..', 'arts', 'animations');

export interface Animation {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  frames: string[];
  delay: number;
  loop: boolean;
}

let animations: Animation[] = [];

// --- Pre-built animation generators ---

function generateBounce(): Animation {
  const ball = '(●)';
  const w = 7;
  const positions = [4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3];
  const frames = positions.map((y) => {
    const lines: string[] = [];
    for (let row = 0; row < 5; row++) {
      lines.push(row === y ? `  ${ball}` : '');
    }
    // Ground line
    lines.push('───────');
    return lines.join('\n');
  });
  return { id: 'bounce', name: 'Bouncing Ball', description: 'A ball bouncing up and down', width: w, height: 6, frames, delay: 120, loop: true };
}

function generatePulse(): Animation {
  const small = [
    '  .♥.  ',
    '  .♥.  ',
  ];
  const medium = [
    '  .♥.  ',
    ' ♥♥♥♥♥ ',
    '  .♥.  ',
  ];
  const large = [
    '   ♥   ',
    ' ♥♥♥♥♥ ',
    ' ♥♥♥♥♥ ',
    '  ♥♥♥  ',
    '   ♥   ',
  ];
  const frames = [
    small.join('\n'),
    medium.join('\n'),
    large.join('\n'),
    large.join('\n'),
    medium.join('\n'),
    small.join('\n'),
  ];
  return { id: 'pulse', name: 'Heart Pulse', description: 'A beating heart', width: 7, height: 5, frames, delay: 200, loop: true };
}

function generateSpin(): Animation {
  const chars = ['|', '/', '—', '\\', '|', '/', '—', '\\'];
  const frames = chars.map((c) => `  ${c}  `);
  return { id: 'spin', name: 'Spinner', description: 'A rotating spinner', width: 5, height: 1, frames, delay: 100, loop: true };
}

function generateWave(): Animation {
  const base = '~≈~≈~≈~≈~≈~≈~≈~≈';
  const frames: string[] = [];
  for (let i = 0; i < 8; i++) {
    const shifted = base.slice(i) + base.slice(0, i);
    frames.push(shifted.slice(0, 16));
  }
  return { id: 'wave', name: 'Ocean Wave', description: 'Flowing wave pattern', width: 16, height: 1, frames, delay: 150, loop: true };
}

function generateBlink(): Animation {
  const open = [
    ' ◉ ◉ ',
    '  ▽  ',
  ];
  const half = [
    ' ─ ─ ',
    '  ▽  ',
  ];
  const closed = [
    ' ─ ─ ',
    '  △  ',
  ];
  const frames = [
    open.join('\n'),
    open.join('\n'),
    open.join('\n'),
    open.join('\n'),
    half.join('\n'),
    closed.join('\n'),
    half.join('\n'),
    open.join('\n'),
  ];
  return { id: 'blink', name: 'Blink', description: 'Blinking face', width: 6, height: 2, frames, delay: 150, loop: true };
}

function generateLoading(): Animation {
  const frames: string[] = [];
  const w = 10;
  for (let i = 0; i <= w; i++) {
    const filled = '█'.repeat(i);
    const empty = '░'.repeat(w - i);
    frames.push(`[${filled}${empty}]`);
  }
  // Reverse back
  for (let i = w - 1; i >= 0; i--) {
    const filled = '█'.repeat(i);
    const empty = '░'.repeat(w - i);
    frames.push(`[${filled}${empty}]`);
  }
  return { id: 'loading', name: 'Loading', description: 'Loading bar animation', width: 12, height: 1, frames, delay: 80, loop: true };
}

function generateFirework(): Animation {
  const frames = [
    '    ·    ',
    '    |    ',
    '    ↑    ',
    '    *    ',
    '   ***   ',
    '  * * *  ',
    ' *  *  * ',
    '  · · ·  ',
    '   · ·   ',
    '    ·    ',
    '         ',
  ];
  return { id: 'firework', name: 'Firework', description: 'A firework explosion', width: 9, height: 1, frames: frames.map(f => f), delay: 150, loop: false };
}

function generateRain(): Animation {
  const w = 16;
  const h = 6;
  const drops = [
    [2,0],[7,1],[12,2],[4,3],[9,4],[14,0],[1,2],[6,4],[11,1],[3,5],[8,3],[13,5],
  ];
  const frames: string[] = [];
  for (let frame = 0; frame < 8; frame++) {
    const grid: string[][] = Array.from({ length: h }, () => Array(w).fill(' '));
    for (const [x, startY] of drops) {
      const y = (startY + frame) % h;
      if (x < w && y < h) grid[y][x] = '│';
      const y2 = (startY + frame + 3) % h;
      if (x < w && y2 < h && grid[y2][x] === ' ') grid[y2][x] = '·';
    }
    frames.push(grid.map(row => row.join('')).join('\n'));
  }
  return { id: 'rain', name: 'Rain', description: 'Falling rain drops', width: w, height: h, frames, delay: 150, loop: true };
}

function generateCatWalk(): Animation {
  const frame1 = [
    '  /\\_/\\  ',
    ' ( o.o ) ',
    '  > ^ <  ',
    ' /|   |\\ ',
    '(_|   |_)',
  ];
  const frame2 = [
    '  /\\_/\\  ',
    ' ( o.o ) ',
    '  > ^ <  ',
    '  /| |\\  ',
    ' (_| |_) ',
  ];
  const frame3 = [
    '  /\\_/\\  ',
    ' ( o.o ) ',
    '  > ^ <  ',
    ' |/   \\| ',
    ' (_) (_) ',
  ];
  const frame4 = [
    '  /\\_/\\  ',
    ' ( o.o ) ',
    '  > ^ <  ',
    '  /| |\\  ',
    ' (_| |_) ',
  ];
  const frames = [frame1, frame2, frame3, frame4].map(f => f.join('\n'));
  return { id: 'cat-walk', name: 'Walking Cat', description: 'A cat walking in place', width: 9, height: 5, frames, delay: 200, loop: true };
}

function generateTyping(): Animation {
  const text = 'Hello, World!';
  const frames: string[] = [];
  for (let i = 0; i <= text.length; i++) {
    frames.push(text.slice(0, i) + '█');
  }
  // Blink cursor at end
  frames.push(text + '█');
  frames.push(text + ' ');
  frames.push(text + '█');
  frames.push(text + ' ');
  return { id: 'typing', name: 'Typing', description: 'Typewriter text effect', width: text.length + 1, height: 1, frames, delay: 100, loop: false };
}

// --- Registry ---

const BUILTIN_ANIMATIONS: (() => Animation)[] = [
  generateBounce,
  generatePulse,
  generateSpin,
  generateWave,
  generateBlink,
  generateLoading,
  generateFirework,
  generateRain,
  generateCatWalk,
  generateTyping,
];

export function loadAnimations(): void {
  animations = BUILTIN_ANIMATIONS.map((gen) => gen());
}

export function listAnimations(): { id: string; name: string; description: string; frames: number; delay: number; loop: boolean }[] {
  return animations.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    frames: a.frames.length,
    delay: a.delay,
    loop: a.loop,
  }));
}

export function getAnimation(id: string): Animation | undefined {
  return animations.find((a) => a.id === id);
}

export function formatForTerminal(anim: Animation): string {
  // Return a bash script that plays the animation
  const escaped = anim.frames.map((f) =>
    f.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
  );
  const delayS = (anim.delay / 1000).toFixed(2);

  const lines = [
    '#!/bin/bash',
    '# ' + anim.name + ' — ' + anim.description,
    'tput civis 2>/dev/null  # hide cursor',
    `trap 'tput cnorm 2>/dev/null; exit' INT TERM`,
    'frames=(',
  ];

  for (const frame of escaped) {
    lines.push(`'${frame}'`);
  }

  lines.push(')');

  if (anim.loop) {
    lines.push('while true; do');
  } else {
    lines.push('for i in 1; do');
  }

  lines.push('  for frame in "${frames[@]}"; do');
  lines.push('    tput home 2>/dev/null || printf "\\033[H"');
  lines.push('    printf "%s\\n" "$frame"');
  lines.push(`    sleep ${delayS}`);
  lines.push('  done');
  lines.push('done');
  lines.push('tput cnorm 2>/dev/null  # restore cursor');

  return lines.join('\n');
}

export function formatFrames(anim: Animation): string {
  const header = `# ${anim.name} (${anim.frames.length} frames, ${anim.delay}ms, ${anim.loop ? 'loop' : 'once'})`;
  const separator = '\n---\n';
  return header + '\n\n' + anim.frames.join(separator);
}
