import { readArt, getById, listAll } from './store.js';
import type { ArtEntry } from './types.js';

export interface Animation {
  frames: string[];
  delay: number;
  loop: boolean;
}

export type MotionType = 'bounce' | 'shake' | 'blink' | 'slide' | 'reveal' | 'fade' | 'pulse' | 'rain';

export const MOTIONS: MotionType[] = ['bounce', 'shake', 'blink', 'slide', 'reveal', 'fade', 'pulse', 'rain'];

// --- Motion functions: transform art text into animation frames ---

function padFrame(lines: string[], width: number, height: number): string[] {
  const padded = lines.map((l) => l.padEnd(width));
  while (padded.length < height) padded.push(' '.repeat(width));
  return padded;
}

function shiftY(lines: string[], width: number, totalHeight: number, offsetY: number): string {
  const result: string[] = [];
  for (let y = 0; y < totalHeight; y++) {
    const srcY = y - offsetY;
    result.push(srcY >= 0 && srcY < lines.length ? lines[srcY].padEnd(width) : ' '.repeat(width));
  }
  return result.join('\n');
}

function shiftX(lines: string[], offset: number, canvasWidth: number): string {
  return lines.map((line) => {
    if (offset > 0) return ' '.repeat(offset) + line;
    if (offset < 0) return line.slice(-offset).padEnd(canvasWidth);
    return line;
  }).join('\n');
}

function motionBounce(lines: string[], width: number, height: number): Animation {
  const totalH = height + 4;
  const positions = [2, 1, 0, 1, 2, 3, 4, 3];
  const frames = positions.map((y) => shiftY(lines, width, totalH, y));
  return { frames, delay: 120, loop: true };
}

function motionShake(lines: string[], width: number): Animation {
  const offsets = [0, 1, -1, 2, -2, 1, -1, 0];
  const canvasW = width + 4;
  const centered = lines.map((l) => '  ' + l);
  const frames = offsets.map((dx) => shiftX(centered, dx, canvasW));
  return { frames, delay: 80, loop: true };
}

function motionBlink(lines: string[]): Animation {
  const visible = lines.join('\n');
  const blank = lines.map((l) => ' '.repeat(l.length)).join('\n');
  const frames = [visible, visible, visible, visible, blank, blank, visible, visible];
  return { frames, delay: 200, loop: true };
}

function motionSlide(lines: string[], width: number): Animation {
  const canvasW = width + 20;
  const frames: string[] = [];
  for (let x = -width; x <= canvasW; x += 2) {
    frames.push(shiftX(lines, x, canvasW));
  }
  return { frames, delay: 60, loop: false };
}

function motionReveal(lines: string[]): Animation {
  const frames: string[] = [];
  for (let i = 1; i <= lines.length; i++) {
    frames.push(lines.slice(0, i).join('\n'));
  }
  // Hold the full frame
  frames.push(lines.join('\n'));
  frames.push(lines.join('\n'));
  return { frames, delay: 100, loop: false };
}

function motionFade(lines: string[]): Animation {
  const ramp = ['@', '#', '*', '+', ':', '.', ' '];
  const frames: string[] = [lines.join('\n')];

  for (let step = 0; step < ramp.length; step++) {
    const faded = lines.map((line) =>
      line.split('').map((ch) => {
        if (ch === ' ') return ' ';
        const idx = ramp.indexOf(ch);
        if (idx >= 0 && idx + step < ramp.length) return ramp[idx + step];
        if (idx === -1 && step > 0) return ramp[Math.min(step, ramp.length - 1)];
        return ch;
      }).join('')
    );
    frames.push(faded.join('\n'));
  }

  return { frames, delay: 150, loop: false };
}

function motionPulse(lines: string[]): Animation {
  const full = lines.join('\n');
  // Create a "shrunk" version by removing outer chars
  const shrunk = lines.map((l) => {
    if (l.length <= 2) return ' '.repeat(l.length);
    return ' ' + l.slice(1, -1) + ' ';
  }).join('\n');
  const frames = [shrunk, full, full, full, shrunk, shrunk];
  return { frames, delay: 200, loop: true };
}

function motionRain(lines: string[], width: number, height: number): Animation {
  const frames: string[] = [];
  const drops = Array.from({ length: 8 }, () => [
    Math.floor(Math.random() * width),
    Math.floor(Math.random() * height),
  ]);

  for (let frame = 0; frame < 8; frame++) {
    const grid = lines.map((l) => l.split(''));
    // Pad grid to full height
    while (grid.length < height) grid.push(Array(width).fill(' '));

    for (const [x, startY] of drops) {
      const y = (startY + frame) % height;
      if (x < width && y < grid.length) {
        if (grid[y][x] === ' ' || grid[y][x] === undefined) {
          grid[y][x] = '·';
        }
      }
    }
    frames.push(grid.map((row) => row.join('')).join('\n'));
  }
  return { frames, delay: 150, loop: true };
}

// --- Compose: object + motion ---

export function composeAnimation(art: string, motion: MotionType): Animation {
  const lines = art.split('\n');
  const width = Math.max(...lines.map((l) => l.length));
  const height = lines.length;
  const padded = padFrame(lines, width, height);

  switch (motion) {
    case 'bounce': return motionBounce(padded, width, height);
    case 'shake': return motionShake(padded, width);
    case 'blink': return motionBlink(padded);
    case 'slide': return motionSlide(padded, width);
    case 'reveal': return motionReveal(padded);
    case 'fade': return motionFade(padded);
    case 'pulse': return motionPulse(padded);
    case 'rain': return motionRain(padded, width, height);
  }
}

// --- Output formatting ---

export function formatScript(anim: Animation, name: string): string {
  const escaped = anim.frames.map((f) =>
    f.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
  );
  const delayS = (anim.delay / 1000).toFixed(2);

  const lines = [
    '#!/bin/bash',
    `# ${name}`,
    'tput civis 2>/dev/null',
    `trap 'tput cnorm 2>/dev/null; exit' INT TERM`,
    'frames=(',
  ];

  for (const frame of escaped) {
    lines.push(`'${frame}'`);
  }

  lines.push(')');
  lines.push(anim.loop ? 'while true; do' : 'for i in 1; do');
  lines.push('  for frame in "${frames[@]}"; do');
  lines.push('    tput home 2>/dev/null || printf "\\033[H"');
  lines.push('    printf "%s\\n" "$frame"');
  lines.push(`    sleep ${delayS}`);
  lines.push('  done');
  lines.push('done');
  lines.push('tput cnorm 2>/dev/null');

  return lines.join('\n');
}

export function formatFrames(anim: Animation, name: string): string {
  const header = `# ${name} (${anim.frames.length} frames, ${anim.delay}ms, ${anim.loop ? 'loop' : 'once'})`;
  return header + '\n\n' + anim.frames.join('\n---\n');
}
