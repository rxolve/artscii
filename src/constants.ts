import type { ArtSize } from './types.js';

export const SIZE_LIMITS: Record<ArtSize, { width: number; height: number }> = {
  16: { width: 16, height: 8 },
  32: { width: 32, height: 16 },
  64: { width: 64, height: 32 },
};

export const DEFAULT_SIZE: ArtSize = 16;

export const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FETCH_SIZE = 20 * 1024 * 1024; // 20 MB

export const MAX_DIAGRAM_NODES = 20;
export const MAX_DIAGRAM_ROWS = 50;
export const MAX_TREE_DEPTH = 10;

export const MAX_SEQUENCE_ACTORS = 10;
export const MAX_SEQUENCE_MESSAGES = 30;
export const MAX_TIMELINE_EVENTS = 30;
export const MAX_BAR_ITEMS = 20;
export const MAX_BAR_WIDTH = 40;

export const MAX_SPARKLINE_VALUES = 100;
export const MAX_SPARKLINE_WIDTH = 80;
export const MAX_HEATMAP_ROWS = 20;
export const MAX_HEATMAP_COLS = 20;
export const MAX_COMPOSE_BLOCKS = 10;
export const MAX_COMPOSE_GAP = 10;

export const MAX_CHARACTER_SEED_LENGTH = 200;
