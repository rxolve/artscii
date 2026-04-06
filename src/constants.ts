import type { ArtSize } from './types.js';

export const SIZE_LIMITS: Record<ArtSize, { width: number; height: number }> = {
  16: { width: 16, height: 8 },
  32: { width: 32, height: 16 },
  64: { width: 64, height: 32 },
};

export const DEFAULT_SIZE: ArtSize = 16;

export const MAX_USER_ARTS = 100;
export const RATE_LIMIT_PER_MIN = 5;
export const MAX_NAME_LENGTH = 30;
export const MAX_TAG_LENGTH = 20;
export const MAX_TAGS = 5;
export const MAX_DESCRIPTION_LENGTH = 200;

export const CONVERT_RATE_LIMIT_PER_MIN = 3;
export const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FETCH_SIZE = 20 * 1024 * 1024; // 20 MB

export const DIAGRAM_RATE_LIMIT_PER_MIN = 10;
export const MAX_DIAGRAM_NODES = 20;
export const MAX_DIAGRAM_ROWS = 50;
export const MAX_TREE_DEPTH = 10;
export const MAX_CELL_LENGTH = 50;
