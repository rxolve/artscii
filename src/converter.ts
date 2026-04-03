import sharp from 'sharp';
import { MAX_BASE64_SIZE, MAX_FETCH_SIZE } from './constants.js';

const ASCII_RAMP = ' .:-=+*#%@';
const RAMP_LEN = ASCII_RAMP.length - 1; // 9

export interface ConvertOptions {
  width?: number;
  height?: number;
  invert?: boolean;
  contrast?: boolean;
  gamma?: number;
}

export interface ConvertResult {
  art64: string;
  art32: string;
  width64: number;
  height64: number;
  width32: number;
  height32: number;
}

/** Error thrown for invalid user input (bad image, bad URL, etc.) */
export class ConvertInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConvertInputError';
  }
}

/**
 * Core image-to-ASCII conversion. Ports the Python img2ascii.py algorithm.
 */
export async function convertImage(
  input: Buffer,
  opts: ConvertOptions = {},
): Promise<string> {
  const maxW = opts.width ?? 64;
  const maxH = opts.height ?? 32;
  const invert = opts.invert ?? false;
  const contrast = opts.contrast ?? true;
  const gamma = opts.gamma ?? 1.0;

  // Single sharp instance: get metadata then pipe through transformations
  const instance = sharp(input);
  const metadata = await instance.metadata();
  const origW = metadata.width ?? maxW;
  const origH = metadata.height ?? maxH;
  const aspect = origH / origW;

  let newW = maxW;
  let newH = Math.floor(newW * aspect * 0.5); // 0.5 compensates for terminal char aspect ratio

  if (newH > maxH) {
    newH = maxH;
    newW = Math.floor(newH / aspect * 2);
  }

  // Ensure at least 1x1
  newW = Math.max(newW, 1);
  newH = Math.max(newH, 1);

  // Build pipeline: flatten alpha → grayscale → optional normalise → resize → raw pixels
  let pipeline = instance.flatten({ background: '#ffffff' }).grayscale();

  if (contrast) {
    pipeline = pipeline.normalise();
  }

  const { data } = await pipeline
    .resize(newW, newH, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Pixel-by-pixel mapping to ASCII characters
  const lines: string[] = [];
  for (let y = 0; y < newH; y++) {
    let row = '';
    for (let x = 0; x < newW; x++) {
      let brightness = data[y * newW + x]; // grayscale: single channel, 0=black 255=white
      if (invert) {
        brightness = 255 - brightness;
      }
      const normalized = Math.pow(brightness / 255, gamma);
      const idx = Math.min(Math.floor(normalized * RAMP_LEN), RAMP_LEN);
      row += ASCII_RAMP[idx];
    }
    lines.push(row.trimEnd());
  }

  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Block private/internal IP ranges to prevent SSRF.
 */
function isPrivateUrl(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return true; // malformed URL → block
  }

  // localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;

  // Private IPv4 ranges
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
    if (parts[0] === 10) return true;                                          // 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;    // 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true;                    // 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;                    // 169.254.0.0/16 (link-local / cloud metadata)
    if (parts[0] === 0) return true;                                           // 0.0.0.0/8
  }

  return false;
}

/**
 * Fetch image from URL with timeout, content-type validation, and size limit.
 */
export async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (isPrivateUrl(url)) {
    throw new ConvertInputError('Fetching from private/internal addresses is not allowed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) {
      throw new ConvertInputError(`HTTP ${res.status} fetching image`);
    }
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.startsWith('image/')) {
      throw new ConvertInputError(`Expected image content-type, got "${ct}"`);
    }

    // Check Content-Length header before downloading
    const cl = res.headers.get('content-length');
    if (cl && parseInt(cl, 10) > MAX_FETCH_SIZE) {
      throw new ConvertInputError(`Image too large (${Math.round(parseInt(cl, 10) / 1024 / 1024)} MB, max ${MAX_FETCH_SIZE / 1024 / 1024} MB)`);
    }

    // Stream with size guard
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const reader = res.body?.getReader();
    if (!reader) throw new ConvertInputError('Failed to read response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > MAX_FETCH_SIZE) {
        reader.cancel();
        throw new ConvertInputError(`Image too large (max ${MAX_FETCH_SIZE / 1024 / 1024} MB)`);
      }
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Decode base64 or data-URI encoded image.
 */
export function decodeBase64Image(input: string): Buffer {
  // Strip data URI prefix if present
  const base64 = input.replace(/^data:image\/[^;]+;base64,/, '');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length === 0) {
    throw new ConvertInputError('Empty base64 image data');
  }
  if (buf.length > MAX_BASE64_SIZE) {
    throw new ConvertInputError(`Image exceeds ${MAX_BASE64_SIZE / 1024 / 1024} MB limit`);
  }
  return buf;
}

/**
 * Auto-detect URL vs base64 input and resolve to Buffer.
 */
export async function resolveImageInput(source: string): Promise<Buffer> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return fetchImageBuffer(source);
  }
  return decodeBase64Image(source);
}

/**
 * Convert image at both 64w and 32w sizes.
 */
export async function convertBothSizes(
  input: Buffer,
  opts: ConvertOptions = {},
): Promise<ConvertResult> {
  const baseOpts = { invert: opts.invert, contrast: opts.contrast, gamma: opts.gamma };

  const [art64, art32] = await Promise.all([
    convertImage(input, { ...baseOpts, width: 64, height: 32 }),
    convertImage(input, { ...baseOpts, width: 32, height: 16 }),
  ]);

  const lines64 = art64.split('\n');
  const lines32 = art32.split('\n');

  return {
    art64,
    art32,
    width64: Math.max(...lines64.map((l) => l.length), 0),
    height64: lines64.length,
    width32: Math.max(...lines32.map((l) => l.length), 0),
    height32: lines32.length,
  };
}
