import sharp from 'sharp';

const ASCII_RAMP = ' .:-=+*#%@';
const RAMP_LEN = ASCII_RAMP.length - 1;

// Braille: each character is a 2x4 dot grid (U+2800 base)
// Dot positions: [0,0]=0x01 [0,1]=0x02 [0,2]=0x04 [1,0]=0x08
//                [1,1]=0x10 [1,2]=0x20 [0,3]=0x40 [1,3]=0x80
const BRAILLE_MAP = [0x01, 0x02, 0x04, 0x40, 0x08, 0x10, 0x20, 0x80];

export type ConvertMode = 'ascii' | 'braille';

export interface ConvertOptions {
  width?: number;
  height?: number;
  invert?: boolean;
  contrast?: boolean;
  gamma?: number;
  mode?: ConvertMode;
  threshold?: number;
}

async function prepareImage(
  input: Buffer,
  targetW: number,
  targetH: number,
  contrast: boolean,
): Promise<{ data: Buffer; width: number; height: number }> {
  const instance = sharp(input);
  const metadata = await instance.metadata();
  const origW = metadata.width ?? targetW;
  const origH = metadata.height ?? targetH;
  const aspect = origH / origW;

  let newW = targetW;
  let newH = Math.floor(newW * aspect * 0.5);

  if (newH > targetH) {
    newH = targetH;
    newW = Math.floor(newH / aspect * 2);
  }

  newW = Math.max(newW, 1);
  newH = Math.max(newH, 1);

  let pipeline = instance.flatten({ background: '#ffffff' }).grayscale();
  if (contrast) {
    pipeline = pipeline.normalise();
  }

  const { data } = await pipeline
    .resize(newW, newH, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { data, width: newW, height: newH };
}

function renderAscii(
  data: Buffer,
  width: number,
  height: number,
  invert: boolean,
  gamma: number,
): string {
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      let brightness = data[y * width + x];
      if (invert) brightness = 255 - brightness;
      const normalized = Math.pow(brightness / 255, gamma);
      const idx = Math.min(Math.floor(normalized * RAMP_LEN), RAMP_LEN);
      row += ASCII_RAMP[idx];
    }
    lines.push(row.trimEnd());
  }
  return lines.join('\n');
}

function renderBraille(
  data: Buffer,
  width: number,
  height: number,
  invert: boolean,
  gamma: number,
  threshold: number,
): string {
  const lines: string[] = [];
  // Process in 2x4 blocks: 2 wide, 4 tall per braille character
  for (let y = 0; y < height; y += 4) {
    let row = '';
    for (let x = 0; x < width; x += 2) {
      let code = 0;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px < width && py < height) {
            let brightness = data[py * width + px];
            if (invert) brightness = 255 - brightness;
            const normalized = Math.pow(brightness / 255, gamma);
            if (normalized < threshold) {
              code |= BRAILLE_MAP[dy * 2 + dx];
            }
          }
        }
      }
      row += String.fromCharCode(0x2800 + code);
    }
    lines.push(row.trimEnd());
  }
  return lines.join('\n');
}

function trimTrailingEmpty(lines: string[]): string[] {
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }
  return lines;
}

export async function convertImage(
  input: Buffer,
  opts: ConvertOptions = {},
): Promise<string> {
  const mode = opts.mode ?? 'ascii';
  const invert = opts.invert ?? false;
  const contrast = opts.contrast ?? true;
  const gamma = opts.gamma ?? 1.0;
  const maxW = opts.width ?? 64;
  const maxH = opts.height ?? 32;

  // Braille: each char covers 2x4 pixels, so we can use more pixels
  const pixelW = mode === 'braille' ? maxW * 2 : maxW;
  const pixelH = mode === 'braille' ? maxH * 4 : maxH;

  const { data, width, height } = await prepareImage(input, pixelW, pixelH, contrast);

  if (mode === 'braille') {
    const threshold = opts.threshold ?? 0.5;
    const result = renderBraille(data, width, height, invert, gamma, threshold);
    return trimTrailingEmpty(result.split('\n')).join('\n');
  }

  const result = renderAscii(data, width, height, invert, gamma);
  return trimTrailingEmpty(result.split('\n')).join('\n');
}
